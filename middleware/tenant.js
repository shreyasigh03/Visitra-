const { HOME_ORG, runInOrg } = require("../services/tenant");
const { requireActiveOrg } = require("../services/organizations");

// Public pages say which organization they are for. Logged-in requests are switched to
// the organization in their token by middleware/auth.js.
async function chooseOrg(req, res, next) {
  const code = (req.get("x-org") || HOME_ORG).toUpperCase();
  if (code !== HOME_ORG) await requireActiveOrg(code);
  runInOrg(code, next);
}

module.exports = { chooseOrg };
