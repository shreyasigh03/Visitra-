const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const { isValidObjectId, Types } = require("mongoose");

const Visitor = require("../models/Visitor");
const Otp = require("../models/Otp");
const Teacher = require("../models/Teacher");
const upload = require("../middleware/upload");
const { requireAdmin } = require("../middleware/auth");
const { registerLimiter, sendOtpLimiter, verifyOtpLimiter } = require("../middleware/rateLimits");
const { checkFace, generateEmbedding, findBestMatch } = require("../utils/faceService");
const { notifyTeacher } = require("../services/teacherNotify");
const { localDay, todayLocal } = require("../utils/dates");
const { confirmSlot, freeSlots, holdSlot, releaseSlots } = require("../services/slots");
const { logActivity } = require("../services/activity");
const { findBlacklisted } = require("../services/blacklist");
const { checkVisitor, isInside, isValidToday, logDenied, recordScan } = require("../services/gate");
const sendEmail = require("../utils/sendEmail");
const { otpEmail, approvedEmail, rejectedEmail } = require("../utils/emailTemplates");
const { inBackground } = require("../utils/background");
const HttpError = require("../utils/httpError");

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, "..", "upload");
const OTP_VALID_MINUTES = 5;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const MAX_REASON = 100;
const MAX_GROUP = 50; // people coming with the visitor

// Only accept plain id strings, never query objects such as { "$ne": null }.
function readVisitorId(body) {
  const { visitorId } = body;
  if (typeof visitorId !== "string" || !isValidObjectId(visitorId)) {
    throw new HttpError(400, "Registration not found. Please register again.");
  }
  return visitorId;
}

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

async function generatePassId() {
  for (let i = 0; i < 10; i++) {
    const passId = String(crypto.randomInt(100000, 1000000));
    if (!(await Visitor.exists({ passId }))) return passId;
  }
  throw new HttpError(500, "Could not generate a pass ID. Please try again.");
}

async function savePhoto(buffer) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, `${Date.now()}-${crypto.randomUUID()}.jpg`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

// Creates a fresh OTP for the visitor and emails it. Throws if the email fails.
async function issueOtp(visitor) {
  const otp = String(crypto.randomInt(1000, 10000));
  await Otp.deleteMany({ visitorId: visitor._id });
  await Otp.create({
    visitorId: visitor._id,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_VALID_MINUTES * 60_000),
  });
  await sendEmail({ to: visitor.email, ...otpEmail({ name: visitor.name, otp, minutes: OTP_VALID_MINUTES }) });
}

// The host is a teacher from the list, or a typed name that the admin approves.
async function readHost(body) {
  const id = typeof body.teacherId === "string" ? body.teacherId : "";
  if (!id) return { toMeet: typeof body.toMeet === "string" ? body.toMeet.trim() : "" };
  const teacher = isValidObjectId(id) ? await Teacher.findOne({ _id: id, active: true }).lean() : null;
  if (!teacher) throw new HttpError(400, "That teacher is no longer available. Please choose again.");
  return { teacherId: teacher._id, toMeet: teacher.name };
}

// Names of the people coming along, one form field holding a JSON list.
function readGroup(body) {
  if (!body.groupMembers) return [];
  let names;
  try {
    names = JSON.parse(body.groupMembers);
  } catch {
    names = null;
  }
  if (!Array.isArray(names) || names.some((n) => typeof n !== "string")) throw new HttpError(400, "The group list is not valid.");
  const clean = names.map((n) => n.trim().slice(0, 60)).filter(Boolean);
  if (clean.length > MAX_GROUP) throw new HttpError(400, `A group can have up to ${MAX_GROUP + 1} people.`);
  return clean;
}

function readRegistration(body, host) {
  const pick = (key) => (typeof body[key] === "string" ? body[key].trim() : "");
  const data = {
    name: pick("name"),
    email: pick("email").toLowerCase(),
    phone: pick("phone"),
    reason: pick("reason"),
    ...host,
    date: pick("date"),
    groupMembers: readGroup(body),
  };

  if (!data.name || !data.email || !data.phone || !data.reason || !data.toMeet || !data.date) {
    throw new HttpError(400, "Please fill in all the fields.");
  }
  if (!EMAIL_RE.test(data.email)) throw new HttpError(400, "Please enter a valid email address.");
  if (!PHONE_RE.test(data.phone)) throw new HttpError(400, "Please enter a 10-digit phone number.");
  if (data.reason.length > MAX_REASON) throw new HttpError(400, `Please keep the reason under ${MAX_REASON} characters.`);
  if (Number.isNaN(Date.parse(data.date))) throw new HttpError(400, "Please choose a valid visit date.");
  return data;
}

