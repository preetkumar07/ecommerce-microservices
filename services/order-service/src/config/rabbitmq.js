'use strict';

const amqp   = require('amqplib');
const config = require('./env');
const logger = require('./logger');

let connection = null;
let channel    = null;

const connect = async () => {
  connection = await amqp.connect(config.rabbitmq.url);
  channel    = await connection.createConfirmChannel();

  await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
  logger.info('RabbitMQ connected');

  connection.on('error', (err) => {
    logger.error('RabbitMQ connection error', { error: err.message });
  });
  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed — reconnecting...');
    channel = null; connection = null;
    setTimeout(connect, config.rabbitmq.reconnectDelay);
  });
};

/**
 * Publish a durable event to the topic exchange.
 * @param {string} routingKey  — e.g. 'order.created'
 * @param {object} payload
 */
const publish = async (routingKey, payload) => {
  if (!channel) throw new Error('RabbitMQ channel not available');

  const content = Buffer.from(JSON.stringify({ ...payload, publishedAt: new Date().toISOString() }));

  return new Promise((resolve, reject) => {
    channel.publish(
      config.rabbitmq.exchange,
      routingKey,
      content,
      { persistent: true, contentType: 'application/json' },
      (err) => (err ? reject(err) : resolve())
    );
  });
};

const close = async () => {
  if (channel)    await channel.close();
  if (connection) await connection.close();
};

const isConnected = () => Boolean(channel);

module.exports = { connect, publish, close, isConnected };