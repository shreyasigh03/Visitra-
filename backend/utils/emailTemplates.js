// Emails as tables with inline styles: the only layout that looks the same in Gmail,
// Outlook and phone mail apps.
const { niceDay } = require("./dates");

const COLORS = { brand: "#5457d6", ink: "#1b1f36", muted: "#5d6382", page: "#eceef7", soft: "#f6f7fd", ok: "#0f6b43", bad: "#a22a2a" };
const FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function when(visitor) {
  const date = new Date(visitor.date ?? NaN);
  const day = Number.isNaN(date.getTime()) ? "-" : niceDay(date);
  return visitor.visitTime ? `${day}, ${visitor.visitTime}` : day;
}

const oneLine = (text) => String(text).replace(/[\r\n]+/g, " ");

const paragraph = (text) => `<p style="margin:0 0 16px;${FONT}font-size:16px;line-height:1.55;color:${COLORS.ink};">${text}</p>`;

const note = (text) => `<p style="margin:16px 0 0;${FONT}font-size:13px;line-height:1.5;color:${COLORS.muted};">${text}</p>`;

// [["Label", "value"], ...]; empty values are left out.
function details(rows) {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:9px 0;${FONT}font-size:14px;color:${COLORS.muted};width:34%;vertical-align:top;">${label}</td>
          <td style="padding:9px 0;${FONT}font-size:15px;font-weight:600;color:${COLORS.ink};vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${COLORS.soft};border-radius:14px;">
        <tr><td style="padding:8px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr>
      </table>`;
}

// Full width and tall enough for a thumb.
const button = (link, label, color = COLORS.brand) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
        <tr><td align="center" bgcolor="${color}" style="border-radius:14px;">
          <a href="${escapeHtml(link)}" style="display:block;padding:16px 20px;${FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">${label}</a>
        </td></tr>
      </table>`;

const outlineButton = (link, label) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        <tr><td align="center" style="border:2px solid ${COLORS.brand};border-radius:14px;">
          <a href="${escapeHtml(link)}" style="display:block;padding:13px 20px;${FONT}font-size:15px;font-weight:700;color:${COLORS.brand};text-decoration:none;">${label}</a>
        </td></tr>
      </table>`;

// `preview` is the line shown next to the subject in the inbox.
function layout({ preview, title, color = COLORS.brand, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLORS.page}">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td bgcolor="${color}" style="padding:22px 28px;">
          <span style="${FONT}font-size:14px;font-weight:800;letter-spacing:3px;color:#ffffff;">VISITRA</span>
          <h1 style="margin:8px 0 0;${FONT}font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:26px 28px;">${body}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;${FONT}font-size:12px;line-height:1.5;color:${COLORS.muted};">Smart and secure visitor management<br>Sent by VISITRA</p>
    </td></tr>
  </table>
</body>
</html>`;
}

const hello = (name) => paragraph(`Hello <b>${escapeHtml(name)}</b>,`);

function otpEmail({ name, otp, minutes }) {
  return {
    subject: "Your VISITRA verification code",
    text: `Your VISITRA OTP is ${otp}. It is valid for ${minutes} minutes.`,
    html: layout({
      preview: `Your code is ${otp}`,
      title: "Your verification code",
      body: `${hello(name)}${paragraph("Use this code to confirm your visit registration:")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.soft};border-radius:14px;">
        <tr><td align="center" style="padding:22px;${FONT}font-size:38px;font-weight:800;letter-spacing:12px;color:${COLORS.brand};">${escapeHtml(otp)}</td></tr>
      </table>
      ${note(`Valid for ${minutes} minutes. Don't share it with anyone. If you didn't ask for it, you can ignore this email.`)}`,
    }),
  };
}

const visitRows = (visitor) => [
  ["Meeting", visitor.toMeet],
  ["When", when(visitor)],
  ["Pass ID", visitor.passId],
];

function approvedEmail(visitor) {
  return {
    subject: "Your VISITRA visit is approved",
    text: `Your visit to ${visitor.toMeet || "your host"} on ${when(visitor)} is approved. Pass ID: ${visitor.passId}`,
    html: layout({
      preview: `Pass ID ${visitor.passId}`,
      title: "Your visit is approved",
      color: COLORS.ok,
      body: `${hello(visitor.name)}${paragraph("Good news! Your visit request is approved.")}${details(visitRows(visitor))}${note("Please bring a valid ID, and show your pass QR code or look at the camera at the gate. The pass works only on this date.")}`,
    }),
  };
}

