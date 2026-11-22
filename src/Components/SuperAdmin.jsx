import { useCallback, useEffect, useState } from "react";
import Drawer from "./Drawer";
import LogoutButton from "./LogoutButton";
import NavShell from "./NavShell";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { clearToken } from "../lib/auth";

const API = "/api/super/organizations";
const NEW_ORG = { code: "", name: "", type: "university" };

const SuperAdmin = () => {
  const [orgs, setOrgs] = useState(null);
  const [form, setForm] = useState(NEW_ORG);
  const [adminOf, setAdminOf] = useState(null);
  const [admin, setAdmin] = useState({ email: "", password: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const closeDrawer = useCallback(() => setAdminOf(null), []);

  useEffect(() => {
    apiFetch(API, { auth: "super" }).then(setOrgs, (err) => setNotice({ type: "error", text: err.message }));
  }, []);

  async function run(path, method, body, text) {
    setBusy(true);
    try {
      setOrgs(await apiFetch(API + path, { method, body, auth: "super" }));
      setNotice({ type: "success", text });
      return true;
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const add = async (e) => {
    e.preventDefault();
    if (await run("", "POST", form, `${form.name} added. Set its admin, then turn it on.`)) setForm(NEW_ORG);
  };

  const bind = (key) => ({
    "aria-label": key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: "input-clay w-full",
    required: true,
  });

  return (
    <div className="min-h-screen">
      <NavShell home="/SuperAdmin" links={[]}>
        <LogoutButton onLogout={() => clearToken("super")} />
      </NavShell>
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Organizations</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">You see only numbers here. Visitor details stay inside each organization.</p>

        <form onSubmit={add} className="clay mb-6 grid gap-3 rounded-[26px] p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_2fr_1fr_auto]">
          <input {...bind("code")} maxLength={12} placeholder="Short name" />
          <input {...bind("name")} placeholder="Full name" />
          <select {...bind("type")}>
            <option value="university">University</option>
            <option value="office">Office</option>
          </select>
          <button disabled={busy} className="btn-primary px-6 py-3 text-sm">Add</button>
        </form>

        {notice && <Notice type={notice.type} className="mb-5">{notice.text}</Notice>}
        {!orgs && !notice && <Notice className="text-center">Loading…</Notice>}

        <ul className="grid gap-4 sm:grid-cols-2">
          {orgs?.map((o) => (
            <li key={o.id} className="clay-sm min-w-0 rounded-[22px] p-5">
              <p className="font-display text-xl font-extrabold">{o.code}</p>
              <p className="break-words font-semibold">{o.name}</p>
              <p className="mb-3 break-all text-[13px] text-[var(--muted)]">
                {o.active ? "On" : "Off"} · {o.visitors} visitors · {o.teachers} teachers<br />
                Admin: {o.admin || "not set"}
              </p>
              {!o.home && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setAdmin({ email: o.admin, password: "" });
                      setAdminOf(o);
                    }}
                    className="btn-soft px-4 py-2.5 text-[13px]"
                  >
                    Set admin
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(`/${o.id}/active`, "PUT", { active: !o.active }, `${o.name} is turned ${o.active ? "off" : "on"}.`)}
                    className={`${o.active ? "btn-danger" : "btn-ok"} px-4 py-2.5 text-[13px]`}
                  >
                    {o.active ? "Turn off" : "Turn on"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>

      {adminOf && (
        <Drawer title={`Admin of ${adminOf.code}`} onClose={closeDrawer}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(`/${adminOf.id}/admin`, "PUT", admin, `The admin of ${adminOf.name} is set.`)) closeDrawer();
            }}
          >
            <input type="email" aria-label="Email" required placeholder="Admin email" value={admin.email} onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))} className="input-clay mb-3 w-full" />
            <input type="password" aria-label="Password" required minLength={10} autoComplete="new-password" placeholder="Password (10 or more)" value={admin.password} onChange={(e) => setAdmin((a) => ({ ...a, password: e.target.value }))} className="input-clay mb-3 w-full" />
            <button disabled={busy} className="btn-primary w-full py-3 text-sm">Save admin</button>
          </form>
        </Drawer>
      )}
    </div>
  );
};

export default SuperAdmin;
