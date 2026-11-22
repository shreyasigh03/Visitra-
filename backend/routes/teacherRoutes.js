const express = require("express");
const { isValidObjectId } = require("mongoose");
const config = require("../config/env");
const Teacher = require("../models/Teacher");
const Visitor = require("../models/Visitor");
const { requireTeacher, signTeacherToken } = require("../middleware/auth");
const { hashInvite } = require("../services/teacherInvite");
const { approve, reject, reschedule } = require("../services/decisions");
const { addSlots, freeSlots, listSlots, removeSlot } = require("../services/slots");
const { runAsSystem } = require("../services/tenant");
const { pushReady } = require("../services/teacherNotify");
const { checkPassword, hashPassword } = require("../utils/password");
const { todayLocal } = require("../utils/dates");
const HttpError = require("../utils/httpError");

const router = express.Router();

const MIN_PASSWORD = 8;
const MAX_DEVICES = 10;
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)$/;

const publicTeacher = (t) => ({ id: t._id, name: t.name, email: t.email, department: t.department });

// ---------- Public ----------

// Names for the registration form.
router.get("/list", async (req, res) => {
  const teachers = await Teacher.find({ active: true }).select("name department").sort({ name: 1 }).lean();
  res.json(teachers.map(({ _id, name, department }) => ({ id: _id, name, department })));
});

// Free times of one teacher on one day.
router.get("/free", async (req, res) => {
  if (!isValidObjectId(req.query.teacherId)) throw new HttpError(400, "Please choose a teacher.");
  res.json(await freeSlots(req.query.teacherId, req.query.date));
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const teacher = await runAsSystem(async () => Teacher.findOne({ email, active: true }).select("+passwordHash"));
  const ok = await checkPassword(String(req.body.password ?? ""), teacher?.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password.");
  res.json({ token: signTeacherToken(teacher) });
});

router.post("/setup", async (req, res) => {
  const password = String(req.body.password ?? "");
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Use at least ${MIN_PASSWORD} characters.`);

  const passwordHash = await hashPassword(password);
  const teacher = await runAsSystem(async () =>
    Teacher.findOneAndUpdate(
      { inviteHash: hashInvite(String(req.body.token ?? "")), inviteExpires: { $gt: new Date() }, active: true },
      { $set: { passwordHash }, $unset: { inviteHash: "", inviteExpires: "" }, $inc: { tokenVersion: 1 } },
      { returnDocument: "after" },
    ),
  );
  if (!teacher) throw new HttpError(400, "This link has expired or was already used. Ask the admin for a new one.");
  res.json({ token: signTeacherToken(teacher) });
});

// ---------- Teacher only ----------

router.use(requireTeacher);

router.get("/me", (req, res) => {
  res.json({ ...publicTeacher(req.teacher), pushKey: pushReady ? config.vapidPublicKey : "" });
});

router.get("/requests", async (req, res) => {
  // A request reaches the teacher only after the visitor confirms their email.
  const visitors = await Visitor.find({ teacherId: req.teacher._id, status: { $ne: "pending" }, clearedByTeacher: { $ne: true } })
    .select("-photo")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json(visitors);
});

router.post("/requests/:id/approve", async (req, res) => {
  res.json(await approve(req.teacher, req.params.id));
});

router.post("/requests/:id/reject", async (req, res) => {
  res.json(await reject(req.teacher, req.params.id, String(req.body.message ?? "").slice(0, 500)));
});

router.post("/requests/:id/reschedule", async (req, res) => {
  res.json(await reschedule(req.teacher, req.params.id, String(req.body.date ?? ""), String(req.body.time ?? "")));
});

router.get("/slots", async (req, res) => res.json(await listSlots(req.teacher._id)));

router.post("/slots", async (req, res) => {
  const added = await addSlots(req.teacher._id, req.body);
  res.json({ added, slots: await listSlots(req.teacher._id) });
});

router.delete("/slots/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(404, "This slot is already gone.");
  await removeSlot(req.teacher._id, req.params.id);
  res.json({ slots: await listSlots(req.teacher._id) });
});

// Hides finished appointments from the teacher's list. Nothing is deleted.
router.post("/requests/clear", async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id) => typeof id === "string" && isValidObjectId(id)) : [];
  const { modifiedCount } = await Visitor.updateMany(
    {
      _id: { $in: ids },
      teacherId: req.teacher._id,
      $or: [{ status: "rejected" }, { status: "approved", exitTime: { $ne: null } }, { date: { $lt: new Date(todayLocal()) } }],
    },
    { $set: { clearedByTeacher: true } },
  );
  res.json({ cleared: modifiedCount });
});

router.post("/push", async (req, res) => {
  const { endpoint, keys } = req.body.subscription ?? {};
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new HttpError(400, "This browser's notification address is not valid.");
  }
  if (url.protocol !== "https:" || !PUSH_HOSTS.test(url.hostname) || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
    throw new HttpError(400, "This browser's notification service is not supported.");
  }

  const subscription = { endpoint: url.href, keys: { p256dh: keys.p256dh, auth: keys.auth } };
  // One phone belongs to one teacher at a time.
  await Teacher.updateMany({}, { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } });
  await Teacher.updateOne(
    { _id: req.teacher._id },
    { $push: { pushSubscriptions: { $each: [subscription], $slice: -MAX_DEVICES } } },
  );
  res.json({ ok: true });
});

router.post("/push/remove", async (req, res) => {
  await Teacher.updateOne(
    { _id: req.teacher._id },
    { $pull: { pushSubscriptions: { endpoint: String(req.body.endpoint ?? "") } } },
  );
  res.json({ ok: true });
});

module.exports = router;
