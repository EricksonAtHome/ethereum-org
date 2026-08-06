const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { makeThenable } = require("../utils/queryChain");

function rowToUser(row, { includePassword = false, rides = [] } = {}) {
  if (!row) return null;

  const doc = {
    _id: row.id,
    fullname: {
      firstname: row.firstname,
      lastname: row.lastname || "",
    },
    email: row.email,
    phone: row.phone,
    socketId: row.socket_id,
    emailVerified: row.email_verified,
    rides,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) {
    doc.password = row.password;
  }

  doc.generateAuthToken = function generateAuthToken() {
    return jwt.sign({ id: doc._id, userType: "user" }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
  };

  doc.comparePassword = async function comparePassword(password) {
    return bcrypt.compare(password, row.password);
  };

  doc.save = async function save() {
    const updates = [];
    const values = [];
    let i = 1;

    if (doc.emailVerified !== undefined) {
      updates.push(`email_verified = $${i++}`);
      values.push(doc.emailVerified);
    }
    if (doc.password) {
      updates.push(`password = $${i++}`);
      values.push(doc.password);
    }
    if (doc.socketId !== undefined) {
      updates.push(`socket_id = $${i++}`);
      values.push(doc.socketId);
    }

    if (updates.length === 0) return doc;

    updates.push(`updated_at = NOW()`);
    values.push(doc._id);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${i}`,
      values
    );
    return doc;
  };

  return doc;
}

async function getUserRideIds(userId) {
  const result = await query(
    `SELECT id FROM rides WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map((r) => r.id);
}

async function findUserByFilter(filter, opts = {}) {
  let sql = "SELECT * FROM users WHERE ";
  const values = [];

  if (filter.email) {
    values.push(filter.email);
    sql += `email = $${values.length}`;
  } else if (filter._id) {
    values.push(filter._id);
    sql += `id = $${values.length}`;
  } else {
    return null;
  }

  const result = await query(sql, values);
  const row = result.rows[0];
  if (!row) return null;

  let rides = [];
  if (opts.populate?.includes("rides")) {
    rides = await getUserRideIds(row.id);
  }

  return rowToUser(row, {
    includePassword: opts.includeHidden,
    rides,
  });
}

const User = {
  hashPassword: async (password) => bcrypt.hash(password, 10),

  async create(data) {
    const result = await query(
      `INSERT INTO users (firstname, lastname, email, password, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.fullname.firstname,
        data.fullname.lastname || "",
        data.email,
        data.password,
        data.phone,
      ]
    );
    return rowToUser(result.rows[0], { rides: [] });
  },

  findOne(filter) {
    return makeThenable(async (opts) => {
      const populate = (opts.populate || []).map((p) =>
        typeof p === "string" ? p : p.field
      );
      return findUserByFilter(filter, {
        includeHidden: opts.includeHidden,
        populate,
      });
    });
  },

  async findById(id) {
    return findUserByFilter({ _id: id });
  },

  findByIdAndUpdate(id, update) {
    return User._updateById(id, update);
  },

  async _updateById(id, update) {
    if (update.socketId !== undefined) {
      await query(
        `UPDATE users SET socket_id = $1, updated_at = NOW() WHERE id = $2`,
        [update.socketId, id]
      );
    }
    return findUserByFilter({ _id: id });
  },

  async findOneAndUpdate(filter, update) {
    const existing = await findUserByFilter(filter);
    if (!existing) return null;

    const firstname = update.fullname?.firstname ?? existing.fullname.firstname;
    const lastname = update.fullname?.lastname ?? existing.fullname.lastname;
    const phone = update.phone ?? existing.phone;

    const result = await query(
      `UPDATE users SET firstname = $1, lastname = $2, phone = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [firstname, lastname, phone, existing._id]
    );

    return rowToUser(result.rows[0], { rides: existing.rides });
  },
};

module.exports = User;
