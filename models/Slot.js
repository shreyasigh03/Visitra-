const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

// A time when a teacher is free.
const slotSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String, required: true }, // "HH:mm"
  visitorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  // A slot is held for a few minutes until the visitor confirms the OTP.
  confirmed: { type: Boolean, default: false },
  heldUntil: { type: Date, default: null },
});
slotSchema.index({ teacherId: 1, date: 1, time: 1 }, { unique: true });
slotSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Slot", slotSchema);
