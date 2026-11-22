// Set VITE_API_URL in .env (local) or in the hosting dashboard (production).
const configuredUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// The phone demo build is served by the backend itself, so it calls its own address.
const sameOrigin = import.meta.env.VITE_SAME_ORIGIN === "true";

if (import.meta.env.PROD && !configuredUrl && !sameOrigin) {
  console.error("[VISITRA] VITE_API_URL is not set, so this build is trying to reach http://localhost:5001.");
}

export const API_BASE_URL = sameOrigin ? "" : configuredUrl || "http://localhost:5001";
