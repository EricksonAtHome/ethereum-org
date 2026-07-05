const { query } = require("../config/db");
const userModel = require("./user.model");
const captainModel = require("./captain.model");
const { makeThenable } = require("../utils/queryChain");

function rowToRide(row, { includeOtp = false, user = null, captain = null } = {}) {
  if (!row) return null;

  const doc = {
    _id: row.id,
    user: user || row.user_id,
    captain: captain || row.captain_id,
    pickup: row.pickup,
    destination: row.destination,
    fare: Number(row.fare),
    vehicle: row.vehicle,
    status: row.status,
    duration: row.duration,
    distance: row.distance,
    paymentID: row.payment_id,
    orderId: row.order_id,
    signature: row.signature,
    messages: row.messages || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeOtp) {
    doc.otp = row.otp;
  }

  doc.save = async function save() {
    await query(
      `UPDATE rides SET messages = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(doc.messages), doc._id]
    );
    return doc;
  };

  return doc;
}

async function populateRide(row, populate, includeOtp) {
  let user = null;
  let captain = null;

  for (const p of populate || []) {
    const field = typeof p === "string" ? p : p.field;
    const fields = typeof p === "object" ? p.fields : null;

    if (field === "user" && row.user_id) {
      const u = await query(`SELECT * FROM users WHERE id = $1`, [row.user_id]);
      if (u.rows[0]) {
        const ur = u.rows[0];
        user = {
          _id: ur.id,
          socketId: ur.socket_id,
          fullname: { firstname: ur.firstname, lastname: ur.lastname },
          phone: ur.phone,
          email: ur.email,
        };
        if (fields && typeof fields === "string") {
          const allowed = fields.split(" ");
          user = Object.fromEntries(
            Object.entries(user).filter(([k]) => allowed.includes(k === "_id" ? "_id" : k))
          );
          user._id = ur.id;
        }
      }
    }

    if (field === "captain" && row.captain_id) {
      const c = await query(`SELECT * FROM captains WHERE id = $1`, [row.captain_id]);
      if (c.rows[0]) {
        const cr = c.rows[0];
        captain = {
          _id: cr.id,
          socketId: cr.socket_id,
          fullname: { firstname: cr.firstname, lastname: cr.lastname },
          phone: cr.phone,
          email: cr.email,
        };
      }
    }
  }

  return rowToRide(row, { includeOtp, user, captain });
}

async function findRideByFilter(filter, opts = {}) {
  let sql = "SELECT * FROM rides WHERE ";
  const values = [];

  if (filter._id) {
    values.push(filter._id);
    sql += `id = $${values.length}`;
  } else {
    return null;
  }

  if (filter.captain) {
    values.push(filter.captain);
    sql += ` AND captain_id = $${values.length}`;
  }

  const result = await query(sql, values);
  const row = result.rows[0];
  if (!row) return null;

  if (opts.populate?.length) {
    return populateRide(row, opts.populate, opts.includeHidden);
  }

  return rowToRide(row, { includeOtp: opts.includeHidden });
}

const Ride = {
  create(data) {
    return Ride._insert(data);
  },

  async _insert(data) {
    const result = await query(
      `INSERT INTO rides (
        user_id, pickup, destination, otp, fare, vehicle, distance, duration
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        data.user,
        data.pickup,
        data.destination,
        data.otp,
        data.fare,
        data.vehicle,
        data.distance,
        data.duration,
      ]
    );
    return rowToRide(result.rows[0], { includeOtp: true });
  },

  findOne(filter) {
    return makeThenable(async (opts) =>
      findRideByFilter(filter, {
        includeHidden: opts.includeHidden,
        populate: opts.populate,
      })
    );
  },

  async findOneAndUpdate(filter, update) {
    const existing = await findRideByFilter(filter);
    if (!existing) return null;

    const status = update.status ?? existing.status;
    const captainId =
      update.captain !== undefined ? update.captain : existing.captain;

    const result = await query(
      `UPDATE rides SET status = $1, captain_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, captainId || null, existing._id]
    );

    return rowToRide(result.rows[0], { includeOtp: true });
  },
};

module.exports = Ride;
