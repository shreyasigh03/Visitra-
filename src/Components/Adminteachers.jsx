import { useCallback, useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Drawer from "./Drawer";
import Notice from "./Notice";
import SlotManager from "./SlotManager";
import { apiFetch } from "../lib/api";

const EMPTY = { name: "", email: "", department: "" };
const URL = "/api/admin/teachers";

const Adminteachers = () => {
  const [teachers, setTeachers] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [slotsOf, setSlotsOf] = useState(null);
  const closeSlots = useCallback(() => setSlotsOf(null), []);

  useEffect(() => {
    apiFetch(URL, { auth: true }).then(setTeachers, (err) => setNotice({ type: "error", text: err.message }));
  }, []);

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const showInvite = (r) => setNotice({ type: r.inviteSent ? "success" : "error", text: r.message });

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await apiFetch(URL, { method: "POST", body: form, auth: true });
      setTeachers((list) => [...(list ?? []), result.teacher].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(EMPTY);
      showInvite(result);
    });
  };

  const sendLink = (t) => run(async () => showInvite(await apiFetch(`${URL}/${t.id}/invite`, { method: "POST", auth: true })));

  const toggle = (t) =>
    run(async () => {
      const updated = await apiFetch(`${URL}/${t.id}/active`, { method: "PUT", body: { active: !t.active }, auth: true });
      setTeachers((list) => list.map((x) => (x.id === t.id ? updated : x)));
      setNotice({ type: "success", text: `${t.name} is turned ${updated.active ? "on" : "off"}.` });
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
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Teachers</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">Visitors choose from this list, and the teacher approves them.</p>

        <form onSubmit={add} className="clay mb-6 grid gap-3 rounded-[26px] p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1.3fr_1fr_auto]">
          <input {...bind("name")} placeholder="Name" required />
          <input {...bind("email")} type="email" placeholder="Email" required />
          <input {...bind("department")} placeholder="Department (optional)" />
          <button disabled={busy} className="btn-primary px-6 py-3 text-sm">Add teacher</button>
        </form>

        {notice && <Notice type={notice.type} className="mb-5">{notice.text}</Notice>}
        {!teachers?.length && <Notice className="text-center">{teachers ? "No teachers yet. Add the first one above." : "Loading…"}</Notice>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {teachers?.map((t) => (
            <li key={t.id} className="clay-sm min-w-0 rounded-[22px] p-4">
              <p className="break-words font-extrabold">{t.name}</p>
              <p className="break-all text-[13px] text-[var(--muted)]">{t.email}</p>
              <p className="mb-3 text-[13px] text-[var(--muted)]">
                {t.department && `${t.department} · `}
                {!t.active ? "Turned off" : t.hasPassword ? "Ready" : "Has not set a password yet"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!t.active} onClick={() => setSlotsOf(t)} className="btn-soft px-4 py-2.5 text-[13px]">
                  Free times
                </button>
                <button type="button" disabled={busy || !t.active} onClick={() => sendLink(t)} className="btn-soft px-4 py-2.5 text-[13px]">
                  Send password link
                </button>
                <button type="button" disabled={busy} onClick={() => toggle(t)} className={`${t.active ? "btn-danger" : "btn-ok"} px-4 py-2.5 text-[13px]`}>
                  {t.active ? "Turn off" : "Turn on"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {slotsOf && (
        <Drawer title={`Free times of ${slotsOf.name}`} onClose={closeSlots}>
          <SlotManager api={`${URL}/${slotsOf.id}/slots`} auth={true} />
        </Drawer>
      )}
    </div>
  );
};

export default Adminteachers;
