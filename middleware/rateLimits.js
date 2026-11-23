const rateLimit = require("express-rate-limit");

const limiter = (limit, minutes, message) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
  });

module.exports = {
  // Generous, because a reception desk registers many visitors from one IP.
  registerLimiter: limiter(100, 15, "Too many registrations. Please wait a few minutes."),
  sendOtpLimiter: limiter(60, 15, "Too many OTP requests. Please wait a few minutes."),
  verifyOtpLimiter: limiter(150, 15, "Too many attempts. Please wait a few minutes."),
};
