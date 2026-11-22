const Blacklist = require("../models/Blacklist");

// Gmail ignores dots and anything after "+", so those must not get around the list.
function emailKey(email) {
  const [local = "", domain = ""] = String(email ?? "").trim().toLowerCase().split("@");
  if (!local || !domain) return "";
  if (domain !== "gmail.com" && domain !== "googlemail.com") return `${local}@${domain}`;
  return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
}

function phoneKey(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

async function findBlacklisted({ email, phone }) {
  const either = [];
  if (emailKey(email)) either.push({ emailKey: emailKey(email) });
  if (phoneKey(phone)) either.push({ phoneKey: phoneKey(phone) });
  return either.length ? Blacklist.findOne({ $or: either }).lean() : null;
}

module.exports = { emailKey, phoneKey, findBlacklisted };
