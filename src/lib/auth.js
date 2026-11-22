// Sign-ins are separate, so all of them can be used in one browser.
const KEYS = { admin: "visitra-admin-token", teacher: "visitra-teacher-token", guard: "visitra-guard-token", super: "visitra-super-token" };
const AUTH_EVENT = "visitra-auth-change";

export const getToken = (role) => localStorage.getItem(KEYS[role]);

export function setToken(role, token) {
  localStorage.setItem(KEYS[role], token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearToken(role) {
  localStorage.removeItem(KEYS[role]);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Convenience check for the UI only; the server verifies the token on every call.
export function isLoggedIn(role) {
  const token = getToken(role);
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function subscribeToAuth(callback) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback); // login/logout in another tab
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
