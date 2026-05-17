// src/repositories/user.repository.js
const pool = require('../config/db');

const UserRepository = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, passwordHash, role = 'customer' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );
    return rows[0];
  },
};

module.exports = UserRepository;