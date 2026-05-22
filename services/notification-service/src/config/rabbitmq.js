'use strict';

const amqp   = require('amqplib');
const config = require('./env');
const logger = require('./logger');

let connection = null;
let channel    = null;

/**
 * Connect to RabbitMQ, declare the exchange + queue, and bind routing keys.
 * Called once at startup; auto-reconnects on unexpected close.
 *
 * @param {function(routingKey: string, payload: object): Promise<void>} onMessage
 */
const connect = async (onMessage) => {
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel    = await connection.createChannel();

    // Durable exchange — survives broker restarts
    await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });

    // Durable queue — messages survive if the consumer is temporarily down
    await channel.assertQueue(config.rabbitmq.queue, {
      durable: true,
      arguments: {
        // Dead-letter exchange — failed messages go here instead of being lost
        'x-dead-letter-exchange': `${config.rabbitmq.exchange}.dlx`,
      },
    });

    // Bind to every order.* event
    const routingKeys = [
      'order.placed',
      'order.confirmed',
      'order.cancelled',
      'order.shipped',
      'order.delivered',
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(config.rabbitmq.queue, config.rabbitmq.exchange, key);
      logger.debug(`Bound queue to routing key: ${key}`);
    }

    // Process one message at a time — prevents overload
    channel.prefetch(1);

    // Start consuming
    channel.consume(config.rabbitmq.queue, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      let payload;

      try {
        payload = JSON.parse(msg.content.toString());
      } catch (err) {
        logger.error('Failed to parse message — discarding', { routingKey, error: err.message });
        channel.nack(msg, false, false); // discard malformed messages
        return;
      }

      try {
        await onMessage(routingKey, payload);
        channel.ack(msg); // processing succeeded
      } catch (err) {
        logger.error('Handler failed — requeueing message', { routingKey, error: err.message });
        // Requeue once; if it fails again it goes to DLX
        channel.nack(msg, false, true);
      }
    });

    logger.info('RabbitMQ consumer connected and listening', { queue: config.rabbitmq.queue });

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err.message });
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed — reconnecting...');
      channel = null;
      connection = null;
      setTimeout(() => connect(onMessage), config.rabbitmq.reconnectDelay);
    });

  } catch (err) {
    logger.error('RabbitMQ connect failed — retrying', { error: err.message });
    setTimeout(() => connect(onMessage), config.rabbitmq.reconnectDelay);
  }
};

const close = async () => {
  try {
    if (channel)    await channel.close();
    if (connection) await connection.close();
  } catch { /* ignore errors on shutdown */ }
};

const isConnected = () => Boolean(channel);

module.exports = { connect, close, isConnected };
