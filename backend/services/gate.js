// The one place that decides who may enter or leave.
const config = require("../config/env");
const Visitor = require("../models/Visitor");
const { forEachOrg } = require("./organizations");
const { findBlacklisted } = require("./blacklist");
const { logActivity } = require("./activity");
const { todayLocal, localDay, niceDay } = require("../utils/dates");
const HttpError = require("../utils/httpError");

const HOUR_MS = 60 * 60 * 1000;
const CLOSE_CHECK_MS = 15 * 60 * 1000;

// Visit dates are stored as UTC midnight; a few old ones are text or impossible.
function visitDay(v) {
  if (v.date instanceof Date && !Number.isNaN(v.date.getTime())) return v.date.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v.date ?? "") ? v.date : "";
}

// Old records can hold an "entry" for a scan that was refused.
const isInside = (v) => Boolean(v.entryTime && !v.exitTime && (v.status === "approved" || v.entryGranted));

const isValidToday = (v) => v.status === "approved" && visitDay(v) === todayLocal();

const isOverstay = (v, now = Date.now()) =>
  isInside(v) && (localDay(v.entryTime) < todayLocal() || now - v.entryTime > config.overstayHours * HOUR_MS);

const deny = (code, message) => ({ allowed: false, action: null, code, message });

async function checkVisitor(v) {
  // Someone inside can always leave.
  if (isInside(v)) return { allowed: true, action: "exit", code: "exit", message: "Inside now. Record the exit." };
  if (await findBlacklisted(v)) return deny("blacklisted", "BLACKLISTED. Do not let this person in. Call security.");
  if (v.status === "rejected") return deny("rejected", "This visit was rejected.");
  if (v.status !== "approved") return deny("not-approved", "This visit is not approved yet.");

  const day = visitDay(v);
  const today = todayLocal();
  if (!day) return deny("no-date", "This pass has no valid visit date.");
  if (day < today) return deny("expired", `This pass expired. It was for ${niceDay(day)}.`);
  if (day > today) return deny("early", `This pass is for ${niceDay(day)}, not today.`);
  return { allowed: true, action: "entry", code: "entry", message: "Pass is valid for today." };
}

// Saves an entry or exit. Returns false if another gate changed the visit first.
async function recordScan(v, action, actor) {
  const now = new Date();
  const same = { _id: v._id, entryTime: v.entryTime ?? null, exitTime: v.exitTime ?? null };
  const { modifiedCount } =
    action === "exit"
      ? await Visitor.updateOne(same, { exitTime: now })
      : await Visitor.updateOne({ ...same, status: "approved" }, { entryTime: now, exitTime: null, entryGranted: true });
  if (!modifiedCount) return false;

  if (action === "exit") v.exitTime = now;
  else Object.assign(v, { entryTime: now, exitTime: null });
  logActivity({ actor, type: action, visitor: v });
  return true;
}

function logDenied(v, check, actor) {
  logActivity({ actor, type: check.code === "blacklisted" ? "blacklist-alert" : "denied", visitor: v, details: check.message });
}

async function findInside() {
  const open = await Visitor.find({ entryTime: { $type: "date" }, exitTime: null }).select("-photo").lean();
  return open.filter(isInside);
}

// The real exit is unknown, so it is saved as the end of the day they came in.
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 0);
  return d;
}

async function closeVisit(v, actor) {
  const exitTime = localDay(v.entryTime) < todayLocal() ? endOfDay(v.entryTime) : new Date();
  const { modifiedCount } = await Visitor.updateOne(
    { _id: v._id, entryTime: v.entryTime, exitTime: null },
    { exitTime, exitClosedBy: actor },
  );
  if (modifiedCount) logActivity({ actor, type: "exit-closed", visitor: v, details: "Marked as left without a scan" });
  return modifiedCount;
}

async function closeById(id, actor) {
  const visitor = (await findInside()).find((v) => String(v._id) === id);
  if (!visitor) throw new HttpError(404, "This visitor is not inside any more.");
  return closeVisit(visitor, actor);
}

// Closes every visit left open since an earlier day.
async function closeForgotten(actor) {
  let closed = 0;
  for (const v of await findInside()) if (localDay(v.entryTime) < todayLocal()) closed += await closeVisit(v, actor);
  return closed;
}

function startAutoClose(isDbConnected) {
  if (!config.autoCloseExits) return;
  setInterval(() => {
    if (isDbConnected()) forEachOrg(() => closeForgotten("System")).catch((err) => console.error("[gate] auto-close failed:", err.message));
  }, CLOSE_CHECK_MS);
}

module.exports = { checkVisitor, recordScan, logDenied, isInside, isValidToday, isOverstay, findInside, closeById, closeForgotten, startAutoClose };
