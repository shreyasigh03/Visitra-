// Excel files of past visitors: one file per visit year.
const fs = require("fs/promises");
const path = require("path");
const ExcelJS = require("exceljs");
const config = require("../config/env");
const { HOME_ORG, currentOrg } = require("./tenant");
const HttpError = require("../utils/httpError");

const DEFAULT_DIR = path.resolve(__dirname, "..", "archive");
const FILE_RE = /^visitra-visitors-(\d{4})\.xlsx$/;
const SEARCH_LIMIT = 200;

const pad = (n) => String(n).padStart(2, "0");
const day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateTime = (d) => (d instanceof Date ? `${day(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "");
// Visit dates are UTC midnight, or plain text in the oldest records.
const visitDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);

const COLUMNS = [
  { key: "passId", header: "Pass ID", width: 12, get: (v) => v.passId },
  { key: "name", header: "Name", width: 24, get: (v) => v.name },
  { key: "email", header: "Email", width: 30, get: (v) => v.email },
  { key: "phone", header: "Phone", width: 16, get: (v) => v.phone },
  { key: "reason", header: "Reason", width: 14, get: (v) => v.reason },
  { key: "toMeet", header: "Host", width: 22, get: (v) => v.toMeet },
  { key: "group", header: "Group members", width: 30, get: (v) => (v.groupMembers ?? []).join(", ") },
  { key: "date", header: "Visit date", width: 13, get: (v) => visitDate(v.date) },
  { key: "status", header: "Status", width: 11, get: (v) => v.status },
  { key: "entryTime", header: "Entry", width: 18, get: (v) => dateTime(v.entryTime) },
  { key: "exitTime", header: "Exit", width: 18, get: (v) => dateTime(v.exitTime) },
  { key: "createdAt", header: "Registered", width: 18, get: (v) => dateTime(v.createdAt) },
  { key: "id", header: "Record ID", width: 27, get: (v) => v._id },
];

const toRow = (visitor) => Object.fromEntries(COLUMNS.map(({ key, get }) => [key, String(get(visitor) ?? "")]));

const exists = (p) => fs.access(p).then(() => true, () => false);

function baseDir() {
  return config.archiveDir ? path.resolve(config.archiveDir) : DEFAULT_DIR;
}

// Every other organization has its own folder inside the main one.
function archiveDir() {
  const org = currentOrg() ?? HOME_ORG;
  return org === HOME_ORG ? baseDir() : path.join(baseDir(), org);
}

// A missing custom folder usually means Google Drive is not running, so never create it.
async function requireDir() {
  const base = baseDir();
  if (!config.archiveDir) await fs.mkdir(base, { recursive: true });
  if (!(await exists(base))) {
    throw new HttpError(503, `The Excel folder was not found: ${base}. Open Google Drive on this computer and try again.`);
  }
  const dir = archiveDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function readFile(file) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(file);
  const sheet = book.worksheets[0];
  const columnOf = {};
  sheet.getRow(1).eachCell((cell, i) => (columnOf[cell.text] = i));
  if (!columnOf["Record ID"]) throw new HttpError(500, `${path.basename(file)} is missing its "Record ID" column.`);

  const rows = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    rows.push(Object.fromEntries(COLUMNS.map(({ key, header }) => [key, columnOf[header] ? row.getCell(columnOf[header]).text : ""])));
  });
  return rows;
}

async function writeFile(file, rows) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Visitors", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = COLUMNS.map(({ key, header, width }) => ({ key, header, width }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(rows);
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const temp = `${file}.tmp`;
  await fs.writeFile(temp, await book.xlsx.writeBuffer());
  await fs.rename(temp, file);
}

const sameRow = (a, b) => COLUMNS.every(({ key }) => a[key] === b[key]);

// Adds the visitors to that year's file, then reads the file back. Throws unless
// every visitor is really in it, so callers may delete only after this returns.
async function archiveVisitors(year, visitors) {
  const dir = await requireDir();
  const name = `visitra-visitors-${year}.xlsx`;
  const file = path.join(dir, name);

  if ((await exists(path.join(dir, `~$${name}`))) || (await exists(path.join(dir, `.~lock.${name}#`)))) {
    throw new HttpError(409, `${name} is open in Excel. Close it and try again.`);
  }

  const before = (await exists(file)) ? await readFile(file) : [];
  const added = visitors.map(toRow);
  const addedIds = new Set(added.map((r) => r.id));
  // A retry after a failed delete replaces the earlier copy instead of repeating it.
  const expected = [...before.filter((r) => !addedIds.has(r.id)), ...added];
  await writeFile(file, expected);

  const saved = await readFile(file);
  const complete = saved.length === expected.length && expected.every((row, i) => sameRow(row, saved[i]));
  if (!complete) throw new HttpError(500, `${name} did not save correctly, so nothing was deleted.`);
  return name;
}

async function searchArchive({ search, year }) {
  const dir = archiveDir();
  const files = (await exists(dir)) ? (await fs.readdir(dir)).filter((f) => FILE_RE.test(f)).sort().reverse() : [];
  const years = files.map((f) => FILE_RE.exec(f)[1]);
  const query = search.trim().toLowerCase();

  const matches = [];
  for (const [i, file] of files.entries()) {
    if (year && years[i] !== year) continue;
    for (const { id, ...row } of await readFile(path.join(dir, file))) {
      if (!query || Object.values(row).some((value) => value.toLowerCase().includes(query))) matches.push({ _id: id, ...row });
    }
  }
  matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { folder: dir, years, total: matches.length, visitors: matches.slice(0, SEARCH_LIMIT) };
}

module.exports = { archiveDir, archiveVisitors, requireDir, searchArchive };
