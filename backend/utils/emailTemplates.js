const LOGO_URL = "https://github.com/vanshika-0/visitor-management/raw/main/visitra_logo.png";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "-";

const formatWhen = (visitor) => `${formatDate(visitor.date)}${visitor.visitTime ? `, ${escapeHtml(visitor.visitTime)}` : ""}`;

const button = (link, label, color = "#5457d6") =>
  `<a href="${escapeHtml(link)}" style="display: inline-block; margin: 0 8px 10px 0; background: ${color}; color: #fff; padding: 14px 22px; border-radius: 12px; text-decoration: none; font-weight: bold;">${label}</a>`;

const layout = (body) => `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #1b1f36; max-width: 520px;">
  <img src="${LOGO_URL}" alt="VISITRA" style="height: 44px; margin-bottom: 12px;" />
  ${body}
  <p style="margin-top: 24px;"><b>VISITRA Team</b></p>
</div>`;

function otpEmail({ name, otp, minutes }) {
  return {
    subject: "Your VISITRA verification code",
    text: `Your VISITRA OTP is ${otp}. It is valid for ${minutes} minutes.`,
    html: layout(`
  <h3>Hello ${escapeHtml(name)}</h3>
  <p>Use this code to verify your visit registration:</p>
  <div style="margin: 18px 0; font-size: 28px; font-weight: bold; letter-spacing: 6px;">${escapeHtml(otp)}</div>
  <p style="font-size: 12px; color: #777;">Valid for ${minutes} minutes. Do not share it with anyone.
  If you did not request this, you can ignore this email.</p>`),
  };
}

function approvedEmail(visitor) {
  return {
    subject: "Your VISITRA visit is approved",
    html: layout(`
  <h3>Hello ${escapeHtml(visitor.name)}</h3>
  <p>Your visit request has been <b>APPROVED</b>.</p>
  <p><b>Host:</b> ${escapeHtml(visitor.toMeet || "-")}<br/>
     <b>Date:</b> ${formatWhen(visitor)}<br/>
     <b>Pass ID:</b> ${escapeHtml(visitor.passId)}</p>
  <p>Please carry a valid ID during your visit.</p>`),
  };
}

function rejectedEmail(visitor, reason) {
  return {
    subject: "Update on your VISITRA visit request",
    html: layout(`
  <h3>Hello ${escapeHtml(visitor.name)}</h3>
  <p>Your visit request has been <b>REJECTED</b>.</p>
  <p><b>Reason:</b> ${escapeHtml(reason || "Not specified")}</p>
  <p><b>Host:</b> ${escapeHtml(visitor.toMeet || "-")}<br/>
     <b>Date:</b> ${formatDate(visitor.date)}</p>
  <p>For any queries, reply to this email.</p>`),
  };
}

function rescheduledEmail(visitor) {
  return {
    subject: "Your VISITRA visit has a new time",
    html: layout(`
  <h3>Hello ${escapeHtml(visitor.name)}</h3>
  <p><b>${escapeHtml(visitor.toMeet)}</b> can meet you at a new time, and your visit is approved for it.</p>
  <p><b>New time:</b> ${formatWhen(visitor)}<br/>
     <b>Pass ID:</b> ${escapeHtml(visitor.passId)}</p>
  <p>If you can't come then, please register again with another date.</p>`),
  };
}

function teacherRequestEmail({ teacher, visitor, answers, link }) {
  return {
    subject: `${visitor.name} wants to meet you`.replace(/[\r\n]+/g, " "),
    html: layout(`
  <h3>Hello ${escapeHtml(teacher.name)}</h3>
  <p><b>${escapeHtml(visitor.name)}</b> has registered to meet you.</p>
  <p><b>Reason:</b> ${escapeHtml(visitor.reason)}<br/>
     <b>Date:</b> ${formatWhen(visitor)}<br/>
     <b>Phone:</b> ${escapeHtml(visitor.phone)}${visitor.groupMembers?.length ? `<br/>
     <b>Group of ${visitor.groupMembers.length + 1}, with:</b> ${escapeHtml(visitor.groupMembers.join(", "))}` : ""}</p>
  <p>Tap a button, then press <b>Send</b>:</p>
  <p>${button(answers.approve, "Approve", "#0f6b43")}${button(answers.reject, "Reject", "#a22a2a")}</p>
  <p><b>Reschedule:</b></p>
  <p>${answers.times.map((t) => button(t.link, t.label)).join("")}</p>
  <p style="font-size: 12px; color: #777;">For another time, change the date and time in the subject before you press Send.
  Or use the <a href="${escapeHtml(link)}">teacher dashboard</a>.</p>`),
  };
}

function answerResultEmail({ teacher, ok, text }) {
  return {
    subject: ok ? "VISITRA: your answer is saved" : "VISITRA: your answer was not saved",
    html: layout(`
  <h3>Hello ${escapeHtml(teacher.name)}</h3>
  <p>${escapeHtml(text)}</p>
  ${ok ? "<p>The visitor has been told by email.</p>" : "<p>Please open the request email and try again.</p>"}`),
  };
}

function teacherInviteEmail({ teacher, link, days }) {
  return {
    subject: "Set up your VISITRA teacher account",
    html: layout(`
  <h3>Hello ${escapeHtml(teacher.name)}</h3>
  <p>You can now approve your own visitors in VISITRA. Choose a password to start.</p>
  <p>${button(link, "Choose a password")}</p>
  <p style="font-size: 12px; color: #777;">The link works once, for ${days} days. If you did not expect this, ignore this email.</p>`),
  };
}

module.exports = { otpEmail, approvedEmail, rejectedEmail, rescheduledEmail, teacherRequestEmail, answerResultEmail, teacherInviteEmail };
