const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const blacklistSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    reason: { type: String, trim: true, default: "" },
    // Cleaned-up forms used for matching.
    emailKey: { type: String, index: true, default: "" },
    phoneKey: { type: String, index: true, default: "" },
  },
  { timestamps: true },
);

blacklistSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Blacklist", blacklistSchema);
