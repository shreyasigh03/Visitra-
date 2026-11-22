import { useCallback, useEffect, useState } from "react";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { formatTime } from "../lib/visitors";

const REFRESH_MS = 30_000;

// Visitors who have been inside too long. Shows nothing when there are none.
const Overstays = ({ role, onChange }) => {
  const auth = role === "admin" ? true : role;
  const [list, setList] = useState([]);
  const [notice, setNotice] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await apiFetch("/api/gate/overstays", { auth }));
    } catch {
      // The page itself already shows connection problems.
    }
  }, [auth]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function run(path, text) {
    setBusy(true);
    setConfirming(false);
    try {
      const result = await apiFetch(path, { method: "POST", auth });
      setNotice({ type: "success", text: text(result) });
      onChange?.();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
    await load();
    setBusy(false);
  }

  if (list.length === 0 && !notice) return null;

  return (
    <section className="mb-7 rounded-[26px] p-4 sm:p-6" style={{ background: "var(--warn-bg)", color: "var(--warn-fg)" }}>
      <h2 className="font-display mb-1 text-lg font-extrabold">Overstay alert ({list.length})</h2>
      <p className="mb-3 text-[13px] font-semibold">Inside for too long, or never scanned out.</p>
      {notice && <Notice type={notice.type} className="mb-3">{notice.text}</Notice>}

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <li key={v._id} className="min-w-0 rounded-[16px] p-3" style={{ background: "var(--card)", color: "var(--ink)" }}>
            <p className="break-words font-extrabold">{v.name}</p>
            <p className="mb-2 text-[13px] text-[var(--muted)]">Meeting {v.toMeet || "—"} · in since {formatTime(v.entryTime)}</p>
            <button type="button" disabled={busy} onClick={() => run(`/api/gate/close/${v._id}`, () => `${v.name} is marked as left.`)} className="btn-soft px-4 py-2 text-[13px]">
              Mark as left
            </button>
          </li>
        ))}
      </ul>

      {list.length > 1 && !confirming && (
        <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="btn-soft mt-4 px-4 py-2.5 text-[13px]">
          Mark everyone from earlier days as left
        </button>
      )}
      {confirming && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">Are you sure they have all left?</span>
          <button type="button" onClick={() => run("/api/gate/close-forgotten", (r) => `${r.closed} marked as left.`)} className="btn-danger px-4 py-2.5 text-[13px]">Yes</button>
          <button type="button" onClick={() => setConfirming(false)} className="btn-soft px-4 py-2.5 text-[13px]">No</button>
        </div>
      )}
    </section>
  );
};

export default Overstays;
