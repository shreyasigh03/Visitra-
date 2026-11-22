// Keeps organizations apart. Every request runs inside one organization, and the plugin
// below adds that organization to each database query, so no route can forget it.
const { AsyncLocalStorage } = require("node:async_hooks");

// Records made before organizations existed have no `org` and belong to this one.
const HOME_ORG = "SRMUH";

const storage = new AsyncLocalStorage();

const currentOrg = () => storage.getStore()?.org ?? null;

const runInOrg = (org, fn) => storage.run({ org }, fn);

// For work that spans organizations, such as finding who is logging in.
const runAsSystem = (fn) => storage.run({ org: null }, fn);

// Used after a login token has been checked: the token decides, not the browser.
function setOrg(org) {
  const store = storage.getStore();
  if (!store) throw new Error("No organization context");
  store.org = org;
}

const orgFilter = (org) => (org === HOME_ORG ? { $in: [HOME_ORG, null] } : org);

const QUERIES = [
  "countDocuments", "deleteMany", "deleteOne", "distinct", "find", "findOne",
  "findOneAndDelete", "findOneAndReplace", "findOneAndUpdate", "replaceOne", "updateMany", "updateOne",
];

function tenantPlugin(schema) {
  schema.add({ org: { type: String, index: true } });

  schema.pre(QUERIES, function () {
    const org = currentOrg();
    // `$and` so that a filter in the route can never replace this one.
    if (org) this.and([{ org: orgFilter(org) }]);
  });
  schema.pre("validate", function () {
    if (this.isNew) this.org = currentOrg() ?? this.org ?? HOME_ORG;
  });
  schema.pre("aggregate", function () {
    const org = currentOrg();
    if (org) this.pipeline().unshift({ $match: { org: orgFilter(org) } });
  });
}

module.exports = { HOME_ORG, currentOrg, runAsSystem, runInOrg, setOrg, tenantPlugin };
