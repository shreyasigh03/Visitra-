const pad = (n) => String(n).padStart(2, "0");

// A date as "YYYY-MM-DD" on this computer's clock.
const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function dayFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDay(d);
}

const todayLocal = () => dayFromToday(0);

module.exports = { todayLocal, dayFromToday, localDay };
