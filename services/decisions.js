// A teacher's answer to a visitor, from the dashboard or from an email.
const { isValidObjectId } = require("mongoose");
const Visitor = require("../models/Visitor");
const { releaseSlots } = require("./slots");
const { logActivity } = require("./activity");
const sendEmail = require("../utils/sendEmail");
const { approvedEmail, rejectedEmail, rescheduledEmail } = require("../utils/emailTemplates");
const { todayLocal } = require("../utils/dates");
const { inBackground } = require("../utils/background");
const HttpError = require("../utils/httpError");

async function apply(teacher, visitorId, answer) {
  const changes = { ...answer, answeredAt: new Date() };
  if (!isValidObjectId(visitorId)) throw new HttpError(404, "Request not found.");
  const mine = { _id: visitorId, teacherId: teacher._id };
  const update = (filter, set) =>
    Visitor.findOneAndUpdate({ ...mine, ...filter }, { $set: set }, { returnDocument: "after" }).select("-photo");

  // Before a first approval, a recorded "entry" can only be a refused scan at the gate.
  const firstApproval = changes.status === "approved" ? { ...changes, entryTime: null, exitTime: null } : changes;
  let visitor = await update({ status: "verified" }, firstApproval);
  if (!visitor) {
    // A visit that already happened keeps its date, so its history stays true.
    const filter = changes.rescheduled ? { entryTime: null } : {};
    visitor = await update({ status: { $in: ["approved", "rejected"] }, ...filter }, changes);
  }
  if (!visitor) {
    if (changes.rescheduled && (await Visitor.exists({ ...mine, entryTime: { $ne: null } }))) {
      throw new HttpError(409, "This visitor has already come in, so the visit can't be moved.");
    }
    throw new HttpError(404, "Request not found.");
  }
  return visitor;
}

const log = (teacher, type, visitor, via, details = "") =>
  logActivity({ actor: `Teacher ${teacher.name}`, type, visitor, details: [details, via].filter(Boolean).join(" ") });

// The answer is saved even if this email fails.
function tellVisitor(visitor, email) {
  const sent = sendEmail({ to: visitor.email, ...email }).catch((err) =>
    console.error(`[email] decision email to visitor ${visitor._id} failed:`, err.message),
  );
  inBackground(sent);
}

// `via` says where the answer came from, e.g. "by email".
async function approve(teacher, visitorId, via) {
  const visitor = await apply(teacher, visitorId, { status: "approved" });
  log(teacher, "approved", visitor, via);
  tellVisitor(visitor, approvedEmail(visitor));
  return visitor;
}

async function reject(teacher, visitorId, message, via) {
  const visitor = await apply(teacher, visitorId, { status: "rejected" });
  await releaseSlots(visitor._id);
  log(teacher, "rejected", visitor, via);
  tellVisitor(visitor, rejectedEmail(visitor, message));
  return visitor;
}

// Moves the visit and approves it for the new day.
async function reschedule(teacher, visitorId, date, time, via) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new HttpError(400, "Please choose a valid date.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, "Please choose a valid time.");
  if (date < todayLocal()) throw new HttpError(400, "Please choose today or a later date.");
  const visitor = await apply(teacher, visitorId, { status: "approved", date: new Date(date), visitTime: time, rescheduled: true });
  await releaseSlots(visitor._id); // the old time is free again
  log(teacher, "rescheduled", visitor, via, `to ${date} ${time}`);
  tellVisitor(visitor, rescheduledEmail(visitor));
  return visitor;
}

module.exports = { approve, reject, reschedule };
