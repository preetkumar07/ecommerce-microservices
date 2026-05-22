'use strict';

process.env.NODE_ENV = 'test';

const { handleMessage } = require('../../src/consumers/order.consumer');

// Mock all handlers
jest.mock('../../src/handlers/orderPlaced.handler',    () => jest.fn().mockResolvedValue(undefined));
jest.mock('../../src/handlers/orderConfirmed.handler', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../../src/handlers/orderCancelled.handler', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../../src/handlers/orderShipped.handler',   () => jest.fn().mockResolvedValue(undefined));
jest.mock('../../src/handlers/orderDelivered.handler', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));

const orderPlacedHandler    = require('../../src/handlers/orderPlaced.handler');
const orderConfirmedHandler = require('../../src/handlers/orderConfirmed.handler');
const orderCancelledHandler = require('../../src/handlers/orderCancelled.handler');
const orderShippedHandler   = require('../../src/handlers/orderShipped.handler');
const orderDeliveredHandler = require('../../src/handlers/orderDelivered.handler');

const payload = { eventId: 'evt-1', orderId: 'ord-1', userEmail: 'a@b.com' };

beforeEach(() => jest.clearAllMocks());

describe('order.consumer — handleMessage routing', () => {
  it('routes order.placed to orderPlacedHandler', async () => {
    await handleMessage('order.placed', payload);
    expect(orderPlacedHandler).toHaveBeenCalledWith(payload);
  });

  it('routes order.confirmed to orderConfirmedHandler', async () => {
    await handleMessage('order.confirmed', payload);
    expect(orderConfirmedHandler).toHaveBeenCalledWith(payload);
  });

  it('routes order.cancelled to orderCancelledHandler', async () => {
    await handleMessage('order.cancelled', payload);
    expect(orderCancelledHandler).toHaveBeenCalledWith(payload);
  });

  it('routes order.shipped to orderShippedHandler', async () => {
    await handleMessage('order.shipped', payload);
    expect(orderShippedHandler).toHaveBeenCalledWith(payload);
  });

  it('routes order.delivered to orderDeliveredHandler', async () => {
    await handleMessage('order.delivered', payload);
    expect(orderDeliveredHandler).toHaveBeenCalledWith(payload);
  });

  it('does not throw for unknown routing keys', async () => {
    await expect(handleMessage('payment.refunded', payload)).resolves.toBeUndefined();
    expect(orderPlacedHandler).not.toHaveBeenCalled();
  });
});
