import { formatTime, groupSize, reasonLabel, todayLocal, visitDay } from "./visitors";

const COLUMNS = [
  ["Pass ID", (v) => v.passId],
  ["Name", (v) => v.name],
  ["Email", (v) => v.email],
  ["Phone", (v) => v.phone],
  ["Reason", (v) => reasonLabel(v.reason)],
  ["Host", (v) => v.toMeet],
  ["People", groupSize],
  ["Group members", (v) => (v.groupMembers ?? []).join(", ")],
  ["Date", visitDay],
  ["Status", (v) => v.status],
  ["Entry", (v) => (v.entryTime ? formatTime(v.entryTime) : "")],
  ["Exit", (v) => (v.exitTime ? formatTime(v.exitTime) : "")],
];

function cell(value) {
  let text = String(value ?? "");
  // Visitors type these values; a leading = + - @ would run as a formula in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(visitors) {
  const rows = [COLUMNS.map(([title]) => title), ...visitors.map((v) => COLUMNS.map(([, get]) => get(v)))];
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(visitors) {
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(["﻿", toCsv(visitors)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `visitra-visitors-${todayLocal()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
