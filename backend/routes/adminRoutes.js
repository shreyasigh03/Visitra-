const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

//admin login wala logic hai
router.post("/login", async (req, res) => {
  const adminEmail="admin@gmail.com";
  const adminPassword="1234";
  try {
    let { email, password } = req.body;
    console.log("admin api hot hui");

    // clean input
    email = email?.trim().toLowerCase();
    password = password?.toString().trim();

    // console.log("LOGIN ATTEMPT:", email, password);
    // const allAdmins = await Admin.find({});
    // console.log("ALL ADMINS IN DB:", allAdmins);

    // const admin = await Admin.findOne({
    //   email: email,
    //   password: password
    // });

    // console.log("DB RESULT:", admin);
    if(email==adminEmail && password==adminPassword){
      return res.json({status:"success"});
    }
    else{
      return res.json({status:"Invalid credentials"})
    }
    // if (!admin) {
    //   console.log("No matching admin found for:", email, password);
    // }

    // if (!admin) {
    //   return res.json({ status: "No matching admin found" });
    // }

    // res.json({ status: "success" });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ status: "Server Error" });
  }
});

module.exports = router;