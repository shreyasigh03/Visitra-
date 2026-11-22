const jwt = require("jsonwebtoken");
const config = require("../config/env");
const Guard = require("../models/Guard");
const Teacher = require("../models/Teacher");
const OrgAdmin = require("../models/OrgAdmin");
const { requireActiveOrg } = require("../services/organizations");
const { HOME_ORG, setOrg } = require("../services/tenant");
const HttpError = require("../utils/httpError");

const ADMIN_TTL = "8h";
const GUARD_TTL = "12h";
const TEACHER_TTL = "30d"; // teachers stay signed in on their phone

// `org` is part of every token, so it cannot be changed from the browser.
const signAdminToken = (email, org, version = 0) =>
  jwt.sign({ sub: email, role: "admin", org, v: version }, config.jwtSecret, { expiresIn: ADMIN_TTL });

const signSuperToken = (email) => jwt.sign({ sub: email, role: "super" }, config.jwtSecret, { expiresIn: ADMIN_TTL });

const signTeacherToken = (teacher) =>
  jwt.sign({ sub: String(teacher._id), role: "teacher", org: teacher.org ?? HOME_ORG, v: teacher.tokenVersion }, config.jwtSecret, { expiresIn: TEACHER_TTL });

const signGuardToken = (guard) =>
  jwt.sign({ sub: String(guard._id), role: "guard", org: guard.org ?? HOME_ORG, v: guard.tokenVersion }, config.jwtSecret, { expiresIn: GUARD_TTL });

function readToken(req, ...roles) {
  const header = req.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, `Please log in as ${roles.join(" or ")}.`);
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    if (roles.includes(payload.role)) return payload;
  } catch {
    // Falls through to the same message for every kind of bad token.
  }
  throw new HttpError(401, "Your session has expired. Please log in again.");
}

// Checks the token and switches the request to that person's organization.
async function enter(req, ...roles) {
  const payload = readToken(req, ...roles);
  const org = payload.org ?? HOME_ORG;
  if (org !== HOME_ORG) await requireActiveOrg(org);
  setOrg(org);

  const ended = new HttpError(401, "Your session has ended. Please log in again.");
  if (payload.role === "admin") {
    // The home organization's admin is in backend/.env; the others are in the database.
    const known =
      (org === HOME_ORG && payload.sub === config.adminEmail) ||
      (await OrgAdmin.exists({ org, email: payload.sub, active: true, tokenVersion: payload.v ?? 0 }));
    if (!known) throw ended;
    req.admin = { email: payload.sub, org };
    return;
  }
  const Model = payload.role === "teacher" ? Teacher : Guard;
  const person = await Model.findOne({ _id: payload.sub, active: true, tokenVersion: payload.v });
  if (!person) throw ended;
  req[payload.role] = person;
}

async function requireAdmin(req, res, next) {
  await enter(req, "admin");
  next();
}

async function requireTeacher(req, res, next) {
  await enter(req, "teacher");
  next();
}

// Guards and the admin.
async function requireGate(req, res, next) {
  await enter(req, "guard", "admin");
  req.gateUser = req.guard ? `Guard ${req.guard.name}` : "Admin";
  next();
}

function requireSuper(req, res, next) {
  readToken(req, "super");
  next();
}

module.exports = { signAdminToken, signGuardToken, signSuperToken, signTeacherToken, requireAdmin, requireGate, requireSuper, requireTeacher };
