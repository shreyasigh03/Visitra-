const pad = (n) => String(n).padStart(2, "0");

// A date as "YYYY-MM-DD" on this computer's clock.
const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function dayFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDay(d);
}

const todayLocal = () => dayFromToday(0);

// "2026-11-24" as "24 Nov 2026".
const niceDay = (day) =>
  new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

module.exports = { niceDay, todayLocal, dayFromToday, localDay };
