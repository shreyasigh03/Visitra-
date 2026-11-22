const mongoose = require("mongoose");

// How far VISITRA has read each mailbox, so an answer is used exactly once.
const mailStateSchema = new mongoose.Schema({
  mailbox: { type: String, required: true, unique: true },
  uidValidity: Number,
  lastUid: Number,
});

module.exports = mongoose.model("MailState", mailStateSchema);
