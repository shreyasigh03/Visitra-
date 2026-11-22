import { useCallback, useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const COLUMNS = [
  ["Name", "name"],
  ["Host", "toMeet"],
  ["Phone", "phone"],
  ["Visit date", "date"],
  ["Status", "status"],
  ["Entry", "entryTime"],
  ["Exit", "exitTime"],
];

const Cleanup = ({ onDone }) => {
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setPreview(await apiFetch("/api/admin/cleanup", { auth: true }));
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function run() {
    setBusy(true);
    try {
      const r = await apiFetch("/api/admin/cleanup", { method: "POST", body: { confirm: true }, auth: true });
      setNotice({
        type: "success",
        text: `Done. ${plural(r.recordsArchived, "record")} moved to Excel, face data deleted for ${plural(r.facesDeleted, "visitor")}.`,
      });
      onDone();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
      setConfirming(false);
      load();
    }
  }

  const nothingDue = preview && preview.recordsDue === 0 && preview.facesDue === 0;

  return (
    <section className="clay mb-7 rounded-[26px] p-4 sm:p-6">
      <h2 className="font-display mb-3 text-lg font-extrabold">Clean-up</h2>
      {notice && <Notice type={notice.type} className="mb-4">{notice.text}</Notice>}
      {!preview && !notice && <p className="text-sm text-[var(--muted)]">Checking…</p>}

      {preview && (
        <>
          <dl className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="tile px-4 py-3">
              <dt className="text-[13px] text-[var(--muted)]">
                Face photo and face data to delete (older than {plural(preview.faceMonths, "month")})
              </dt>
              <dd className="font-display text-2xl font-extrabold">{preview.facesDue}</dd>
            </div>
            <div className="tile px-4 py-3">
              <dt className="text-[13px] text-[var(--muted)]">
                Records to move to Excel (older than {plural(preview.recordMonths, "month")})
              </dt>
              <dd className="font-display text-2xl font-extrabold">{preview.recordsDue}</dd>
            </div>
          </dl>
          <p className="mb-4 break-all text-[13px] text-[var(--muted)]">
            {preview.automatic ? "Runs every day by itself." : "Runs only when you press the button."} Excel folder: {preview.folder}
          </p>

          {nothingDue && <Notice>Nothing is old enough to clean up.</Notice>}
          {!nothingDue && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="btn-soft px-5 py-3 text-sm">Clean up now</button>
          )}
          {!nothingDue && confirming && (
            <div className="rounded-[18px] p-4" style={{ background: "var(--warn-bg)", color: "var(--warn-fg)" }}>
              <p className="mb-3 text-sm font-bold">
                Face data for {plural(preview.facesDue, "visitor")} will be deleted for good.{" "}
                {plural(preview.recordsDue, "record")} will be saved in Excel, then removed from the database. This cannot be undone.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={run} className="btn-danger px-5 py-3 text-sm">
                  {busy ? "Working…" : "Yes, clean up"}
                </button>
                <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="btn-soft px-5 py-3 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

const Adminarchive = () => {
  const [query, setQuery] = useState({ search: "", year: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/admin/archive?${new URLSearchParams(query)}`, { auth: true });
        if (active) {
          setResult(data);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, version]);

  const rows = result?.visitors ?? [];
  const change = (key) => (e) => setQuery((q) => ({ ...q, [key]: e.target.value }));

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">Old records</h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">Visitors who were moved from the database to the Excel files.</p>

        <Cleanup onDone={() => setVersion((v) => v + 1)} />

        <div className="mb-4 grid gap-3 sm:flex">
          <input type="search" aria-label="Search old records" placeholder="Name, host, phone or date…" value={query.search} onChange={change("search")} className="input-clay w-full sm:w-72" />
          <select aria-label="Year" value={query.year} onChange={change("year")} className="input-clay w-full sm:w-auto">
            <option value="">All years</option>
            {result?.years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        {error && <Notice type="error" className="mb-4">{error}</Notice>}
        {!error && rows.length === 0 && (
          <Notice className="text-center">
            {!result ? "Loading…" : result.years.length ? "No old records match." : "No records have been moved to Excel yet."}
          </Notice>
        )}

        {rows.length > 0 && (
          <>
            <p className="mb-3 text-[13px] text-[var(--muted)]">
              {result.total > rows.length ? `Showing ${rows.length} of ${result.total}. Search to narrow it down.` : plural(result.total, "record")}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {rows.map((v) => (
                <li key={v._id} className="clay-sm min-w-0 rounded-[22px] p-4">
                  <p className="mb-2 break-words font-extrabold">{v.name}</p>
                  <dl className="grid grid-cols-2 gap-2 text-[13px]">
                    {COLUMNS.slice(1).map(([label, key]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[var(--muted)]">{label}</dt>
                        <dd className="break-words font-bold">{v[key] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            <div className="clay hidden overflow-x-auto rounded-[26px] p-6 lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>{COLUMNS.map(([label]) => <th key={label} className="th-clay">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v._id}>{COLUMNS.map(([label, key]) => <td key={label} className="td-clay">{v[key] || "—"}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Adminarchive;
