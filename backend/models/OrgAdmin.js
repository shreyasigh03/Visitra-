const mongoose = require("mongoose");

// Admin of one organization. The first organization's admin is set in backend/.env.
const orgAdminSchema = new mongoose.Schema(
  {
    org: { type: String, required: true, uppercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OrgAdmin", orgAdminSchema);
