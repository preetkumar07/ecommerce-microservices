const { Pool } = require('pg');

// .env file se database connection details uthana
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Agar database connect hone mein koi masla aaye toh pata chal jaye
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};