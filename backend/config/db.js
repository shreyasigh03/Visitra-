const dns = require("dns");
const mongoose = require("mongoose");
const config = require("./env");
const { seedOrganizations } = require("../services/organizations");

const RETRY_MS = 10_000;

if (config.dnsServers !== "system") {
  dns.setServers(config.dnsServers.split(",").map((s) => s.trim()));
}

// Fail queries immediately while disconnected instead of hanging for 10s.
mongoose.set("bufferCommands", false);

mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
mongoose.connection.on("reconnected", () => console.log("[db] MongoDB reconnected"));

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10_000 });
    console.log("[db] MongoDB connected");
    await seedOrganizations().catch((err) => console.error("[db] organizations:", err.message));
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB: ${err.message}`);
    if (/whitelist|IP|ENOTFOUND|querySrv|ECONNREFUSED|timed out/i.test(err.message)) {
      console.error(
        "     Likely cause: your current internet IP is not allowed in MongoDB Atlas.\n" +
          "     Fix: Atlas -> Network Access -> Add IP Address -> 'Add current IP'.",
      );
    }
    console.error(`     Retrying in ${RETRY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_MS);
  }
}

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };
