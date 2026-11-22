import { useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { formatTime } from "../lib/visitors";

const EMPTY = { name: "", email: "", phone: "", reason: "" };
const API = "/api/admin/blacklist";

const Adminblacklist = () => {
  const [entries, setEntries] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch(API, { auth: true }).then(setEntries, (err) => setNotice({ type: "error", text: err.message }));
  }, []);

  async function run(action) {
    setBusy(true);
    try {
      setNotice({ type: "success", text: await action() });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const entry = await apiFetch(API, { method: "POST", body: form, auth: true });
      setEntries((list) => [entry, ...(list ?? [])]);
      setForm(EMPTY);
      return "Added to the blacklist.";
    });
  };

  const remove = (entry) =>
    run(async () => {
      await apiFetch(`${API}/${entry.id}`, { method: "DELETE", auth: true });
      setEntries((list) => list.filter((x) => x.id !== entry.id));
      return "Removed from the blacklist.";
    });

  const bind = (key) => ({
    "aria-label": key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: "input-clay w-full",
  });

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Blacklist</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">
          These people can't register, and the gate shows a red alert. They are matched by email or phone number.
        </p>

        <form onSubmit={add} className="clay mb-6 grid gap-3 rounded-[26px] p-4 sm:grid-cols-2 sm:p-6">
          <input {...bind("name")} placeholder="Name" />
          <input {...bind("email")} type="email" placeholder="Email" />
          <input {...bind("phone")} type="tel" placeholder="Phone" />
          <input {...bind("reason")} maxLength={200} placeholder="Reason (only admins see this)" />
          <button disabled={busy || (!form.email && !form.phone)} className="btn-danger px-6 py-3 text-sm sm:col-span-2">Add to blacklist</button>
        </form>

        {notice && <Notice type={notice.type} className="mb-5">{notice.text}</Notice>}
        {!entries?.length && <Notice className="text-center">{entries ? "Nobody is on the blacklist." : "Loading…"}</Notice>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {entries?.map((b) => (
            <li key={b.id} className="clay-sm min-w-0 rounded-[22px] p-4">
              <p className="break-words font-extrabold">{b.name || "No name"}</p>
              <p className="break-all text-[13px] text-[var(--muted)]">{[b.email, b.phone].filter(Boolean).join(" · ")}</p>
              {b.reason && <p className="break-words text-[13px]">{b.reason}</p>}
              <p className="mb-3 text-[13px] text-[var(--muted)]">Added {formatTime(b.createdAt)}</p>
              <button type="button" disabled={busy} onClick={() => remove(b)} className="btn-soft px-4 py-2.5 text-[13px]">Remove</button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default Adminblacklist;
