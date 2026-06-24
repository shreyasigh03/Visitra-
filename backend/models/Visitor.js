const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  reason: String,
  toMeet: String,
  date: String,
  passId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Visitor", visitorSchema);