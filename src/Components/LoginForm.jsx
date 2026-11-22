import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { isLoggedIn, setToken } from "../lib/auth";

const LoginForm = ({ role, home, title, intro, footer, api = role, userKey = "email", userLabel = "Email" }) => {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const location = useLocation();

  // Back to the page that asked for the login, e.g. a request opened from an email.
  if (isLoggedIn(role)) return <Navigate to={location.state?.from || home} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await apiFetch(`/api/${api}/login`, { method: "POST", body: { [userKey]: user, password } });
      setToken(role, token);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-10 sm:py-16">
        <form className="clay w-full max-w-[440px] rounded-[28px] p-6 sm:p-10" style={{ animation: "fadeUp .5s ease both" }} onSubmit={handleSubmit}>
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">{title}</h1>
          <p className="mb-7 text-[14.5px] text-[var(--muted)]">{intro}</p>

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="user">{userLabel}</label>
          <input id="user" type={userKey === "email" ? "email" : "text"} autoComplete="username" autoCapitalize="none" placeholder={`Enter your ${userLabel.toLowerCase()}`} value={user} onChange={(e) => setUser(e.target.value)} className="input-clay mb-5 w-full" required />

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-clay mb-5 w-full" required />

          {error && <Notice type="error" className="mb-4">{error}</Notice>}
          <button disabled={busy} className="btn-primary w-full py-3.5 text-[15px]">{busy ? "Signing in…" : "Sign in"}</button>
          <p className="mt-4 text-center text-[12.5px] text-[var(--muted)]">{footer}</p>
        </form>
      </main>
    </div>
  );
};

export default LoginForm;