// When the teacher has free times that day, the visitor must take one of them.
async function bookSlot(body, data, visitorId) {
  if (!data.teacherId) return null;
  const { hasSlots } = await freeSlots(data.teacherId, data.date);
  if (!hasSlots) return null;
  if (typeof body.slotId !== "string" || !isValidObjectId(body.slotId)) throw new HttpError(400, "Please choose a time.");
  return holdSlot({ slotId: body.slotId, teacherId: data.teacherId, date: data.date, visitorId });
}

// ---------- Public (visitor + gate) ----------

// The camera asks this until a photo is good, so nothing is saved here.
router.post("/check-face", upload.single("img"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "No image received from the camera.");
  const { success, message } = await checkFace(req.file.buffer);
  res.json({ success, message });
});

router.post("/register", registerLimiter, upload.single("photo"), async (req, res) => {
  const data = readRegistration(req.body, await readHost(req.body));
  if (!req.file) throw new HttpError(400, "Please capture a face photo before registering.");
  if (await findBlacklisted(data)) {
    logActivity({ actor: "Registration", type: "blacklist-alert", subject: data.name, details: "Blacklisted person tried to register" });
    throw new HttpError(403, "Registration is not available for you. Please contact the reception.");
  }

  const face = await generateEmbedding(req.file.buffer);
  if (!face.success) throw new HttpError(400, face.message || "Face could not be processed.");

  const _id = new Types.ObjectId();
  const slot = await bookSlot(req.body, data, _id);
  let visitor;
  try {
    visitor = await Visitor.create({
      _id,
      ...data,
      visitTime: slot?.time,
      passId: await generatePassId(),
      photo: await savePhoto(req.file.buffer),
      faceEncoding: face.embedding,
    });
  } catch (err) {
    await releaseSlots(_id);
    throw err;
  }

  logActivity({ actor: "Visitor", type: "registered", visitor, details: `To meet ${visitor.toMeet}` });

  let otpSent = true;
  try {
    await issueOtp(visitor);
  } catch (err) {
    otpSent = false;
    console.error("[otp] initial OTP email failed:", err.message);
  }

  res.status(201).json({
    visitorId: visitor._id,
    passId: visitor.passId,
    visitTime: visitor.visitTime,
    otpSent,
    resendAfter: OTP_RESEND_SECONDS,
    message: otpSent ? "OTP sent to your email." : "Registered, but the OTP email failed. Tap 'Resend OTP'.",
  });
});

router.post("/send-otp", sendOtpLimiter, async (req, res) => {
  const visitor = await Visitor.findById(readVisitorId(req.body));
  if (!visitor) throw new HttpError(404, "Registration not found. Please register again.");
  if (visitor.status !== "pending") throw new HttpError(400, "This registration is already verified.");

  const last = await Otp.findOne({ visitorId: visitor._id });
  const waitMs = last ? last.createdAt.getTime() + OTP_RESEND_SECONDS * 1000 - Date.now() : 0;
  if (waitMs > 0) throw new HttpError(429, `Please wait ${Math.ceil(waitMs / 1000)}s before requesting a new OTP.`);

  await issueOtp(visitor);
  res.json({ message: "OTP sent to your email.", resendAfter: OTP_RESEND_SECONDS });
});

router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const visitorId = readVisitorId(req.body);
  const otp = String(req.body.otp ?? "").trim();

  const record = await Otp.findOne({ visitorId });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ status: "expired", message: "OTP expired. Please tap 'Resend OTP'." });
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ status: "locked", message: "Too many wrong attempts. Please resend a new OTP." });
  }
  if (record.otpHash !== hashOtp(otp)) {
    record.attempts += 1;
    await record.save();
    const left = OTP_MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({ status: "invalid", message: `Wrong OTP. ${left} attempt${left === 1 ? "" : "s"} left.` });
  }

  await Otp.deleteMany({ visitorId });
  const visitor = await Visitor.findOneAndUpdate(
    { _id: visitorId, status: "pending" },
    { status: "verified" },
    { returnDocument: "after" },
  );
  // The hold may have run out while the visitor waited.
  const lostSlot = Boolean(visitor?.visitTime) && !(await confirmSlot(visitor._id));
  if (lostSlot) {
    await Visitor.updateOne({ _id: visitor._id }, { $unset: { visitTime: "" } });
    visitor.visitTime = undefined;
  }
  res.json({
    status: "verified",
    visitTime: visitor?.visitTime,
    message: lostSlot ? "OTP verified, but your time was taken by someone else. The teacher will tell you a new time." : "OTP verified successfully.",
  });

  if (visitor) logActivity({ actor: "Visitor", type: "verified", visitor });

  // Only on the first verification, so the teacher is told once.
  if (visitor?.teacherId) {
    inBackground(notifyTeacher(visitor).catch((err) => console.error("[notify] teacher:", err.message)));
  }
});

