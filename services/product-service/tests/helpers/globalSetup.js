'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI_TEST = mongod.getUri();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  // Store instance ref for teardown
  global.__MONGOD__ = mongod;
};