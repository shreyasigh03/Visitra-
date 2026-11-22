// Lets a teacher answer from any phone by email, without a public website: the request
// email has buttons that prepare a reply, and VISITRA reads those replies from its Gmail.
const crypto = require("crypto");
const config = require("../config/env");
const { isDbConnected } = require("../config/db");
const MailState = require("../models/MailState");
const Teacher = require("../models/Teacher");
const Visitor = require("../models/Visitor");
const { HOME_ORG, runAsSystem, runInOrg } = require("./tenant");
const ImapClient = require("../utils/imap");
const sendEmail = require("../utils/sendEmail");
const { answerResultEmail } = require("../utils/emailTemplates");
const { dayFromToday } = require("../utils/dates");
const { approve, reject, reschedule } = require("./decisions");
const HttpError = require("../utils/httpError");

const POLL_MS = 5_000;
const RETRY_MS = 20_000;
const MAILBOXES = ["INBOX", "[Gmail]/Spam"]; // a first reply sometimes lands in Spam
const ANSWER_RE = /\b(APPROVE|REJECT|RESCHEDULE)\b(.*)\bVISITRA-([0-9a-f]{24})-([0-9a-f]{20})\b/i;
const WHEN_RE = /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/;

// Only the teacher's own email contains this code, so it proves who is answering.
const sign = (visitorId, teacherId) =>
  crypto.createHmac("sha256", config.jwtSecret).update(`mail-answer:${visitorId}:${teacherId}`).digest("hex").slice(0, 20);

function answerLinks(visitor) {
  const code = `VISITRA-${visitor._id}-${sign(visitor._id, visitor.teacherId)}`;
  const link = (subject) =>
    `mailto:${config.emailUser}?subject=${encodeURIComponent(`${subject} ${code}`)}&body=${encodeURIComponent("Press Send to confirm. Do not change the code in the subject.")}`;
  const tomorrow = dayFromToday(1);
  return {
    approve: link("APPROVE"),
    reject: link("REJECT"),
    times: [
      { label: "Tomorrow 10:00", link: link(`RESCHEDULE ${tomorrow} 10:00`) },
      { label: "Tomorrow 15:00", link: link(`RESCHEDULE ${tomorrow} 15:00`) },
      { label: "Another time", link: link(`RESCHEDULE ${dayFromToday(2)} 11:00`) },
    ],
  };
}

async function applyAnswer(subject) {
  const match = ANSWER_RE.exec(subject);
  if (!match) return;
  const [, word, middle, visitorId, signature] = match;

  const visitor = await runAsSystem(async () => Visitor.findById(visitorId).select("name teacherId org").lean());
  if (!visitor?.teacherId) return;
  await runInOrg(visitor.org ?? HOME_ORG, () => useAnswer(visitor, { word, middle, visitorId, signature }));
}

async function useAnswer(visitor, { word, middle, visitorId, signature }) {
  const expected = sign(visitorId.toLowerCase(), visitor.teacherId);
  if (!crypto.timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(expected))) return;
  const teacher = await Teacher.findOne({ _id: visitor.teacherId, active: true });
  if (!teacher) return;

  let result;
  try {
    const action = word.toUpperCase();
    if (action === "APPROVE") {
      await approve(teacher, visitorId, "by email");
      result = { ok: true, text: `${visitor.name} is approved.` };
    } else if (action === "REJECT") {
      await reject(teacher, visitorId, "", "by email");
      result = { ok: true, text: `${visitor.name} is rejected.` };
    } else {
      const [, date, time] = WHEN_RE.exec(middle) ?? [];
      if (!date) throw new HttpError(400, "Write the new time like this: 2026-11-24 15:30.");
      await reschedule(teacher, visitorId, date, time.padStart(5, "0"), "by email");
      result = { ok: true, text: `${visitor.name} is moved to ${date}, ${time}.` };
    }
  } catch (err) {
    if (!err.status) throw err;
    result = { ok: false, text: `${visitor.name}: ${err.message}` };
  }
  console.log(`[mail] ${word.toUpperCase()} answer ${result.ok ? "saved" : "not saved"}`);
  await sendEmail({ to: teacher.email, ...answerResultEmail({ teacher, ...result }) }).catch((err) =>
    console.error("[mail] confirmation failed:", err.message),
  );
}

async function readMailbox(client, name) {
  const { uidValidity, uidNext } = await client.examine(name);
  if (!uidValidity || !uidNext) return;
  const mailbox = `${config.emailUser}:${name}`;

  const state = await MailState.findOne({ mailbox, uidValidity }).lean();
  if (!state) {
    // First time: start from now and leave older emails alone.
    await MailState.updateOne({ mailbox }, { uidValidity, lastUid: uidNext - 1 }, { upsert: true });
    return;
  }
  if (uidNext <= state.lastUid + 1) return;

  for (const { uid, subject } of await client.subjectsFrom(state.lastUid + 1)) {
    // Claimed before use, so two running backends cannot both act on one answer.
    const claimed = await MailState.updateOne({ mailbox, uidValidity, lastUid: { $lt: uid } }, { lastUid: uid });
    if (!claimed.modifiedCount) continue;
    await applyAnswer(subject).catch((err) => console.error("[mail] answer failed:", err.message));
  }
}

let lastProblem = "";

async function watch() {
  const client = new ImapClient({
    host: "imap.gmail.com",
    port: 993,
    user: config.emailUser,
    password: config.emailPass.replace(/\s/g, ""),
  });
  try {
    await client.connect();
    console.log("[mail] Reading teacher answers from Gmail");
    lastProblem = "";
    const missing = new Set();
    for (;;) {
      if (isDbConnected()) {
        for (const name of MAILBOXES) {
          if (missing.has(name)) continue;
          await readMailbox(client, name).catch((err) => {
            if (client.error || name === "INBOX") throw err;
            missing.add(name); // Spam has another name in some accounts
          });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  } catch (err) {
    if (err.message !== lastProblem) console.error(`[mail] Cannot read answers: ${err.message}. Trying again.`);
    lastProblem = err.message;
  } finally {
    client.close();
  }
  setTimeout(watch, RETRY_MS);
}

function startMailAnswers() {
  if (config.emailUser && config.emailPass) watch();
}

module.exports = { answerLinks, startMailAnswers };
