import { useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Drawer from "./Drawer";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";

const EMPTY = { name: "", username: "", password: "" };
const API = "/api/admin/guards";

const Adminguards = () => {
  const [guards, setGuards] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch(API, { auth: true }).then(setGuards, (err) => setNotice({ type: "error", text: err.message }));
  }, []);

  async function run(action, text) {
    setBusy(true);
    try {
      const saved = await action();
      setGuards((list) => [...(list ?? []).filter((g) => g.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setNotice({ type: "success", text: text(saved) });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const guard = await apiFetch(API, { method: "POST", body: form, auth: true });
      setForm(EMPTY);
      return guard;
    }, (g) => `${g.name} can now sign in as "${g.username}".`);
  };

  const change = (g, what, body, text) =>
    run(() => apiFetch(`${API}/${g.id}/${what}`, { method: "PUT", body, auth: true }), text);

  const bind = (key) => ({
    "aria-label": key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: "input-clay w-full",
    required: true,
  });

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Guards</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">Guards only see the gate page, never the admin pages. They don't need an email.</p>

        <form onSubmit={add} className="clay mb-6 grid gap-3 rounded-[26px] p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <input {...bind("name")} placeholder="Name" />
          <input {...bind("username")} placeholder="Username" autoCapitalize="none" autoComplete="off" />
          <input {...bind("password")} type="password" minLength={8} placeholder="Password (8 or more)" autoComplete="new-password" />
          <button disabled={busy} className="btn-primary px-6 py-3 text-sm">Add guard</button>
        </form>

        {notice && <Notice type={notice.type} className="mb-5">{notice.text}</Notice>}
        {!guards?.length && <Notice className="text-center">{guards ? "No guards yet. Add the first one above." : "Loading…"}</Notice>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {guards?.map((g) => (
            <li key={g.id} className="clay-sm min-w-0 rounded-[22px] p-4">
              <p className="break-words font-extrabold">{g.name}</p>
              <p className="mb-3 break-all text-[13px] text-[var(--muted)]">{g.username}{g.active ? "" : " · Turned off"}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setNewPassword("");
                    setEditing(g);
                  }}
                  className="btn-soft px-4 py-2.5 text-[13px]"
                >
                  Change password
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => change(g, "active", { active: !g.active }, (x) => `${x.name} is turned ${x.active ? "on" : "off"}.`)}
                  className={`${g.active ? "btn-danger" : "btn-ok"} px-4 py-2.5 text-[13px]`}
                >
                  {g.active ? "Turn off" : "Turn on"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {editing && (
        <Drawer title={`New password for ${editing.name}`} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              change(editing, "password", { password: newPassword }, (x) => `${x.name}'s password is changed.`);
              setEditing(null);
            }}
          >
            <input type="password" aria-label="New password" minLength={8} required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8 or more characters" className="input-clay mb-3 w-full" />
            <button className="btn-primary w-full py-3 text-sm">Save password</button>
          </form>
        </Drawer>
      )}
    </div>
  );
};

export default Adminguards;
