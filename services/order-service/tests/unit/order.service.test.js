'use strict';

process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = 'test-secret';

const OrderService       = require('../../src/services/order.service');
const OrderRepository    = require('../../src/repositories/order.repository');
const OrderItemRepository= require('../../src/repositories/orderItem.repository');
const MessagingService   = require('../../src/services/messaging.service');
const db                 = require('../../src/config/db');

jest.mock('../../src/repositories/order.repository');
jest.mock('../../src/repositories/orderItem.repository');
jest.mock('../../src/services/messaging.service');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

// Make withTransaction call the callback with a mock client
jest.mock('../../src/config/db', () => ({
  withTransaction: jest.fn(async (fn) => fn({})),
}));

const { v4: uuidv4 } = require('uuid');

const mockOrder = {
  id:           uuidv4(),
  user_id:      uuidv4(),
  status:       'pending',
  total_amount: '2498.00',
  items:        [{ productId: uuidv4(), productName: 'Widget', unitPrice: 999, quantity: 2 }],
};

const sampleBody = {
  items: [{ productId: uuidv4(), productName: 'Widget', unitPrice: 999, quantity: 2 }],
  shippingAddress: { fullName: 'Ali', street: '1 Main St', city: 'Karachi', postalCode: '74200', country: 'PK' },
};

beforeEach(() => {
  jest.clearAllMocks();
  MessagingService.orderPlaced.mockResolvedValue(undefined);
  MessagingService.orderCancelled.mockResolvedValue(undefined);
  MessagingService.orderConfirmed.mockResolvedValue(undefined);
});

describe('OrderService.placeOrder', () => {
  it('creates order and publishes event', async () => {
    OrderRepository.create.mockResolvedValue(mockOrder);
    OrderItemRepository.bulkCreate.mockResolvedValue(mockOrder.items);

    const result = await OrderService.placeOrder(mockOrder.user_id, sampleBody);

    expect(OrderRepository.create).toHaveBeenCalledTimes(1);
    expect(OrderItemRepository.bulkCreate).toHaveBeenCalledTimes(1);
    expect(MessagingService.orderPlaced).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(mockOrder.id);
  });

  it('throws 400 for empty items array', async () => {
    await expect(
      OrderService.placeOrder(uuidv4(), { ...sampleBody, items: [] })
    ).rejects.toMatchObject({ statusCode: 400, code: 'EMPTY_ORDER' });
  });

  it('still returns order even if event publishing fails', async () => {
    OrderRepository.create.mockResolvedValue(mockOrder);
    OrderItemRepository.bulkCreate.mockResolvedValue(mockOrder.items);
    MessagingService.orderPlaced.mockRejectedValue(new Error('RabbitMQ down'));

    const result = await OrderService.placeOrder(mockOrder.user_id, sampleBody);
    expect(result.id).toBe(mockOrder.id); // order saved even if event failed
  });
});

describe('OrderService.getOrderById', () => {
  it('returns order for the owner', async () => {
    OrderRepository.findById.mockResolvedValue(mockOrder);
    const result = await OrderService.getOrderById(mockOrder.id, mockOrder.user_id, 'customer');
    expect(result.id).toBe(mockOrder.id);
  });

  it('throws 404 for another user trying to access the order', async () => {
    OrderRepository.findById.mockResolvedValue(mockOrder);
    await expect(
      OrderService.getOrderById(mockOrder.id, uuidv4(), 'customer')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('admin can access any order', async () => {
    OrderRepository.findById.mockResolvedValue(mockOrder);
    const result = await OrderService.getOrderById(mockOrder.id, uuidv4(), 'admin');
    expect(result.id).toBe(mockOrder.id);
  });

  it('throws 404 for unknown order', async () => {
    OrderRepository.findById.mockResolvedValue(null);
    await expect(
      OrderService.getOrderById(uuidv4(), uuidv4(), 'admin')
    ).rejects.toMatchObject({ statusCode: 404, code: 'ORDER_NOT_FOUND' });
  });
});

describe('OrderService.cancelOrder', () => {
  it('cancels a pending order', async () => {
    const cancelledOrder = { ...mockOrder, status: 'cancelled' };
    OrderRepository.findById.mockResolvedValue(mockOrder);
    OrderRepository.updateStatus.mockResolvedValue(cancelledOrder);

    const result = await OrderService.cancelOrder(
      mockOrder.id, mockOrder.user_id, 'customer', 'Changed my mind'
    );

    expect(result.status).toBe('cancelled');
    expect(MessagingService.orderCancelled).toHaveBeenCalledTimes(1);
  });

  it('throws 422 for already shipped order', async () => {
    OrderRepository.findById.mockResolvedValue({ ...mockOrder, status: 'shipped' });
    await expect(
      OrderService.cancelOrder(mockOrder.id, mockOrder.user_id, 'customer', 'Late')
    ).rejects.toMatchObject({ statusCode: 422, code: 'CANNOT_CANCEL' });
  });
});

describe('OrderService.updateStatus', () => {
  it('transitions pending → confirmed', async () => {
    const confirmed = { ...mockOrder, status: 'confirmed' };
    OrderRepository.findById.mockResolvedValue(mockOrder);
    OrderRepository.updateStatus.mockResolvedValue(confirmed);

    const result = await OrderService.updateStatus(mockOrder.id, 'confirmed');
    expect(result.status).toBe('confirmed');
    expect(MessagingService.orderConfirmed).toHaveBeenCalledTimes(1);
  });

  it('throws 422 for invalid transition pending → delivered', async () => {
    OrderRepository.findById.mockResolvedValue(mockOrder);
    await expect(
      OrderService.updateStatus(mockOrder.id, 'delivered')
    ).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_STATUS_TRANSITION' });
  });
});