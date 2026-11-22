const crypto = require("crypto");
const config = require("../config/env");
const Teacher = require("../models/Teacher");
const sendEmail = require("../utils/sendEmail");
const { teacherInviteEmail } = require("../utils/emailTemplates");

const INVITE_DAYS = 7;

const hashInvite = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Emails a link for choosing a password. Any earlier link stops working.
async function sendInvite(teacher) {
  const token = crypto.randomBytes(32).toString("hex");
  await Teacher.updateOne(
    { _id: teacher._id },
    { inviteHash: hashInvite(token), inviteExpires: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000) },
  );
  // After the # so the secret never reaches a server log.
  const link = `${config.webUrl}/TeacherSetup#${token}`;
  await sendEmail({ to: teacher.email, ...teacherInviteEmail({ teacher, link, days: INVITE_DAYS }) });
}

module.exports = { sendInvite, hashInvite };
