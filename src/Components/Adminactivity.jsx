import { useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";

const REFRESH_MS = 20_000;

const LABELS = {
  registered: "Registered",
  verified: "Email verified",
  approved: "Approved",
  rejected: "Rejected",
  rescheduled: "Rescheduled",
  entry: "Entered",
  exit: "Left",
  "exit-closed": "Marked as left",
  denied: "Entry refused",
  "blacklist-alert": "Blacklist alert",
  blacklist: "Blacklist",
  teacher: "Teacher account",
  guard: "Guard account",
  login: "Signed in",
  "login-failed": "Wrong password",
  cleanup: "Clean-up",
};

const FILTERS = [
  ["", "Everything"],
  ["approved,rejected,rescheduled", "Approvals"],
  ["entry,exit,exit-closed", "Entry and exit"],
  ["denied,blacklist-alert,login-failed", "Alerts"],
  ["registered,verified", "Registrations"],
  ["teacher,guard,blacklist,login,cleanup", "Admin and accounts"],
];

const ALERTS = new Set(["denied", "blacklist-alert", "login-failed"]);

const when = (at) =>
  new Date(at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Adminactivity = () => {
  const [query, setQuery] = useState({ type: "", search: "", page: 1 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiFetch(`/api/admin/activity?${new URLSearchParams(query)}`, { auth: true });
        if (!active) return;
        setResult(data);
        setError("");
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    const first = setTimeout(load, 250);
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [query]);

  const change = (key) => (e) => setQuery((q) => ({ ...q, [key]: e.target.value, page: 1 }));
  const go = (step) => () => setQuery((q) => ({ ...q, page: q.page + step }));

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Activity history</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">Who did what, and when. Nobody can edit this list here.</p>

        <div className="mb-5 grid gap-3 sm:flex">
          <input type="search" aria-label="Search" placeholder="Search a name…" value={query.search} onChange={change("search")} className="input-clay w-full sm:w-72" />
          <select aria-label="Show" value={query.type} onChange={change("type")} className="input-clay w-full sm:w-auto">
            {FILTERS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {error && <Notice type="error" className="mb-4">{error}</Notice>}
        {!result?.rows.length && !error && <Notice className="text-center">{result ? "Nothing here yet." : "Loading…"}</Notice>}

        <ul className="grid gap-2.5">
          {result?.rows.map((a) => (
            <li key={a._id} className="clay-sm flex min-w-0 flex-col gap-1 rounded-[18px] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 text-[13px] text-[var(--muted)] sm:w-44">{when(a.at)}</span>
              <span className="shrink-0 text-sm font-extrabold sm:w-36" style={ALERTS.has(a.type) ? { color: "var(--bad-fg)" } : undefined}>
                {LABELS[a.type] ?? a.type}
              </span>
              <span className="min-w-0 break-words text-sm">
                {a.subject && <b>{a.subject}</b>}
                {a.details && <span className="text-[var(--muted)]"> {a.details}</span>}
                <span className="text-[13px] text-[var(--muted)]"> · by {a.actor}</span>
              </span>
            </li>
          ))}
        </ul>

        {result?.pages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button type="button" disabled={query.page <= 1} onClick={go(-1)} className="btn-soft px-4 py-2.5 text-[13px]">Newer</button>
            <span className="text-sm font-extrabold">Page {query.page} of {result.pages}</span>
            <button type="button" disabled={query.page >= result.pages} onClick={go(1)} className="btn-soft px-4 py-2.5 text-[13px]">Older</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Adminactivity;
