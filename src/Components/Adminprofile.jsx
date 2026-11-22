import { useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Notice from "./Notice";
import Adminpic from "../assets/Admin.png";
import { apiFetch } from "../lib/api";

const Adminprofile = () => {
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/me", { auth: true })
      .then(setAdmin)
      .catch((err) => setError(err.message));
  }, []);

  const rows = [
    ["Email", admin?.email || "…"],
    ["Role", admin?.role || "…"],
    ["Organization", admin?.org || "…"],
    ["Department", "Security Management"],
  ];

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="flex items-start justify-center px-4 py-6 sm:py-14">
        <div className="clay w-full max-w-[720px] overflow-hidden rounded-[28px]" style={{ animation: "fadeUp .4s ease both" }}>
          <div className="h-[110px]" style={{ background: "linear-gradient(160deg,var(--accent2),var(--accent))" }} />
          <div className="px-5 pb-7 sm:px-9">
            <div className="-mt-12 mb-6 flex flex-wrap items-end gap-5">
              <img src={Adminpic} alt="" className="clay h-[104px] w-[104px] rounded-[28px] object-contain p-2" />
              <div className="pb-1.5">
                <h1 className="font-display text-2xl font-extrabold">Admin</h1>
                <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">Security Management · VISITRA</p>
              </div>
            </div>

            {error && <Notice type="error" className="mb-4">{error}</Notice>}
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="tile rounded-2xl px-4 py-3.5">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
                  <dd className="mt-1 break-words text-[15px] font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Adminprofile;
