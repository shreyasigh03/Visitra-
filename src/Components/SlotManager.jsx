import { useEffect, useState } from "react";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { formatDay, todayLocal } from "../lib/visitors";

const LENGTHS = [15, 20, 30, 45, 60];

// Used by the teacher for their own times, and by the admin for any teacher.
const SlotManager = ({ api, auth }) => {
  const [slots, setSlots] = useState(null);
  const [form, setForm] = useState({ date: todayLocal(), from: "10:00", to: "12:00", length: 30 });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch(api, { auth }).then(
      (list) => active && setSlots(list),
      (err) => active && setNotice({ type: "error", text: err.message }),
    );
    return () => {
      active = false;
    };
  }, [api, auth]);

  async function run(action) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await apiFetch(api, { method: "POST", body: form, auth });
      setSlots(result.slots);
      setNotice(result.added ? { type: "success", text: `${result.added} free times added.` } : { type: "info", text: "These times were already in the list." });
    });
  };

  const remove = (id) =>
    run(async () => {
      setSlots((await apiFetch(`${api}/${id}`, { method: "DELETE", auth })).slots);
    });

  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: "input-clay w-full",
    required: true,
  });

  const days = [...new Set(slots?.map((s) => s.date))];

  return (
    <>
      <form onSubmit={add} className="mb-4 grid grid-cols-2 gap-3 text-[13px] font-bold text-[var(--muted)]">
        <label className="min-w-0">Date<input type="date" min={todayLocal()} {...bind("date")} /></label>
        <label className="min-w-0">
          Each visit
          <select {...bind("length")}>
            {LENGTHS.map((n) => (
              <option key={n} value={n}>{n} minutes</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">From<input type="time" {...bind("from")} /></label>
        <label className="min-w-0">To<input type="time" {...bind("to")} /></label>
        <button disabled={busy} className="btn-primary col-span-2 py-3 text-sm">Add free times</button>
      </form>

      {notice && <Notice type={notice.type} className="mb-4">{notice.text}</Notice>}
      {slots?.length === 0 && <Notice className="text-center">No free times yet.</Notice>}

      {days.map((date) => (
        <div key={date} className="mb-4">
          <h3 className="mb-2 text-sm font-extrabold">{formatDay({ date })}</h3>
          <ul className="flex flex-wrap gap-2">
            {slots.filter((s) => s.date === date).map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-[14px] px-3 py-2 text-[13px] font-bold"
                style={s.booked ? { background: "var(--accent-soft)", color: "var(--accent)" } : { background: "var(--ok-bg)", color: "var(--ok-fg)" }}
              >
                {s.time}
                {s.booked ? " booked" : (
                  <button type="button" disabled={busy} aria-label={`Remove ${s.time}`} onClick={() => remove(s.id)} className="cursor-pointer px-1">✕</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
};

export default SlotManager;
