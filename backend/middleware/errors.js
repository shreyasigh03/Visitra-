const multer = require("multer");
const config = require("../config/env");
const { connectOnce, isDbConnected } = require("../config/db");

// Reject API calls immediately while MongoDB is down instead of failing later.
async function requireDb(req, res, next) {
  // Online, the first request arrives before the database is connected.
  if (config.online && !isDbConnected()) await connectOnce().catch((err) => console.error("[db]", err.message));
  if (isDbConnected()) return next();
  res.status(503).json({
    message: "Database is not connected. Check the backend terminal (MongoDB Atlas IP access).",
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Photo is too large (max 5 MB)." : err.message;
    return res.status(400).json({ message });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(" ");
    return res.status(400).json({ message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id." });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ message: status >= 500 && !err.status ? "Something went wrong on the server." : err.message });
}

module.exports = { requireDb, notFound, errorHandler };
