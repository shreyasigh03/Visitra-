// Helpers shared by the admin pages.

export const STATUSES = ["pending", "verified", "approved", "rejected"];

// Old records can hold an "entry" for a scan that was refused.
export const isInside = (v) => Boolean(v.entryTime && !v.exitTime && (v.status === "approved" || v.entryGranted));

// Confirmed by OTP, but the host is not a listed teacher, so the admin must answer.
export const needsAdmin = (v) => v.status === "verified" && !v.teacherId;

// The visitor and everyone coming with them.
export const groupSize = (v) => 1 + (v.groupMembers?.length ?? 0);

// Returns "YYYY-MM-DD", or "" when the date is missing or impossible. Newer records
// hold UTC midnight, older ones plain text, including typos such as a 5-digit year.
export function visitDay(v) {
  const day = /^(\d{4}-\d{2}-\d{2})(T|$)/.exec(v.date ?? "")?.[1];
  return day && !Number.isNaN(Date.parse(day)) ? day : "";
}

export function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDay(v) {
  const day = visitDay(v);
  if (!day) return "—";
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const REASONS = ["Meeting", "Interview", "Delivery", "Maintenance", "Visit"];

// Fixes the capitals and the old spelling "Maintenence"; a typed reason stays as written.
export function reasonLabel(reason) {
  const text = (reason ?? "").trim();
  const key = text.toLowerCase() === "maintenence" ? "maintenance" : text.toLowerCase();
  return REASONS.find((r) => r.toLowerCase() === key) ?? (text || "Other");
}

// Typed reasons count as one group in the chart.
export const reasonGroup = (reason) => (REASONS.includes(reasonLabel(reason)) ? reasonLabel(reason) : "Other");

// Where an appointment belongs on the teacher's dashboard.
export function appointmentGroup(v, today = todayLocal()) {
  const day = visitDay(v);
  if (isInside(v)) return "today";
  if (v.status === "rejected" || day < today) return "past";
  if (v.status === "verified") return "waiting";
  if (v.exitTime) return "past";
  return day === today ? "today" : "upcoming";
}

export function appointmentNote(v, today = todayLocal()) {
  const past = visitDay(v) < today;
  if (isInside(v)) return "Inside now";
  if (v.status === "rejected") return "Rejected";
  if (v.status === "verified") return past ? "Not answered" : "Needs your answer";
  if (v.exitTime) return "Completed";
  return past ? "Did not come" : "Approved";
}
