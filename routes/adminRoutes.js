const express = require("express");
const config = require("../config/env");
const { signAdminToken, requireAdmin } = require("../middleware/auth");
const { previewCleanup, runCleanup } = require("../services/retention");
const { searchArchive } = require("../services/archive");
const { logActivity } = require("../services/activity");
const OrgAdmin = require("../models/OrgAdmin");
const { requireActiveOrg } = require("../services/organizations");
const { HOME_ORG, setOrg } = require("../services/tenant");
const { checkPassword, sameSecret } = require("../utils/password");
const adminSecurityRoutes = require("./adminSecurityRoutes");
const adminTeacherRoutes = require("./adminTeacherRoutes");
const HttpError = require("../utils/httpError");

const router = express.Router();

router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  let token = "";
  if (sameSecret(email, config.adminEmail) & sameSecret(password, config.adminPassword)) {
    setOrg(HOME_ORG);
    token = signAdminToken(config.adminEmail, HOME_ORG);
  } else {
    const admin = await OrgAdmin.findOne({ email, active: true }).select("+passwordHash");
    if (await checkPassword(password, admin?.passwordHash)) {
      await requireActiveOrg(admin.org);
      setOrg(admin.org);
      token = signAdminToken(admin.email, admin.org, admin.tokenVersion);
    }
  }
  logActivity({ actor: "Admin", type: token ? "login" : "login-failed" });
  if (!token) throw new HttpError(401, "Invalid email or password.");
  res.json({ token });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ email: req.admin.email, role: "Administrator", org: req.admin.org });
});

router.use("/teachers", requireAdmin, adminTeacherRoutes);

// What a clean-up would remove right now. Changes nothing.
router.get("/cleanup", requireAdmin, async (req, res) => {
  res.json(await previewCleanup());
});

router.post("/cleanup", requireAdmin, async (req, res) => {
  if (req.body.confirm !== true) throw new HttpError(400, "Please confirm the clean-up first.");
  const result = await runCleanup();
  logActivity({
    actor: "Admin",
    type: "cleanup",
    details: `${result.recordsArchived} records to Excel, face data of ${result.facesDeleted} visitors deleted`,
  });
  res.json(result);
});

// Past visitors, read from the Excel files.
router.get("/archive", requireAdmin, async (req, res) => {
  res.json(await searchArchive({ search: String(req.query.search ?? ""), year: String(req.query.year ?? "") }));
});

router.use(requireAdmin, adminSecurityRoutes);

module.exports = router;
