// Admin side of teacher accounts, mounted under /api/admin/teachers.
const express = require("express");
const { isValidObjectId } = require("mongoose");
const Teacher = require("../models/Teacher");
const { logActivity } = require("../services/activity");
const { addSlots, listSlots, removeSlot } = require("../services/slots");
const { runAsSystem } = require("../services/tenant");
const { sendInvite } = require("../services/teacherInvite");
const HttpError = require("../utils/httpError");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const view = (t) => ({
  id: t._id,
  name: t.name,
  email: t.email,
  department: t.department,
  active: t.active,
  hasPassword: Boolean(t.passwordHash),
});

async function invite(teacher) {
  try {
    await sendInvite(teacher);
    return { inviteSent: true, message: `A link to set a password was emailed to ${teacher.email}.` };
  } catch (err) {
    console.error("[email] teacher invite failed:", err.message);
    return { inviteSent: false, message: "The email could not be sent. Check the address, then press Send link." };
  }
}

router.get("/", async (req, res) => {
  const teachers = await Teacher.find().select("+passwordHash").sort({ name: 1 }).lean();
  res.json(teachers.map(view));
});

router.post("/", async (req, res) => {
  const text = (key) => String(req.body[key] ?? "").trim();
  const email = text("email").toLowerCase();
  if (!text("name")) throw new HttpError(400, "Please enter the teacher's name.");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (await runAsSystem(async () => Teacher.exists({ email }))) throw new HttpError(409, "A teacher with this email already exists.");

  const teacher = await Teacher.create({ name: text("name"), email, department: text("department") });
  logActivity({ actor: "Admin", type: "teacher", subject: teacher.name, details: "Teacher added" });
  res.status(201).json({ teacher: view(teacher), ...(await invite(teacher)) });
});

router.post("/:id/invite", async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, active: true });
  if (!teacher) throw new HttpError(404, "Teacher not found, or turned off.");
  res.json(await invite(teacher));
});

async function requireOwnTeacher(req, res, next) {
  if (!isValidObjectId(req.params.id) || !(await Teacher.exists({ _id: req.params.id }))) throw new HttpError(404, "Teacher not found.");
  next();
}

router.get("/:id/slots", requireOwnTeacher, async (req, res) => res.json(await listSlots(req.params.id)));

router.post("/:id/slots", requireOwnTeacher, async (req, res) => {
  const added = await addSlots(req.params.id, req.body);
  res.json({ added, slots: await listSlots(req.params.id) });
});

router.delete("/:id/slots/:slotId", requireOwnTeacher, async (req, res) => {
  if (!isValidObjectId(req.params.slotId)) throw new HttpError(404, "This slot is already gone.");
  await removeSlot(req.params.id, req.params.slotId);
  res.json({ slots: await listSlots(req.params.id) });
});

// Turning a teacher off signs them out and hides them from the registration form.
router.put("/:id/active", async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { $set: { active: req.body.active === true }, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" },
  ).select("+passwordHash");
  if (!teacher) throw new HttpError(404, "Teacher not found.");
  logActivity({ actor: "Admin", type: "teacher", subject: teacher.name, details: teacher.active ? "Turned on" : "Turned off" });
  res.json(view(teacher));
});

module.exports = router;
