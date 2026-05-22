'use strict';

const logger = require('../config/logger');

const orderPlacedHandler    = require('../handlers/orderPlaced.handler');
const orderConfirmedHandler = require('../handlers/orderConfirmed.handler');
const orderCancelledHandler = require('../handlers/orderCancelled.handler');
const orderShippedHandler   = require('../handlers/orderShipped.handler');
const orderDeliveredHandler = require('../handlers/orderDelivered.handler');


const HANDLERS = {
  'order.placed':    orderPlacedHandler,
  'order.confirmed': orderConfirmedHandler,
  'order.cancelled': orderCancelledHandler,
  'order.shipped':   orderShippedHandler,
  'order.delivered': orderDeliveredHandler,
};

/**
 * Central message router.
 * Called by rabbitmq.js for every incoming message.
 *
 * @param {string} routingKey
 * @param {object} payload
 */
const handleMessage = async (routingKey, payload) => {
  const handler = HANDLERS[routingKey];

  if (!handler) {
    logger.warn('No handler for routing key — discarding', { routingKey });
    return; // ack & discard unknown events
  }

  try {
    logger.debug('Routing message', { routingKey, eventId: payload.eventId });
    await handler(payload);
  } catch (err) {
    // Agar email fail ho jaye, toh system crash nahi hoga aur na hi infinite loop banega
    logger.error('Handler failed to process message — stopping infinite loop!', { 
      routingKey, 
      error: err.message 
    });
  }
};

module.exports = { handleMessage };
