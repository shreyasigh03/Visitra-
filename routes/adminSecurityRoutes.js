// Admin pages for guards, the blacklist and the activity history, under /api/admin.
const express = require("express");
const { isValidObjectId } = require("mongoose");
const Activity = require("../models/Activity");
const Blacklist = require("../models/Blacklist");
const Guard = require("../models/Guard");
const { logActivity } = require("../services/activity");
const { emailKey, findBlacklisted, phoneKey } = require("../services/blacklist");
const { runAsSystem } = require("../services/tenant");
const { hashPassword } = require("../utils/password");
const HttpError = require("../utils/httpError");

const router = express.Router();

const MIN_PASSWORD = 8;
const PAGE_SIZE = 50;

const text = (body, key) => (typeof body[key] === "string" ? body[key].trim() : "");

function requireId(req, res, next) {
  next(isValidObjectId(req.params.id) ? undefined : new HttpError(404, "Not found."));
}

// ---------- Guards ----------

const guardView = (g) => ({ id: g._id, name: g.name, username: g.username, active: g.active });

function readPassword(body) {
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Use at least ${MIN_PASSWORD} characters for the password.`);
  return password;
}

router.get("/guards", async (req, res) => {
  res.json((await Guard.find().sort({ name: 1 }).lean()).map(guardView));
});

router.post("/guards", async (req, res) => {
  const name = text(req.body, "name");
  const username = text(req.body, "username").toLowerCase();
  if (!name) throw new HttpError(400, "Please enter the guard's name.");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new HttpError(400, "Username: 3 to 30 letters, numbers, dots or dashes.");
  const passwordHash = await hashPassword(readPassword(req.body));
  if (await runAsSystem(async () => Guard.exists({ username }))) throw new HttpError(409, "This username is already used.");
  const guard = await Guard.create({ name, username, passwordHash });
  logActivity({ actor: "Admin", type: "guard", subject: name, details: "Guard added" });
  res.status(201).json(guardView(guard));
});

async function changeGuard(req, change, details) {
  const guard = await Guard.findByIdAndUpdate(req.params.id, { $set: change, $inc: { tokenVersion: 1 } }, { returnDocument: "after" });
  if (!guard) throw new HttpError(404, "Guard not found.");
  logActivity({ actor: "Admin", type: "guard", subject: guard.name, details });
  return guardView(guard);
}

router.put("/guards/:id/active", requireId, async (req, res) => {
  const active = req.body.active === true;
  res.json(await changeGuard(req, { active }, active ? "Turned on" : "Turned off"));
});

router.put("/guards/:id/password", requireId, async (req, res) => {
  const passwordHash = await hashPassword(readPassword(req.body));
  res.json(await changeGuard(req, { passwordHash }, "Password changed"));
});

// ---------- Blacklist ----------

const blacklistView = (b) => ({ id: b._id, name: b.name, email: b.email, phone: b.phone, reason: b.reason, createdAt: b.createdAt });

router.get("/blacklist", async (req, res) => {
  res.json((await Blacklist.find().sort({ createdAt: -1 }).lean()).map(blacklistView));
});

router.post("/blacklist", async (req, res) => {
  const entry = { name: text(req.body, "name"), email: text(req.body, "email"), phone: text(req.body, "phone"), reason: text(req.body, "reason").slice(0, 200) };
  if (entry.email && !emailKey(entry.email)) throw new HttpError(400, "Please enter a valid email address.");
  if (entry.phone && !phoneKey(entry.phone)) throw new HttpError(400, "Please enter a 10-digit phone number.");
  if (!entry.email && !entry.phone) throw new HttpError(400, "Enter an email or a phone number.");
  if (await findBlacklisted(entry)) throw new HttpError(409, "This email or phone is already on the blacklist.");

  const saved = await Blacklist.create({ ...entry, emailKey: emailKey(entry.email), phoneKey: phoneKey(entry.phone) });
  logActivity({ actor: "Admin", type: "blacklist", subject: entry.name || entry.email || entry.phone, details: `Added. ${entry.reason}` });
  res.status(201).json(blacklistView(saved));
});

router.delete("/blacklist/:id", requireId, async (req, res) => {
  const entry = await Blacklist.findByIdAndDelete(req.params.id);
  if (!entry) throw new HttpError(404, "Not on the blacklist any more.");
  logActivity({ actor: "Admin", type: "blacklist", subject: entry.name || entry.email || entry.phone, details: "Removed" });
  res.json({ ok: true });
});

// ---------- Activity ----------

router.get("/activity", async (req, res) => {
  const filter = {};
  if (typeof req.query.type === "string" && req.query.type) filter.type = { $in: req.query.type.split(",") };
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const pattern = new RegExp(req.query.search.trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ actor: pattern }, { subject: pattern }, { details: pattern }];
  }
  const page = Math.max(1, Math.min(1000, Number.parseInt(req.query.page, 10) || 1));
  const [total, rows] = await Promise.all([
    Activity.countDocuments(filter),
    Activity.find(filter).sort({ at: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
  ]);
  res.json({ rows, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
});

module.exports = router;
