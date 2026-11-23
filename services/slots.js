// Free time slots of teachers.
const Slot = require("../models/Slot");
const { todayLocal } = require("../utils/dates");
const HttpError = require("../utils/httpError");

const HOLD_MS = 15 * 60 * 1000;
const MAX_PER_DAY = 48;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const LENGTHS = [15, 20, 30, 45, 60];

const nowTime = () => new Date().toTimeString().slice(0, 5);
const isPast = (s) => s.date < todayLocal() || (s.date === todayLocal() && s.time <= nowTime());
const isFree = (s) => !s.visitorId || (!s.confirmed && s.heldUntil < new Date());

const view = (s) => ({ id: s._id, date: s.date, time: s.time, booked: !isFree(s) });

function readDate(date) {
  const text = String(date ?? "");
  if (!DATE_RE.test(text) || Number.isNaN(Date.parse(text))) throw new HttpError(400, "Please choose a valid date.");
  return text;
}

async function listSlots(teacherId) {
  const slots = await Slot.find({ teacherId, date: { $gte: todayLocal() } }).sort({ date: 1, time: 1 }).lean();
  return slots.filter((s) => !isPast(s)).map(view);
}

// What a visitor can choose on one day. `hasSlots` is false when the teacher set none.
async function freeSlots(teacherId, date) {
  const slots = await Slot.find({ teacherId, date: readDate(date) }).sort({ time: 1 }).lean();
  return { hasSlots: slots.length > 0, slots: slots.filter((s) => isFree(s) && !isPast(s)).map(view) };
}

const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Cuts e.g. 10:00-12:00 into 30-minute slots. Existing slots are left as they are.
async function addSlots(teacherId, { date, from, to, length }) {
  readDate(date);
  if (date < todayLocal()) throw new HttpError(400, "Please choose today or a later date.");
  if (!TIME_RE.test(from) || !TIME_RE.test(to) || from >= to) throw new HttpError(400, "The end time must be after the start time.");
  if (!LENGTHS.includes(Number(length))) throw new HttpError(400, "Please choose a slot length.");

  const times = [];
  for (let m = toMinutes(from); m + Number(length) <= toMinutes(to); m += Number(length)) times.push(toTime(m));
  if (!times.length) throw new HttpError(400, "This time range is shorter than one slot.");
  if (times.length > MAX_PER_DAY) throw new HttpError(400, "That is too many slots. Use a shorter range.");

  let added = 0;
  for (const time of times) {
    const result = await Slot.updateOne({ teacherId, date, time }, { $setOnInsert: { visitorId: null, confirmed: false } }, { upsert: true });
    added += result.upsertedCount;
  }
  return added;
}

async function removeSlot(teacherId, id) {
  const slot = await Slot.findOne({ _id: id, teacherId }).lean();
  if (!slot) throw new HttpError(404, "This slot is already gone.");
  const booked = new HttpError(409, "A visitor has booked this slot. Reject or reschedule the visit instead.");
  if (!isFree(slot)) throw booked;
  // Only if nobody took it in the meantime.
  const { deletedCount } = await Slot.deleteOne({ _id: id, teacherId, visitorId: slot.visitorId, confirmed: false });
  if (!deletedCount) throw booked;
}

// Holds the slot for this visitor, or throws if someone else has it.
async function holdSlot({ slotId, teacherId, date, visitorId }) {
  const now = new Date();
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, teacherId, date, $or: [{ visitorId: null }, { confirmed: false, heldUntil: { $lt: now } }] },
    { $set: { visitorId, confirmed: false, heldUntil: new Date(now.getTime() + HOLD_MS) } },
    { returnDocument: "after" },
  ).lean();
  if (!slot || isPast(slot)) {
    if (slot) await releaseSlots(visitorId);
    throw new HttpError(409, "That time was just taken. Please choose another.");
  }
  return slot;
}

async function confirmSlot(visitorId) {
  const { matchedCount } = await Slot.updateOne({ visitorId }, { $set: { confirmed: true, heldUntil: null } });
  return matchedCount > 0;
}

async function releaseSlots(visitorId) {
  await Slot.updateMany({ visitorId }, { $set: { visitorId: null, confirmed: false, heldUntil: null } });
}

module.exports = { addSlots, confirmSlot, freeSlots, holdSlot, listSlots, releaseSlots, removeSlot };
