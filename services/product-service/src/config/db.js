'use strict';

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

let isConnected = false;

const connect = async () => {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected',    () => { isConnected = true;  logger.info('MongoDB connected'); });
  mongoose.connection.on('disconnected', () => { isConnected = false; logger.warn('MongoDB disconnected'); });
  mongoose.connection.on('error',        (err) => logger.error('MongoDB error', { error: err.message }));

  await mongoose.connect(config.mongo.uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

const disconnect = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};

const ping = async () => {
  await mongoose.connection.db.admin().ping();
  return true;
};

module.exports = { connect, disconnect, ping, mongoose };