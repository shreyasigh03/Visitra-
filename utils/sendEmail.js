const nodemailer = require("nodemailer");
const config = require("../config/env");
const HttpError = require("./httpError");

let transporter;

function getTransporter() {
  if (!config.emailUser || !config.emailPass) {
    throw new HttpError(500, "Email is not configured on the server (EMAIL_USER / EMAIL_PASS).");
  }
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.emailUser, pass: config.emailPass },
  });
  return transporter;
}

// Throws on failure so callers can tell the user the email did not go out.
async function sendEmail({ to, subject, html, text }) {
  try {
    await getTransporter().sendMail({ from: `VISITRA <${config.emailUser}>`, to, subject, html, text });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error("[email] send failed:", err.message);
    throw new HttpError(502, "Could not send email. Please check the address and try again.");
  }
}

module.exports = sendEmail;
