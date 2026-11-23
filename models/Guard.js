const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const guardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    active: { type: Boolean, default: true },
    passwordHash: { type: String, select: false },
    // Increased to sign the guard out everywhere.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

guardSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Guard", guardSchema);
