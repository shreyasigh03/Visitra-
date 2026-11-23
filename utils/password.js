const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function checkPassword(password, stored) {
  if (!stored) return false;
  const [salt, key] = stored.split(":").map((part) => Buffer.from(part, "hex"));
  return crypto.timingSafeEqual(key, await scrypt(password, salt, 64));
}

// Constant-time comparison so response timing doesn't leak the password.
function sameSecret(a, b) {
  const hash = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
}

module.exports = { hashPassword, checkPassword, sameSecret };
