import { API_BASE_URL } from "../config";
import { clearToken, getToken } from "./auth";
import { getOrg } from "./org";

const UNREACHABLE =
  "Could not reach the VISITRA server. Please check that the backend is running and try again.";

async function send(path, method, body, role) {
  const headers = { "X-Org": getOrg().code };
  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";
  if (role) headers.Authorization = `Bearer ${getToken(role)}`;
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body && !isForm ? JSON.stringify(body) : body,
    });
  } catch {
    throw new Error(UNREACHABLE);
  }
}

// A private image as a local URL, or "" if there is none.
export async function fetchImage(path, role) {
  const res = await send(path, "GET", undefined, role);
  return res.ok ? URL.createObjectURL(await res.blob()) : "";
}

// One place for every API call. Resolves with parsed JSON, or throws an Error
// whose message is safe to show to the user. `auth` is true (admin), "teacher" or "guard".
export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const role = auth === true ? "admin" : auth;
  const res = await send(path, method, body, role);
  const data = await res.json().catch(() => null);
  if (res.ok && data !== null) return data;

  if (role && res.status === 401) clearToken(role); // ProtectedRoute sends them to login
  const error = new Error(data?.message || `The server sent an unexpected response (${res.status}).`);
  error.data = data;
  throw error;
}

// Returns a warning to display, or "" when every service is up.
export async function getServiceWarning() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    const { db, faceService, online } = await res.json();
    if (!db) return "The database is not connected, so registrations can't be saved right now.";
    if (!faceService && online) return "The face photo works only on the campus computer for now. Everything else works here.";
    if (!faceService) return "The face recognition service is off or still starting. Please wait a moment.";
    return "";
  } catch {
    return UNREACHABLE;
  }
}
