'use strict';

const { v4: uuidv4 } = require('uuid');

const makeOrderPlacedPayload = (overrides = {}) => ({
  eventId:    uuidv4(),
  occurredAt: new Date().toISOString(),
  orderId:    uuidv4(),
  userId:     uuidv4(),
  userEmail:  'customer@example.com',
  totalAmount: 2498,
  items: [
    { productId: uuidv4(), productName: 'Test Widget', productSku: 'SKU-1', unitPrice: 999, quantity: 2 },
    { productId: uuidv4(), productName: 'Another Item', productSku: 'SKU-2', unitPrice: 500, quantity: 1 },
  ],
  shippingAddress: {
    fullName:   'Ali Hassan',
    street:     '1 Main Street',
    city:       'Karachi',
    postalCode: '74200',
    country:    'PK',
    phone:      '+92 300 1234567',
  },
  ...overrides,
});

const makeOrderConfirmedPayload  = (overrides = {}) => ({ eventId: uuidv4(), occurredAt: new Date().toISOString(), orderId: uuidv4(), userId: uuidv4(), userEmail: 'customer@example.com', ...overrides });
const makeOrderCancelledPayload  = (overrides = {}) => ({ eventId: uuidv4(), occurredAt: new Date().toISOString(), orderId: uuidv4(), userId: uuidv4(), userEmail: 'customer@example.com', reason: 'Changed my mind', items: [], ...overrides });
const makeOrderShippedPayload    = (overrides = {}) => ({ eventId: uuidv4(), occurredAt: new Date().toISOString(), orderId: uuidv4(), userId: uuidv4(), userEmail: 'customer@example.com', trackingNumber: 'TRK-9876543', ...overrides });
const makeOrderDeliveredPayload  = (overrides = {}) => ({ eventId: uuidv4(), occurredAt: new Date().toISOString(), orderId: uuidv4(), userId: uuidv4(), userEmail: 'customer@example.com', ...overrides });

module.exports = {
  makeOrderPlacedPayload,
  makeOrderConfirmedPayload,
  makeOrderCancelledPayload,
  makeOrderShippedPayload,
  makeOrderDeliveredPayload,
};
