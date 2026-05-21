'use strict';

process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = require('../../src/app');
const { migrate, truncate, teardown } = require('../helpers/db');
const { createOrder, defaultAddress }  = require('../helpers/factories');

// Stub RabbitMQ — no broker needed for integration tests
jest.mock('../../src/config/rabbitmq', () => ({
  connect:     jest.fn().mockResolvedValue(undefined),
  publish:     jest.fn().mockResolvedValue(undefined),
  close:       jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(true),
}));

const makeToken = (role = 'customer', userId = uuidv4()) =>
  jwt.sign({ userId, email: 'u@test.com', role }, 'test-secret', { expiresIn: '1h' });

const sampleItems = () => ([{
  productId:   uuidv4(),
  productName: 'Test Widget',
  productSku:  'SKU-001',
  unitPrice:   999,
  quantity:    2,
}]);

beforeAll(() => migrate());
afterEach(() => truncate());
afterAll(() => teardown());

describe('POST /api/v1/orders', () => {
  it('201 — customer places an order', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: sampleItems(), shippingAddress: defaultAddress });

    expect(res.status).toBe(201);
    expect(res.body.order).toHaveProperty('id');
    expect(res.body.order.status).toBe('pending');
    expect(res.body.order.items).toHaveLength(1);
  });

  it('400 — empty items array rejected', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ items: [], shippingAddress: defaultAddress });

    expect(res.status).toBe(400);
  });

  it('400 — missing shippingAddress', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ items: sampleItems() });

    expect(res.status).toBe(400);
  });

  it('401 — no token', async () => {
    const res = await request(app).post('/api/v1/orders').send({ items: sampleItems() });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/orders/my', () => {
  it('200 — returns only the authenticated user orders', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);

    await createOrder({ userId });
    await createOrder({ userId });
    await createOrder(); // different user

    const res = await request(app)
      .get('/api/v1/orders/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
  });

  it('filters by status', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);

    await createOrder({ userId, status: 'confirmed' });
    await createOrder({ userId, status: 'pending' });

    const res = await request(app)
      .get('/api/v1/orders/my?status=confirmed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.orders.every((o) => o.status === 'confirmed')).toBe(true);
  });
});

describe('GET /api/v1/orders/:id', () => {
  it('200 — owner can view their order', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);
    const order  = await createOrder({ userId });

    const res = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(order.id);
    expect(res.body.order.items).toHaveLength(1);
  });

  it('404 — customer cannot view another user order', async () => {
    const order = await createOrder(); // different user
    const res   = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${makeToken('customer', uuidv4())}`);

    expect(res.status).toBe(404);
  });

  it('200 — admin can view any order', async () => {
    const order = await createOrder();
    const res   = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/orders/:id/cancel', () => {
  it('200 — owner can cancel a pending order', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);
    const order  = await createOrder({ userId });

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
  });

  it('422 — cannot cancel a shipped order', async () => {
    const userId = uuidv4();
    const token  = makeToken('customer', userId);
    const order  = await createOrder({ userId, status: 'shipped' });

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Too late' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CANNOT_CANCEL');
  });
});

describe('PATCH /api/v1/orders/:id/status (admin)', () => {
  it('200 — admin advances order status', async () => {
    const order = await createOrder();

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('confirmed');
  });

  it('422 — invalid transition rejected', async () => {
    const order = await createOrder();

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ status: 'delivered' }); // pending → delivered not allowed

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('403 — customer cannot update status', async () => {
    const order = await createOrder();

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${makeToken('customer')}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/orders (admin)', () => {
  it('200 — admin sees all orders', async () => {
    await createOrder();
    await createOrder();
    await createOrder();

    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(3);
  });

  it('403 — customer cannot access admin list', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${makeToken('customer')}`);

    expect(res.status).toBe(403);
  });
});