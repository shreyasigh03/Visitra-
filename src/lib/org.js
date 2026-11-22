// The organization chosen on this device. Logins carry their own, checked by the server.
const KEY = "visitra-org";
const HOME = { code: "SRMUH", name: "SRM University Haryana" };

export function getOrg() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || HOME;
  } catch {
    return HOME;
  }
}

export const saveOrg = ({ code, name }) => localStorage.setItem(KEY, JSON.stringify({ code, name }));
