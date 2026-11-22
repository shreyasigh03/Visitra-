const express = require("express");
const Organization = require("../models/Organization");

const router = express.Router();

// Public list for choosing an organization.
router.get("/list", async (req, res) => {
  const orgs = await Organization.find().sort({ active: -1, name: 1 }).lean();
  res.json(orgs.map(({ code, name, type, active }) => ({ code, name, type, active })));
});

module.exports = router;
