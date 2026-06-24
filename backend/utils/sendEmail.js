const nodemailer = require("nodemailer");

const sendEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Your Visitra OTP Code",
      text: `Welcome to Visitra. Your OTP is ${otp}. This OTP is valid for a short time.`,
      html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #4CAF50;">Welcome to Visitra 👋</h2>
    <p>Thanks for visiting. Please use the OTP below to complete your verification:</p>
    <div style="margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">
      ${otp}
    </div>
    <p style="font-size: 12px; color: #777;">
      This OTP is valid for a limited time. Do not share it with anyone.
    </p>
    <hr style="margin: 20px 0;" />
    <p style="font-size: 12px; color: #aaa;">
      If you did not request this, you can safely ignore this email.
    </p>
    <p style="margin-top: 10px;">— Team Visitra</p>
  </div>
`
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email error:", error);
  }
};

module.exports = sendEmail;