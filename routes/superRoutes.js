// The owners of VISITRA: they manage organizations, never an organization's visitors.
const express = require("express");
const { isValidObjectId } = require("mongoose");
const config = require("../config/env");
const Organization = require("../models/Organization");
const OrgAdmin = require("../models/OrgAdmin");
const Teacher = require("../models/Teacher");
const Visitor = require("../models/Visitor");
const { requireSuper, signSuperToken } = require("../middleware/auth");
const { HOME_ORG, runAsSystem, runInOrg } = require("../services/tenant");
const { hashPassword, sameSecret } = require("../utils/password");
const HttpError = require("../utils/httpError");

const router = express.Router();

const MIN_PASSWORD = 10;

router.use((req, res, next) => runAsSystem(next));

router.post("/login", (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const ready = Boolean(config.superAdminEmail) && config.superAdminPassword.length >= MIN_PASSWORD;
  const ok = sameSecret(email, config.superAdminEmail) & sameSecret(password, config.superAdminPassword);
  if (!ready || !ok) throw new HttpError(401, "Invalid email or password.");
  res.json({ token: signSuperToken(config.superAdminEmail) });
});

router.use(requireSuper);

async function listOrganizations() {
  const orgs = await Organization.find().sort({ active: -1, name: 1 }).lean();
  return Promise.all(
    orgs.map(async ({ _id, code, name, type, active }) => ({
      id: _id,
      code,
      name,
      type,
      active,
      home: code === HOME_ORG,
      // Numbers only.
      visitors: await runInOrg(code, async () => Visitor.countDocuments()),
      teachers: await runInOrg(code, async () => Teacher.countDocuments()),
      admin: code === HOME_ORG ? config.adminEmail : (await OrgAdmin.findOne({ org: code }).lean())?.email ?? "",
    })),
  );
}

router.get("/organizations", async (req, res) => res.json(await listOrganizations()));

router.post("/organizations", async (req, res) => {
  const text = (key) => (typeof req.body[key] === "string" ? req.body[key].trim() : "");
  const code = text("code").toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(code)) throw new HttpError(400, "Short name: 2 to 12 capital letters or numbers.");
  if (!text("name")) throw new HttpError(400, "Please enter the organization's name.");
  if (!["university", "office"].includes(text("type"))) throw new HttpError(400, "Please choose the type.");
  if (await Organization.exists({ code })) throw new HttpError(409, "This short name is already used.");
  await Organization.create({ code, name: text("name"), type: text("type"), active: false });
  res.status(201).json(await listOrganizations());
});

// Sets or replaces the organization's admin. The old admin is signed out.
router.put("/organizations/:id/admin", async (req, res) => {
  const org = isValidObjectId(req.params.id) ? await Organization.findById(req.params.id).lean() : null;
  if (!org) throw new HttpError(404, "Organization not found.");
  if (org.code === HOME_ORG) throw new HttpError(400, "This organization's admin is set in the server settings.");
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Use at least ${MIN_PASSWORD} characters for the password.`);
  if (email === config.adminEmail || (await OrgAdmin.exists({ email, org: { $ne: org.code } }))) {
    throw new HttpError(409, "This email is already an admin elsewhere.");
  }
  const passwordHash = await hashPassword(password);
  await OrgAdmin.findOneAndUpdate(
    { org: org.code },
    { $set: { email, passwordHash, active: true }, $inc: { tokenVersion: 1 } },
    { upsert: true },
  );
  res.json(await listOrganizations());
});

router.put("/organizations/:id/active", async (req, res) => {
  const org = isValidObjectId(req.params.id) ? await Organization.findById(req.params.id) : null;
  if (!org) throw new HttpError(404, "Organization not found.");
  if (org.code === HOME_ORG) throw new HttpError(400, "The main organization is always on.");
  const active = req.body.active === true;
  if (active && !(await OrgAdmin.exists({ org: org.code, active: true }))) throw new HttpError(400, "Set an admin for this organization first.");
  org.active = active;
  await org.save();
  res.json(await listOrganizations());
});

module.exports = router;
