const sendEmail = require("../utils/sendEmail");
const express = require("express");

//router server hai idhr
const router = express.Router();
const Visitor = require("../models/Visitor");
const Otp = require("../models/Otp");

// Register visitor
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, reason, toMeet, date, passId } = req.body;

    global.tempVisitor = {
      name,
      email,
      phone,
      reason,
      toMeet,
      date,
      passId
    };

    res.status(200).json({ message: "Details received. Please verify OTP." });
  } catch (error) {
    res.status(500).json({ error: "Error saving visitor" });
  }
});

//admin wale pg p sari details idhr se fecth hri hai 
router.get("/all", async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching visitors" });
  }
});


//jb visitor data bhja toh admin k opss data aaya usne fir jb approve p click kia toh api cakll hui usne database se us visitor ka data fetch kia fir status change kia res bhja frontend s data chnge hua 
router.put("/update/:id", async (req, res) => {
  try {
    const { status, message } = req.body;

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    //  ab agr statsu approve hgya toh email jaegi 
    //y format h email ka 
    if (status === "approved" && updatedVisitor && updatedVisitor.email) {
      try {
        await sendEmail(
          updatedVisitor.email,
          `
<div style="font-family: Arial; padding: 10px;">

<img src="https://github.com/vanshika-0/visitor-management/raw/main/visitra_logo.png" style="height:50px; margin-bottom:10px;" />

<h3>Hello ${updatedVisitor.name || "User"}</h3>

<p>Your visit request has been <b>APPROVED</b>.</p>

<p><b>Host:</b> ${updatedVisitor.toMeet || "-"}</p>
<p><b>Date:</b> ${updatedVisitor.date || "-"}</p>
<p><b>Pass ID:</b> ${updatedVisitor.passId || "-"}</p>

<br/>

<p>Please carry your ID during the visit.</p>

<p><b>VISITRA Team</b></p>

</div>
          `
        );
      } catch (emailErr) {
        console.log("Email error:", emailErr);
      }
    }

    // agr admin n reject krdi toh email jaegi rejectyed wali 
    if (status === "rejected" && updatedVisitor && updatedVisitor.email) {
      try {
        await sendEmail(
          updatedVisitor.email,
          `
<div style="font-family: Arial; padding: 10px;">

<img src="https://github.com/vanshika-0/visitor-management/raw/main/visitra_logo.png" style="height:50px; margin-bottom:10px;" />

<h3>Hello ${updatedVisitor.name || "User"}</h3>

<p>Your visit request has been <b>REJECTED</b>.</p>

<p><b>Reason:</b> ${message || "Not specified"}</p>

<p><b>Host:</b> ${updatedVisitor.toMeet || "-"}</p>
<p><b>Date:</b> ${updatedVisitor.date || "-"}</p>

<br/>

<p>For any queries, reply to this email.</p>

<p><b>VISITRA Team</b></p>

</div>
          `
        );
      } catch (emailErr) {
        console.log("Reject email error:", emailErr);
      }
    }

    res.json(updatedVisitor);
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
});

//admin pe verify p click krege toh 
router.get("/verify/:passId", async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ passId: req.params.passId });

    if (!visitor) {
      return res.json({ status: "invalid" });
    }

    return res.json({ status: "valid", visitor });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

//otp wala function 
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // delete old OTP if exists
    await Otp.deleteMany({ email });

    // store new OTP in DB
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000)
    });

    await sendEmail(email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP" });
  }
});


//verify
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.json({ status: "invalid" });
    }

    if (Date.now() > record.expiresAt) {
      await Otp.deleteMany({ email });
      return res.json({ status: "expired" });
    }

    if (record.otp === otp) {
      await Otp.deleteMany({ email });

      if (global.tempVisitor && global.tempVisitor.email === email) {
        const visitor = new Visitor(global.tempVisitor);
        await visitor.save();
        global.tempVisitor = null;
      }

      return res.json({ status: "verified" });
    } else {
      return res.json({ status: "invalid" });
    }
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
});
module.exports = router;