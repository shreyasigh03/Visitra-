import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import Navbar from "./Navbar";
import Adminnavbar from "./Adminnavbar";

// status label -> badge style (design-token driven, follows light/dark theme)
const STATUS_STYLES = {
  approved: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  verified: { background: "var(--accent-soft)", color: "var(--accent)" },
  pending: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  rejected: { background: "var(--bad-bg)", color: "var(--bad-fg)" },
};

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VisitorEntryExit = () => {
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVisitors();
  }, []);

  async function fetchVisitors() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/visitor/all`);


      if (!res.ok) throw new Error("Failed to fetch visitors");


      const data = await res.json();

      setVisitors(data);
      setLoading(false);


    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const filtered = visitors.filter((v) => {
    const matchesSearch = v.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen">
      <Adminnavbar />

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-2" style={{ animation: "fadeUp .4s ease both" }}>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">
            Visitor Entry / Exit Log
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">
            On-site movement across all verified passes
          </p>
        </div>

        {/* filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-clay rounded-[14px] px-3.5 py-2.5 text-[13.5px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-clay cursor-pointer appearance-none rounded-[14px] px-3.5 py-2.5 text-[13.5px] font-bold"
          >
            <option value="All">All Status</option>
            <option value="approved">Approved</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchVisitors}
            className="btn-primary ml-auto rounded-[14px] px-4.5 py-2.5 text-[13.5px]"
          >
            Refresh
          </button>
        </div>

        {/* table */}
        <div className="clay overflow-x-auto rounded-[26px] p-5 sm:p-6">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="th-clay">Name</th>
                <th className="th-clay">Email</th>
                <th className="th-clay">Status</th>
                <th className="th-clay">Entry Time</th>
                <th className="th-clay">Exit Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                    Loading visitor records...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center font-bold" style={{ color: "var(--bad-fg)" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                    No visitors found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((v) => (
                  <tr key={v._id} className="transition hover:bg-[var(--surface)]">
                    <td className="td-clay font-extrabold">{v.name || "—"}</td>
                    <td className="td-clay text-[var(--muted)]">{v.email || "—"}</td>
                    <td className="td-clay">
                      <span
                        className="rounded-full px-3 py-1 text-[11.5px] font-extrabold capitalize"
                        style={STATUS_STYLES[v.status] || { background: "var(--surface)", color: "var(--muted)" }}
                      >
                        {v.status || "unknown"}
                      </span>
                    </td>
                    <td className="td-clay font-semibold text-[var(--muted)]">
                      {formatTime(v.entryTime)}
                    </td>
                    <td className="td-clay font-semibold text-[var(--muted)]">
                      {formatTime(v.exitTime)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorEntryExit;
