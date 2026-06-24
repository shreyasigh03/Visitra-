// Reads VITE_API_URL from environment (set in .env locally, or in your
// hosting platform's dashboard for production). Falls back to localhost
// for local development.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";