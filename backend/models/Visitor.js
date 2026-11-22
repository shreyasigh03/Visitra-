const mongoose = require("mongoose");
const { tenantPlugin } = require("../services/tenant");

const STATUSES = ["pending", "verified", "approved", "rejected"];

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required."], trim: true },
    email: { type: String, required: [true, "Email is required."], trim: true, lowercase: true },
    phone: { type: String, required: [true, "Phone number is required."], trim: true },
    reason: { type: String, required: [true, "Reason is required."], trim: true },
    toMeet: { type: String, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", index: true },
    date: Date,
    visitTime: String, // "HH:mm", from a booked slot or a reschedule
    groupMembers: { type: [String], default: [] }, // people coming with this visitor
    answeredAt: Date, // when the teacher or admin last approved, rejected or rescheduled
    rescheduled: Boolean,
    clearedByTeacher: Boolean, // hidden from the teacher's list; the record stays
    passId: { type: String, required: true, index: true },
    // pending -> verified (OTP done) -> approved / rejected (admin)
    status: { type: String, enum: STATUSES, default: "pending" },
    entryTime: { type: Date, default: null },
    exitTime: { type: Date, default: null },
    entryGranted: Boolean, // the gate let them in (old records also hold refused scans)
    exitClosedBy: String, // set when someone marked them as left without a scan
    photo: String, // path of the registration photo on disk; removed with the face data
    faceEncoding: { type: [Number], default: [], select: false },
    faceDeletedAt: Date,
  },
  { timestamps: true },
);

visitorSchema.plugin(tenantPlugin);

const Visitor = mongoose.model("Visitor", visitorSchema);
Visitor.STATUSES = STATUSES;

module.exports = Visitor;
