'use strict';
const { Pool }  = require('pg');
const config    = require('./env');
const logger    = require('./logger');

const pool = new Pool({
  host: config.db.host, port: config.db.port, database: config.db.name,
  user: config.db.user, password: config.db.password,
  min: config.db.poolMin, max: config.db.poolMax,
  idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => logger.error('PG pool error', { error: err.message }));

const query          = (text, params) => pool.query(text, params);
const getClient      = () => pool.connect();
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
const ping = async () => { const { rows } = await pool.query('SELECT 1 AS ok'); return rows[0].ok === 1; };
const end  = () => pool.end();

module.exports = { query, getClient, withTransaction, ping, end, pool };