const Activity = require("../models/Activity");

// Never blocks or breaks the action it describes.
function logActivity({ actor, type, visitor, subject, details }) {
  Activity.create({
    actor,
    type,
    visitorId: visitor?._id,
    subject: subject ?? visitor?.name ?? "",
    details: String(details ?? "").slice(0, 300),
  }).catch((err) => console.error("[activity] not saved:", err.message));
}

module.exports = { logActivity };