// Gate kiosk: identify a face and log entry / exit.
router.post("/verify-face", upload.single("img"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "No image received from the camera.");

  const face = await generateEmbedding(req.file.buffer);
  if (!face.success) throw new HttpError(400, face.message || "Face could not be processed.");

  const candidates = await Visitor.find({ "faceEncoding.0": { $exists: true } })
    .select("+faceEncoding")
    .lean();
  if (!candidates.length) return res.json({ success: false, message: "No registered visitors yet." });

  // One person can have many registrations. Try who came in today, then who may come in
  // today, then visits left open earlier, then the rest (to say why entry is refused).
  const rank = (v) => {
    if (isInside(v)) return localDay(v.entryTime) === todayLocal() ? 0 : 2;
    return isValidToday(v) ? 1 : 3;
  };
  let match = { success: false };
  for (const group of [0, 1, 2, 3].map((n) => candidates.filter((v) => rank(v) === n))) {
    if (group.length) match = await findBestMatch(face.embedding, group);
    if (match.success) break;
  }
  if (!match.success) return res.json({ success: false, message: "Face not recognized." });

  const visitor = await Visitor.findById(match.visitor_id).select("-photo");
  if (!visitor) return res.json({ success: false, message: "Visitor not found." });

  const check = await checkVisitor(visitor);
  const reply = (success, extra) => res.json({ success, similarity: match.similarity, visitor, ...extra });
  if (!check.allowed) {
    logDenied(visitor, check, "Face scan");
    // A public screen must not show anyone the details behind a blacklist entry.
    if (check.code === "blacklisted") return res.json({ success: false, message: check.message });
    return reply(false, { message: check.message });
  }
  if (!(await recordScan(visitor, check.action, "Face scan"))) throw new HttpError(409, "This visit just changed. Please scan again.");
  return reply(true, {
    entryStatus: check.action,
    message: check.action === "exit" ? "Goodbye! Exit recorded." : "Entry granted — authorized visitor.",
  });
});

// ---------- Admin only ----------

router.get("/all", requireAdmin, async (req, res) => {
  const visitors = await Visitor.find().select("-photo").sort({ createdAt: -1 }).lean();
  res.json(visitors);
});

router.put("/update/:id", requireAdmin, async (req, res) => {
  const { status, message } = req.body;
  if (!["approved", "rejected"].includes(status)) throw new HttpError(400, "Status must be approved or rejected.");

  const update = (filter, set) =>
    Visitor.findOneAndUpdate({ _id: req.params.id, ...filter }, { $set: set }, { returnDocument: "after" }).select("-photo");
  // Before a first approval, a recorded "entry" can only be a refused scan at the gate.
  let visitor = null;
  if (status === "approved") {
    visitor = await update({ status: { $in: ["pending", "verified"] } }, { status, answeredAt: new Date(), entryTime: null, exitTime: null });
  }
  visitor ??= await update({}, { status, answeredAt: new Date() });
  if (!visitor) throw new HttpError(404, "Visitor not found.");
  if (status === "rejected") await releaseSlots(visitor._id);
  logActivity({ actor: "Admin", type: status, visitor });

  res.json(visitor);

  // Email after responding so the dashboard doesn't wait on Gmail.
  const email = status === "approved" ? approvedEmail(visitor) : rejectedEmail(visitor, message);
  const sent = sendEmail({ to: visitor.email, ...email }).catch((err) =>
    console.error(`[email] ${status} email to visitor ${visitor._id} failed:`, err.message),
  );
  inBackground(sent);
});

router.get("/verify/:passId", requireAdmin, async (req, res) => {
  const visitor = await Visitor.findOne({ passId: req.params.passId }).select("-photo").lean();
  res.json(visitor ? { status: "valid", visitor } : { status: "invalid" });
});

module.exports = router;
