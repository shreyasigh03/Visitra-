// Removes old data: face photo and face data first, then the whole record once it
// is safely in the Excel file.
const fs = require("fs/promises");
const path = require("path");
const config = require("../config/env");
const Visitor = require("../models/Visitor");
const Activity = require("../models/Activity");
const Otp = require("../models/Otp");
const { isDbConnected } = require("../config/db");
const { forEachOrg } = require("./organizations");
const { archiveDir, archiveVisitors, requireDir } = require("./archive");
const HttpError = require("../utils/httpError");

const UPLOAD_DIR = path.resolve(__dirname, "..", "upload");
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_MS = 60_000;

function monthsAgo(months, now = new Date()) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  if (d.getDate() !== now.getDate()) d.setDate(0); // 31 May minus 3 months is the end of February
  return d;
}

// Latest sign of this visit. A visit date with a typo (year 1979, 8200, 20266) must not
// make a record too old or never old, so dates far after registration are ignored.
function lastActivity(v) {
  const created = v.createdAt ?? v._id.getTimestamp();
  const visit = new Date(v.date ?? NaN);
  const plausible = visit - created < 366 * DAY_MS; // false for an invalid date
  const times = [created, v.entryTime, v.exitTime, plausible ? visit : null];
  return new Date(Math.max(...times.filter(Boolean).map((t) => new Date(t).getTime())));
}

async function findDue() {
  const faceCutoff = monthsAgo(config.faceRetentionMonths);
  const recordCutoff = monthsAgo(config.recordRetentionMonths);
  const all = await Visitor.find().select("+faceEncoding").lean();

  const records = [];
  const faces = [];
  for (const v of all) {
    const last = lastActivity(v);
    if (last < recordCutoff) records.push({ ...v, year: last.getFullYear() });
    else if (last < faceCutoff && (v.faceEncoding?.length || v.photo)) faces.push(v);
  }
  return { total: all.length, records, faces };
}

// The Excel folder and the photos are on the campus computer.
function requireThisComputer() {
  if (config.online) throw new HttpError(409, "Clean-up works only on the campus computer.");
}

async function previewCleanup() {
  const { total, records, faces } = await findDue();
  return {
    total,
    facesDue: faces.length,
    recordsDue: records.length,
    faceMonths: config.faceRetentionMonths,
    recordMonths: config.recordRetentionMonths,
    automatic: config.autoCleanup,
    folder: archiveDir(),
  };
}

// Older records hold paths from other computers; only ever touch our upload folder.
async function deletePhoto(photo) {
  const name = photo?.split(/[\\/]/).pop();
  if (!name || name === "." || name === "..") return;
  await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
}

// Skips a record that changed since it was read, e.g. the visitor just came back.
function unchanged(v) {
  return v.updatedAt ? { _id: v._id, updatedAt: v.updatedAt } : { _id: v._id };
}

let running = false;

async function runCleanup() {
  requireThisComputer();
  if (running) throw new HttpError(409, "A clean-up is already running.");
  running = true;
  try {
    const { records, faces } = await findDue();
    let facesDeleted = 0;
    let recordsArchived = 0;
    const files = [];

    if (records.length) await requireDir();
    for (const year of [...new Set(records.map((v) => v.year))]) {
      const group = records.filter((v) => v.year === year);
      files.push(await archiveVisitors(year, group));
      for (const v of group) {
        const { deletedCount } = await Visitor.deleteOne(unchanged(v));
        if (!deletedCount) continue;
        recordsArchived += 1;
        await Otp.deleteMany({ visitorId: v._id });
        await deletePhoto(v.photo);
      }
    }

    for (const v of faces) {
      const { modifiedCount } = await Visitor.updateOne(
        unchanged(v),
        { $set: { faceEncoding: [], faceDeletedAt: new Date() }, $unset: { photo: "" } },
        { timestamps: false },
      );
      if (!modifiedCount) continue;
      facesDeleted += 1;
      await deletePhoto(v.photo);
    }

    // The activity history is kept exactly as long as the records it describes.
    await Activity.deleteMany({ at: { $lt: monthsAgo(config.recordRetentionMonths) } });

    console.log(`[cleanup] face data deleted: ${facesDeleted}, records moved to Excel: ${recordsArchived}`);
    return { facesDeleted, recordsArchived, files };
  } finally {
    running = false;
  }
}

// Runs soon after start and then daily, so it still happens if the laptop is off at night.
function startCleanupSchedule() {
  if (!config.autoCleanup) return;
  const tick = () => {
    if (!isDbConnected()) return;
    forEachOrg(runCleanup).catch((err) => console.error("[cleanup] stopped:", err.message));
  };
  setTimeout(tick, FIRST_RUN_MS);
  setInterval(tick, DAY_MS);
}

module.exports = { previewCleanup, runCleanup, startCleanupSchedule };
