'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../../src/app');
const { connect, disconnect, clearAll } = require('../helpers/db');
const { createCategory, createProduct } = require('../helpers/factories');

// Stub Redis cache so tests don't need a live Redis
jest.mock('../../src/config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  delPattern: jest.fn().mockResolvedValue(null),
  quit: jest.fn(),
}));

const makeToken = (role = 'admin') =>
  jwt.sign({ userId: 'u1', email: 'admin@example.com', role }, 'test-secret', { expiresIn: '1h' });

beforeAll(() => connect());
afterEach(() => clearAll());
afterAll(() => disconnect());

describe('GET /api/v1/products', () => {
  it('200 — returns empty paginated list', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data).toEqual([]);
  });

  it('200 — returns created products', async () => {
    await createProduct();
    await createProduct();
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });
});

describe('GET /api/v1/products/:id', () => {
  it('200 — returns single product', async () => {
    const product = await createProduct();
    const res = await request(app).get(`/api/v1/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe(product.name);
  });

  it('404 — unknown id', async () => {
    const res = await request(app).get('/api/v1/products/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/products', () => {
  it('201 — admin can create a product', async () => {
    const cat = await createCategory();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ name: 'New Product', price: 19.99, category: cat._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('New Product');
    expect(res.body.product.slug).toBe('new-product');
  });

  it('401 — unauthenticated request rejected', async () => {
    const res = await request(app).post('/api/v1/products').send({ name: 'X', price: 1, category: 'abc' });
    expect(res.status).toBe(401);
  });

  it('403 — customer cannot create product', async () => {
    const cat = await createCategory();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${makeToken('customer')}`)
      .send({ name: 'X', price: 1, category: cat._id.toString() });
    expect(res.status).toBe(403);
  });

  it('400 — missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/products/:id', () => {
  it('200 — admin can update a product', async () => {
    const product = await createProduct();
    const res = await request(app)
      .patch(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ price: 49.99 });

    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(49.99);
  });
});

describe('DELETE /api/v1/products/:id', () => {
  it('204 — admin can soft-delete a product', async () => {
    const product = await createProduct();
    const res = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${makeToken('admin')}`);
    expect(res.status).toBe(204);
  });
});

describe('PATCH /api/v1/products/:id/stock', () => {
  it('200 — admin can update stock', async () => {
    const product = await createProduct();
    const res = await request(app)
      .patch(`/api/v1/products/${product._id}/stock`)
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ quantity: 250 });

    expect(res.status).toBe(200);
    expect(res.body.product.inventory.quantity).toBe(250);
  });

  it('400 — negative quantity rejected', async () => {
    const product = await createProduct();
    const res = await request(app)
      .patch(`/api/v1/products/${product._id}/stock`)
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ quantity: -5 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/products/search', () => {
  it('200 — searches by text', async () => {
    await createProduct({ name: 'Apple iPhone', tags: ['phone', 'apple'] });
    const res = await request(app).get('/api/v1/products/search?q=iPhone');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pagination');
  });
});