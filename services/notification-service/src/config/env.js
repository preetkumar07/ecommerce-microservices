'use strict';

require('dotenv').config();

const config = {
  env:          process.env.NODE_ENV || 'development',
  port:         parseInt(process.env.PORT || '3004', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isTest:       process.env.NODE_ENV === 'test',

  rabbitmq: {
    url:            process.env.RABBITMQ_URL            || 'amqp://localhost',
    exchange:       process.env.RABBITMQ_EXCHANGE       || 'ecommerce.events',
    queue:          process.env.RABBITMQ_QUEUE          || 'notification-service.queue',
    reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY_MS || '5000', 10),
  },

  smtp: {
    host:      process.env.SMTP_HOST       || 'sandbox.smtp.mailtrap.io',
    port:      parseInt(process.env.SMTP_PORT || '2525', 10),
    user:      process.env.SMTP_USER       || '',
    pass:      process.env.SMTP_PASS       || '',
    fromName:  process.env.SMTP_FROM_NAME  || 'EcommerceApp',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@ecommerceapp.com',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = config;
