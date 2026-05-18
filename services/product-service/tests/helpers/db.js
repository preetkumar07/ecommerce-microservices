'use strict';

const db = require('../../src/config/db');
const mongoose = require('mongoose');

const connect    = () => db.connect();
const disconnect = () => db.disconnect();
const clearAll   = async () => {
  const cols = Object.values(mongoose.connection.collections);
  await Promise.all(cols.map((c) => c.deleteMany({})));
};

module.exports = { connect, disconnect, clearAll };