const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const otpSchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    // MongoDB deletes the document automatically once this time passes.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

otpSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Otp", otpSchema);
