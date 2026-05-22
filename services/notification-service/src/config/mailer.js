'use strict';

const nodemailer = require('nodemailer');
const config     = require('./env');
const logger     = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (config.isTest) {
    // In test mode: stub transporter that captures sent mails without network calls
    transporter = {
      sendMail: async (options) => {
        logger.debug('Test mailer: sendMail called', { to: options.to, subject: options.subject });
        return { messageId: `test-${Date.now()}` };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    // Pooled connections for high throughput
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  transporter.on('error', (err) => {
    logger.error('SMTP transporter error', { error: err.message });
  });

  return transporter;
};

/**
 * Send a single email.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<{messageId: string}>}
 */
const sendMail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  const result = await t.sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // plain text fallback
  });

  logger.info('Email sent', { to, subject, messageId: result.messageId });
  return result;
};

module.exports = { sendMail };
