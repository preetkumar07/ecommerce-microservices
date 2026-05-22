'use strict';

process.env.NODE_ENV = 'test';

const EmailService = require('../../src/services/email.service');
const mailer       = require('../../src/config/mailer');

const {
  makeOrderPlacedPayload,
  makeOrderConfirmedPayload,
  makeOrderCancelledPayload,
  makeOrderShippedPayload,
  makeOrderDeliveredPayload,
} = require('../helpers/factories');

jest.mock('../../src/config/mailer');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mailer.sendMail.mockResolvedValue({ messageId: 'test-id' });
});

describe('EmailService.sendOrderPlaced', () => {
  it('calls sendMail with correct subject and recipient', async () => {
    const payload = makeOrderPlacedPayload();
    await EmailService.sendOrderPlaced(payload);

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    const call = mailer.sendMail.mock.calls[0][0];
    expect(call.to).toBe('customer@example.com');
    expect(call.subject).toContain('Order Received');
    expect(call.html).toContain(payload.orderId);
    expect(call.html).toContain('Test Widget');
  });

  it('skips sending if no userEmail', async () => {
    const payload = makeOrderPlacedPayload({ userEmail: undefined });
    await EmailService.sendOrderPlaced(payload);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('re-throws if sendMail fails', async () => {
    mailer.sendMail.mockRejectedValue(new Error('SMTP error'));
    const payload = makeOrderPlacedPayload();
    await expect(EmailService.sendOrderPlaced(payload)).rejects.toThrow('SMTP error');
  });
});

describe('EmailService.sendOrderConfirmed', () => {
  it('sends email with correct subject', async () => {
    const payload = makeOrderConfirmedPayload();
    await EmailService.sendOrderConfirmed(payload);
    expect(mailer.sendMail.mock.calls[0][0].subject).toContain('Confirmed');
  });
});

describe('EmailService.sendOrderCancelled', () => {
  it('sends email with cancellation reason in HTML', async () => {
    const payload = makeOrderCancelledPayload({ reason: 'Out of stock' });
    await EmailService.sendOrderCancelled(payload);
    expect(mailer.sendMail.mock.calls[0][0].html).toContain('Out of stock');
  });

  it('sends email without reason when none provided', async () => {
    const payload = makeOrderCancelledPayload({ reason: undefined });
    await EmailService.sendOrderCancelled(payload);
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });
});

describe('EmailService.sendOrderShipped', () => {
  it('includes tracking number in email HTML', async () => {
    const payload = makeOrderShippedPayload({ trackingNumber: 'TRK-12345' });
    await EmailService.sendOrderShipped(payload);
    expect(mailer.sendMail.mock.calls[0][0].html).toContain('TRK-12345');
  });
});

describe('EmailService.sendOrderDelivered', () => {
  it('sends delivered email', async () => {
    const payload = makeOrderDeliveredPayload();
    await EmailService.sendOrderDelivered(payload);
    expect(mailer.sendMail.mock.calls[0][0].subject).toContain('Delivered');
  });
});
