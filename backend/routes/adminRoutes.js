const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

//admin login wala logic hai
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log("admin api hot hui");

    // clean input
    email = email?.trim().toLowerCase();
    password = password?.toString().trim();

    console.log("LOGIN ATTEMPT:", email, password);
    const allAdmins = await Admin.find({});
    console.log("ALL ADMINS IN DB:", allAdmins);

    const admin = await Admin.findOne({
      email: email,
      password: password
    });

    console.log("DB RESULT:", admin);
    if (!admin) {
      console.log("No matching admin found for:", email, password);
    }

    if (!admin) {
      return res.json({ status: "invalid" });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ status: "error" });
  }
});

module.exports = router;