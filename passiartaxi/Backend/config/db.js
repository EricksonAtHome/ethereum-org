const mongoose = require("mongoose");

const MONGO_DB = {
  production: { url: process.env.MONGODB_PROD_URL, type: "Atlas" },
  development: { url: process.env.MONGODB_DEV_URL, type: "Local" },
};

const environment = process.env.ENVIRONMENT || "development";
const config = MONGO_DB[environment] || MONGO_DB.development;

if (!config?.url) {
  console.error(
    `Missing MongoDB URL for ENVIRONMENT=${environment}. Set MONGODB_DEV_URL or MONGODB_PROD_URL.`
  );
  process.exit(1);
}

mongoose
  .connect(config.url)
  .then(async () => {
    console.log("Connected to MongoDB", config.type);
    await ensureIndexes();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

async function ensureIndexes() {
  try {
    const captainModel = require("../models/captain.model");
    await captainModel.collection.createIndex({ location: "2dsphere" });
    console.log("Ensured 2dsphere index on captains.location");
  } catch (err) {
    console.warn("Index setup warning:", err.message);
  }
}

module.exports = mongoose.connection;