function rejectedEmail(visitor, reason) {
  return {
    subject: "Update on your VISITRA visit request",
    text: `Your visit request to ${visitor.toMeet || "your host"} was not approved. ${reason || ""}`.trim(),
    html: layout({
      preview: "Your visit request was not approved",
      title: "Your visit was not approved",
      color: COLORS.bad,
      body: `${hello(visitor.name)}${paragraph("We're sorry, your visit request was not approved.")}${details([
        ["Reason", reason || "Not specified"],
        ["Meeting", visitor.toMeet],
        ["When", when(visitor)],
      ])}${note("You can reply to this email if you have a question.")}`,
    }),
  };
}

function rescheduledEmail(visitor) {
  return {
    subject: "Your VISITRA visit has a new time",
    text: `${visitor.toMeet} can meet you on ${when(visitor)}, and your visit is approved for it. Pass ID: ${visitor.passId}`,
    html: layout({
      preview: `New time: ${when(visitor)}`,
      title: "Your visit has a new time",
      body: `${hello(visitor.name)}${paragraph(`<b>${escapeHtml(visitor.toMeet)}</b> can meet you at a new time, and your visit is approved for it.`)}${details(visitRows(visitor))}${note("If you can't come then, please register again with another date.")}`,
    }),
  };
}

function teacherRequestEmail({ teacher, visitor, answers, link }) {
  const group = visitor.groupMembers ?? [];
  return {
    subject: oneLine(`${visitor.name} wants to meet you`),
    text: `${visitor.name} wants to meet you on ${when(visitor)}. Reason: ${visitor.reason}. Open the teacher dashboard to answer: ${link}`,
    html: layout({
      preview: `${visitor.reason}, ${when(visitor)}`,
      title: "A visitor wants to meet you",
      body: `${hello(teacher.name)}${details([
        ["Visitor", visitor.name],
        ["Reason", visitor.reason],
        ["When", when(visitor)],
        ["Phone", visitor.phone],
        [`Group of ${group.length + 1}`, group.length ? `With ${group.join(", ")}` : ""],
      ])}${paragraph("Tap your answer, then press <b>Send</b> in your mail app:")}
      ${button(answers.approve, "Approve", COLORS.ok)}${button(answers.reject, "Reject", COLORS.bad)}
      <p style="margin:18px 0 10px;${FONT}font-size:14px;font-weight:700;color:${COLORS.muted};">Or offer a new time</p>
      ${answers.times.map((t) => outlineButton(t.link, t.label)).join("")}
      ${note(`For another time, change the date and time in the subject before you press Send. Or use the <a href="${escapeHtml(link)}" style="color:${COLORS.brand};">teacher dashboard</a>. Please don't forward this email: its buttons answer for you.`)}`,
    }),
  };
}

function answerResultEmail({ teacher, ok, text }) {
  return {
    subject: ok ? "VISITRA: your answer is saved" : "VISITRA: your answer was not saved",
    text,
    html: layout({
      preview: text,
      title: ok ? "Your answer is saved" : "Your answer was not saved",
      color: ok ? COLORS.ok : COLORS.bad,
      body: `${hello(teacher.name)}${paragraph(escapeHtml(text))}${note(ok ? "The visitor has been told by email." : "Please open the request email and try again.")}`,
    }),
  };
}

function teacherInviteEmail({ teacher, link, days }) {
  return {
    subject: "Set up your VISITRA teacher account",
    text: `Choose a password for your VISITRA teacher account: ${link}`,
    html: layout({
      preview: "Choose a password to start",
      title: "Welcome to VISITRA",
      body: `${hello(teacher.name)}${paragraph("You can now approve your own visitors. Choose a password to start.")}${button(link, "Choose a password")}${note(`The link works once, for ${days} days. If you did not expect this, ignore this email.`)}`,
    }),
  };
}

module.exports = { otpEmail, approvedEmail, rejectedEmail, rescheduledEmail, teacherRequestEmail, answerResultEmail, teacherInviteEmail };
