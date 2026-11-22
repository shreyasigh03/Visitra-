// Loads backend/.env once and fails fast with a readable message
// when a required setting is missing.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

// Vercel runs the backend online, without the face service, the Excel folder or photos.
const online = Boolean(process.env.VERCEL);
if (online) process.env.TZ = "Asia/Kolkata"; // its clock is UTC, but "today" is the campus day

const REQUIRED = ["MONGO_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const OPTIONAL_WARN = ["EMAIL_USER", "EMAIL_PASS"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `\n[config] Missing required settings in backend/.env: ${missing.join(", ")}\n` +
      "         See README.md -> 'Backend .env' for what each one means.\n",
  );
  process.exit(1);
}

const missingEmail = OPTIONAL_WARN.filter((key) => !process.env[key]);
if (missingEmail.length) {
  console.warn(
    `[config] ${missingEmail.join(", ")} not set — OTP and approval emails will fail.`,
  );
}

function wholeNumber(key, fallback) {
  if (!process.env[key]) return fallback;
  const value = Number(process.env[key]);
  if (Number.isInteger(value) && value >= 1) return value;
  console.error(`\n[config] ${key} in backend/.env must be a whole number, 1 or more.\n`);
  process.exit(1);
}

module.exports = {
  online,
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL.trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD,
  aiServiceUrl: (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, ""),
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  // The owners of VISITRA. Empty turns the super admin login off.
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase(),
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "",
  // Gate (see services/gate.js).
  overstayHours: wholeNumber("OVERSTAY_HOURS", 4),
  autoCloseExits: process.env.AUTO_CLOSE_EXITS === "true",
  // Teacher dashboard: website address for email links, and phone notification keys.
  webUrl: (process.env.WEB_URL || "http://localhost:5173").replace(/\/$/, ""),
  webDir: process.env.WEB_DIR || "", // built website to serve, set by `npm run demo`
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  // Old-data clean-up (see services/retention.js).
  faceRetentionMonths: wholeNumber("FACE_RETENTION_MONTHS", 3),
  recordRetentionMonths: wholeNumber("RECORD_RETENTION_MONTHS", 12),
  archiveDir: process.env.ARCHIVE_DIR || "",
  autoCleanup: process.env.AUTO_CLEANUP === "true",
  // Comma-separated DNS servers used to resolve the Atlas SRV record.
  // Set DNS_SERVERS=system to use the machine's own DNS instead.
  dnsServers: process.env.DNS_SERVERS || (online ? "system" : "8.8.8.8,8.8.4.4"),
};
