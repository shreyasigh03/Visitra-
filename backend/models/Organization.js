const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["university", "office"], default: "university" },
    // Others are listed as "coming soon" and cannot be used yet.
    active: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Organization", organizationSchema);
