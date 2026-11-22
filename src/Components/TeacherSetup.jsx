import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";

const TeacherSetup = () => {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== again) {
      setError("The two passwords are not the same.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const inviteToken = window.location.hash.slice(1);
      const { token } = await apiFetch("/api/teacher/setup", { method: "POST", body: { token: inviteToken, password } });
      setToken("teacher", token);
      navigate("/TeacherDashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-10 sm:py-16">
        <form className="clay w-full max-w-[440px] rounded-[28px] p-6 sm:p-10" onSubmit={handleSubmit}>
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">Choose a password</h1>
          <p className="mb-7 text-[14.5px] text-[var(--muted)]">Use at least 8 characters. You'll stay signed in on this device.</p>

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-clay mb-5 w-full" required />

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="again">Type it again</label>
          <input id="again" type="password" autoComplete="new-password" minLength={8} value={again} onChange={(e) => setAgain(e.target.value)} className="input-clay mb-5 w-full" required />

          {error && <Notice type="error" className="mb-4">{error}</Notice>}
          <button disabled={busy} className="btn-primary w-full py-3.5 text-[15px]">{busy ? "Saving…" : "Save and continue"}</button>
        </form>
      </main>
    </div>
  );
};

export default TeacherSetup;
