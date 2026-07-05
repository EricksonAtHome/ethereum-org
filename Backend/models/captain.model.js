const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { makeThenable } = require("../utils/queryChain");

function rowToCaptain(row, { includePassword = false, rides = [] } = {}) {
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
    status: row.status,
    vehicle: {
      color: row.vehicle_color,
      number: row.vehicle_number,
      capacity: row.vehicle_capacity,
      type: row.vehicle_type,
    },
    location: {
      type: "Point",
      coordinates: [row.location_lng, row.location_lat],
    },
    emailVerified: row.email_verified,
    rides,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) {
    doc.password = row.password;
  }

  doc.generateAuthToken = function generateAuthToken() {
    return jwt.sign({ id: doc._id, userType: "captain" }, process.env.JWT_SECRET, {
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
    if (doc.status !== undefined) {
      updates.push(`status = $${i++}`);
      values.push(doc.status);
    }

    if (updates.length === 0) return doc;

    updates.push(`updated_at = NOW()`);
    values.push(doc._id);

    await query(
      `UPDATE captains SET ${updates.join(", ")} WHERE id = $${i}`,
      values
    );
    return doc;
  };

  return doc;
}

async function getCaptainRideIds(captainId) {
  const result = await query(
    `SELECT id FROM rides WHERE captain_id = $1 ORDER BY created_at DESC`,
    [captainId]
  );
  return result.rows.map((r) => r.id);
}

async function findCaptainByFilter(filter, opts = {}) {
  let sql = "SELECT * FROM captains WHERE ";
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
    rides = await getCaptainRideIds(row.id);
  }

  return rowToCaptain(row, {
    includePassword: opts.includeHidden,
    rides,
  });
}

const Captain = {
  hashPassword: async (password) => bcrypt.hash(password, 10),

  async create(data) {
    const coords = data.location?.coordinates || [105.8542, 21.0285];
    const result = await query(
      `INSERT INTO captains (
        firstname, lastname, email, password, phone,
        vehicle_color, vehicle_number, vehicle_capacity, vehicle_type,
        location_lng, location_lat
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        data.fullname.firstname,
        data.fullname.lastname || "",
        data.email,
        data.password,
        data.phone,
        data.vehicle.color,
        data.vehicle.number,
        data.vehicle.capacity,
        data.vehicle.type,
        coords[0],
        coords[1],
      ]
    );
    return rowToCaptain(result.rows[0], { rides: [] });
  },

  findOne(filter) {
    return makeThenable(async (opts) => {
      const populate = (opts.populate || []).map((p) =>
        typeof p === "string" ? p : p.field
      );
      return findCaptainByFilter(filter, {
        includeHidden: opts.includeHidden,
        populate,
      });
    });
  },

  async findById(id) {
    return findCaptainByFilter({ _id: id });
  },

  findByIdAndUpdate(id, update) {
    return Captain._updateById(id, update);
  },

  async _updateById(id, update) {
    if (update.socketId !== undefined) {
      await Captain.updateSocketId(id, update.socketId);
    }
    if (update.location?.coordinates) {
      const [lng, lat] = update.location.coordinates;
      await Captain.updateLocation(id, lng, lat);
    }
    return findCaptainByFilter({ _id: id });
  },

  async findOneAndUpdate(filter, update) {
    const existing = await findCaptainByFilter(filter);
    if (!existing) return null;

    const data = update.captainData || update;
    const firstname = data.fullname?.firstname ?? existing.fullname.firstname;
    const lastname = data.fullname?.lastname ?? existing.fullname.lastname;
    const phone = data.phone ?? existing.phone;
    const vehicle = data.vehicle || existing.vehicle;

    const result = await query(
      `UPDATE captains SET
        firstname = $1, lastname = $2, phone = $3,
        vehicle_color = $4, vehicle_number = $5, vehicle_capacity = $6, vehicle_type = $7,
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        firstname,
        lastname,
        phone,
        vehicle.color,
        vehicle.number,
        vehicle.capacity,
        vehicle.type,
        existing._id,
      ]
    );

    return rowToCaptain(result.rows[0], { rides: existing.rides });
  },

  async findInRadius(ltd, lng, radiusKm, vehicleType) {
    const result = await query(
      `SELECT * FROM (
        SELECT *,
          (6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians($1::float8)) * cos(radians(location_lat)) *
            cos(radians(location_lng) - radians($2::float8)) +
            sin(radians($1::float8)) * sin(radians(location_lat))
          )))) AS distance_km
        FROM captains
        WHERE vehicle_type = $3
      ) AS nearby
      WHERE distance_km <= $4`,
      [ltd, lng, vehicleType, radiusKm]
    );

    return result.rows.map((row) => rowToCaptain(row));
  },

  async updateLocation(id, lng, lat) {
    await query(
      `UPDATE captains SET location_lng = $1, location_lat = $2, updated_at = NOW() WHERE id = $3`,
      [lng, lat, id]
    );
  },

  async updateSocketId(id, socketId) {
    await query(
      `UPDATE captains SET socket_id = $1, updated_at = NOW() WHERE id = $2`,
      [socketId, id]
    );
  },
};

module.exports = Captain;
