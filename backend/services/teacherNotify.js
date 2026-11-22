// Tells a teacher about a visitor: email always, phone notification where allowed.
const webpush = require("web-push");
const config = require("../config/env");
const Teacher = require("../models/Teacher");
const sendEmail = require("../utils/sendEmail");
const { answerLinks } = require("./mailAnswers");
const { teacherRequestEmail } = require("../utils/emailTemplates");

const pushReady = Boolean(config.vapidPublicKey && config.vapidPrivateKey);
if (pushReady) {
  webpush.setVapidDetails(`mailto:${config.emailUser || config.adminEmail}`, config.vapidPublicKey, config.vapidPrivateKey);
}

async function sendPush(teacher, message) {
  if (!pushReady) return;
  const payload = JSON.stringify(message);
  await Promise.all(
    teacher.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 3600, urgency: "high" });
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // The browser dropped this subscription.
          await Teacher.updateOne({ _id: teacher._id }, { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } });
        } else {
          console.error("[push] failed:", err.statusCode || err.message);
        }
      }
    }),
  );
}

async function notifyTeacher(visitor) {
  const teacher = await Teacher.findOne({ _id: visitor.teacherId, active: true }).select("+pushSubscriptions");
  if (!teacher) return;

  const path = `/TeacherDashboard?request=${visitor._id}`;
  const results = await Promise.allSettled([
    sendPush(teacher, { title: "New visitor request", body: `${visitor.name} wants to meet you (${visitor.reason}).`, url: path }),
    sendEmail({ to: teacher.email, ...teacherRequestEmail({ teacher, visitor, answers: answerLinks(visitor), link: config.webUrl + path }) }),
  ]);
  for (const r of results) if (r.status === "rejected") console.error("[notify] teacher:", r.reason.message);
}

module.exports = { notifyTeacher, pushReady };
