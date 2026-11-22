// Guard login and gate work. The admin can use everything here too.
const path = require("path");
const express = require("express");
const { isValidObjectId } = require("mongoose");
const Guard = require("../models/Guard");
const Visitor = require("../models/Visitor");
const upload = require("../middleware/upload");
const { requireGate, signGuardToken } = require("../middleware/auth");
const { checkVisitor, closeById, closeForgotten, findInside, isInside, isOverstay, logDenied, recordScan } = require("../services/gate");
const { HOME_ORG, runAsSystem, setOrg } = require("../services/tenant");
const { logActivity } = require("../services/activity");
const { decodeQr } = require("../utils/faceService");
const { checkPassword } = require("../utils/password");
const { todayLocal } = require("../utils/dates");
const HttpError = require("../utils/httpError");

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, "..", "upload");

// Guards see what they need at the gate, not emails or phone numbers.
const view = (v) => ({
  _id: v._id,
  name: v.name,
  toMeet: v.toMeet,
  reason: v.reason,
  date: v.date,
  visitTime: v.visitTime,
  status: v.status,
  passId: v.passId,
  entryTime: v.entryTime,
  exitTime: v.exitTime,
  entryGranted: v.entryGranted,
  groupMembers: v.groupMembers ?? [],
  inside: isInside(v),
  overstay: isOverstay(v),
});

router.post("/login", async (req, res) => {
  const username = String(req.body.username ?? "").trim().toLowerCase();
  const guard = await runAsSystem(async () => Guard.findOne({ username, active: true }).select("+passwordHash"));
  if (!(await checkPassword(String(req.body.password ?? ""), guard?.passwordHash))) {
    throw new HttpError(401, "Invalid username or password.");
  }
  setOrg(guard.org ?? HOME_ORG);
  logActivity({ actor: `Guard ${guard.name}`, type: "login" });
  res.json({ token: signGuardToken(guard) });
});

router.use(requireGate);

router.get("/me", (req, res) => res.json({ name: req.gateUser }));

router.get("/today", async (req, res) => {
  const start = new Date(todayLocal());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const [today, inside] = await Promise.all([
    Visitor.find({ date: { $gte: start, $lt: end }, status: { $ne: "pending" } }).select("-photo").lean(),
    findInside(),
  ]);
  const byId = new Map([...today, ...inside].map((v) => [String(v._id), v]));
  res.json([...byId.values()].map(view).sort((a, b) => a.name.localeCompare(b.name)));
});

// Looks up a pass. Nothing is recorded until the guard confirms.
router.post("/scan", async (req, res) => {
  const passId = String(req.body.passId ?? "").trim();
  if (!/^\d{4,10}$/.test(passId)) throw new HttpError(400, "This is not a VISITRA pass.");
  const visitor = await Visitor.findOne({ passId });
  if (!visitor) throw new HttpError(404, "No visitor has this pass.");

  const check = await checkVisitor(visitor);
  if (!check.allowed) logDenied(visitor, check, req.gateUser);
  res.json({ ...check, hasPhoto: Boolean(visitor.photo), visitor: view(visitor) });
});

router.post("/confirm", async (req, res) => {
  const { id, action } = req.body;
  if (typeof id !== "string" || !isValidObjectId(id)) throw new HttpError(404, "Visitor not found.");
  const visitor = await Visitor.findById(id);
  if (!visitor) throw new HttpError(404, "Visitor not found.");

  // Checked again, because the visit may have changed since the scan.
  const check = await checkVisitor(visitor);
  if (!check.allowed || check.action !== action) throw new HttpError(409, check.message);
  if (!(await recordScan(visitor, action, req.gateUser))) throw new HttpError(409, "This visit just changed. Please scan again.");
  res.json({ action, visitor: view(visitor) });
});

router.get("/photo/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(404, "No photo.");
  const visitor = await Visitor.findById(req.params.id).select("photo +photoData").lean();
  if (visitor?.photoData) return res.type("jpg").send(visitor.photoData.buffer);
  const name = visitor?.photo?.split(/[\\/]/).pop();
  if (!name) throw new HttpError(404, "No photo.");
  res.sendFile(name, { root: UPLOAD_DIR }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ message: "No photo." });
  });
});

// For browsers that cannot read QR codes themselves.
router.post("/decode-qr", upload.single("img"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "No image received.");
  res.json({ text: (await decodeQr(req.file.buffer)).text || "" });
});

router.get("/overstays", async (req, res) => {
  res.json((await findInside()).filter((v) => isOverstay(v)).map(view));
});

router.post("/close-forgotten", async (req, res) => {
  res.json({ closed: await closeForgotten(req.gateUser) });
});

router.post("/close/:id", async (req, res) => {
  await closeById(req.params.id, req.gateUser);
  res.json({ ok: true });
});

module.exports = router;
