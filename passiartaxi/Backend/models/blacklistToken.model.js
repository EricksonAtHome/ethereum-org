const { query } = require("../config/db");

const BlacklistToken = {
  async findOne({ token }) {
    const result = await query(
      `SELECT * FROM blacklist_tokens WHERE token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  async create({ token }) {
    await query(
      `INSERT INTO blacklist_tokens (token) VALUES ($1) ON CONFLICT (token) DO NOTHING`,
      [token]
    );
    return { token };
  },
};

module.exports = BlacklistToken;
