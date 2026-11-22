import { useState } from "react";
import Adminnavbar from "./Adminnavbar";
import Notice from "./Notice";
import StatusBadge from "./StatusBadge";
import { useVisitors } from "../hooks/useVisitors";
import { formatTime, groupSize, isInside, STATUSES } from "../lib/visitors";

const Adminentry = () => {
  const { visitors, loading, error, refresh } = useVisitors();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = visitors.filter(
    (v) =>
      (v.name || "").toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || (filter === "inside" ? isInside(v) : v.status === filter)),
  );

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-2" style={{ animation: "fadeUp .4s ease both" }}>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">Visitor entry / exit log</h1>
        <p className="mb-6 mt-1 text-[13.5px] text-[var(--muted)]">
          {visitors.filter(isInside).reduce((n, v) => n + groupSize(v), 0)} people inside now · updates every 30 seconds
        </p>

        <div className="mb-4 grid gap-3 sm:flex sm:items-center">
          <input
            type="search"
            aria-label="Search by name"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-clay w-full sm:w-60"
          />
          <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="input-clay w-full capitalize sm:w-auto">
            <option value="all">All visitors</option>
            <option value="inside">Inside now</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="button" onClick={refresh} className="btn-primary px-5 py-3 text-sm sm:ml-auto">Refresh</button>
        </div>

        {error && <Notice type="error" className="mb-4">{error}</Notice>}
        {!error && rows.length === 0 && <Notice className="text-center">{loading ? "Loading visitor records…" : "No visitors found."}</Notice>}

        {rows.length > 0 && (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
              {rows.map((v) => (
                <li key={v._id} className="clay-sm min-w-0 rounded-[22px] p-4">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-extrabold">{v.name}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="mb-3 break-all text-[13px] text-[var(--muted)]">{v.email || "—"}</p>
                  <dl className="grid grid-cols-2 gap-2 text-[13px]">
                    <div><dt className="text-[var(--muted)]">Entry</dt><dd className="font-bold">{formatTime(v.entryTime)}</dd></div>
                    <div><dt className="text-[var(--muted)]">Exit</dt><dd className="font-bold">{formatTime(v.exitTime)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="clay hidden overflow-x-auto rounded-[26px] p-6 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {["Name", "Email", "Status", "Entry time", "Exit time"].map((h) => (
                      <th key={h} className="th-clay">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v._id} className="transition hover:bg-[var(--surface)]">
                      <td className="td-clay font-extrabold">{v.name}</td>
                      <td className="td-clay break-all text-[var(--muted)]">{v.email || "—"}</td>
                      <td className="td-clay"><StatusBadge status={v.status} /></td>
                      <td className="td-clay font-semibold text-[var(--muted)]">{formatTime(v.entryTime)}</td>
                      <td className="td-clay font-semibold text-[var(--muted)]">{formatTime(v.exitTime)}</td>
                    </tr>
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

export default Adminentry;
