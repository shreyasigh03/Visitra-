// The registration in progress. Kept per tab so refreshing the OTP page works.
const KEY = "visitra-registration";

export const saveRegistration = (data) => sessionStorage.setItem(KEY, JSON.stringify(data));

export function loadRegistration() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
