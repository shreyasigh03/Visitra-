const Organization = require("../models/Organization");
const { HOME_ORG, runInOrg } = require("./tenant");
const HttpError = require("../utils/httpError");

const STARTING = [
  { code: HOME_ORG, name: "SRM University Haryana", type: "university", active: true },
  { code: "COGNITIVE", name: "Cognitive Office", type: "office", active: false },
  { code: "DEMOUNI", name: "Demo University", type: "university", active: false },
];

// Adds the starting list once; later changes are kept.
async function seedOrganizations() {
  for (const { code, ...rest } of STARTING) {
    await Organization.updateOne({ code }, { $setOnInsert: rest }, { upsert: true });
  }
}

async function requireActiveOrg(code) {
  const org = await Organization.findOne({ code: String(code).toUpperCase(), active: true }).lean();
  if (!org) throw new HttpError(403, "This organization is not available yet.");
  return org;
}

// For background work: the same job, once inside each organization.
async function forEachOrg(job) {
  for (const { code } of await Organization.find().lean()) await runInOrg(code, async () => job());
}

module.exports = { forEachOrg, seedOrganizations, requireActiveOrg };
