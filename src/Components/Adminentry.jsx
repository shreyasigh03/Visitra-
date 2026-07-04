import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import Navbar from "./Navbar";

// status label -> badge color classes (same style as the main dashboard table)
const STATUS_STYLES = {
  approved: "bg-green-100 text-green-700",
  verified: "bg-yellow-100 text-yellow-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">
          Visitor Entry / Exit Log
        </h1>

        {/* filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="All">All Status</option>
            <option value="approved">Approved</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchVisitors}
            className="ml-auto rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-lime-600"
          >
            Refresh
          </button>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Entry Time</th>
                <th className="px-4 py-3 font-semibold">Exit Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Loading visitor records...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No visitors found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((v) => (
                  <tr key={v._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{v.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{v.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${
                          STATUS_STYLES[v.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {v.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatTime(v.entryTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
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
