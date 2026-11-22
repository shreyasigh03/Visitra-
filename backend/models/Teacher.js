const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required."], trim: true },
    email: { type: String, required: [true, "Email is required."], trim: true, lowercase: true, unique: true },
    department: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
    passwordHash: { type: String, select: false },
    // One-time link for choosing a password.
    inviteHash: { type: String, select: false },
    inviteExpires: { type: Date, select: false },
    // Increased to sign the teacher out everywhere.
    tokenVersion: { type: Number, default: 0 },
    pushSubscriptions: { type: [mongoose.Schema.Types.Mixed], default: [], select: false },
  },
  { timestamps: true },
);

teacherSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Teacher", teacherSchema);
