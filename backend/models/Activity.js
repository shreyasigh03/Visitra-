const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const activitySchema = new mongoose.Schema({
  at: { type: Date, default: Date.now, index: true },
  actor: { type: String, required: true }, // e.g. "Admin", "Teacher Dr. Rao", "Gate"
  type: { type: String, required: true, index: true },
  visitorId: { type: mongoose.Schema.Types.ObjectId, index: true },
  subject: { type: String, default: "" }, // whom it is about
  details: { type: String, default: "" },
});

activitySchema.plugin(tenantPlugin);

module.exports = mongoose.model("Activity", activitySchema);
