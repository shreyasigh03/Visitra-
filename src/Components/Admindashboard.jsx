import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import React from "react";
import { MdOutlinePendingActions } from "react-icons/md";
import Adminnavbar from "./Adminnavbar";
import { RiGroupFill } from "react-icons/ri";
import { API_BASE_URL } from "../config";

//deploy krne ke lie api)uri add krdia h local host hta dia hai
const Admindashboard = () => {
  const [visitors, setVisitors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const itemsPerPage = 5;
  const totalVisits = visitors.length;
  const pendingRequests = visitors.filter((v) => v.status === "pending").length;
  const approvedCount = visitors.filter((v) => v.status === "approved").length;
  const rejectedCount = visitors.filter((v) => v.status === "rejected").length;
  const todayDate = new Date().toISOString().split("T")[0];
  const todayVisits = visitors.filter((v) =>
    (v.date || "").startsWith(todayDate),
  ).length;

  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectVisitor, setRejectVisitor] = useState(null);
  const [rejectMsg, setRejectMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/visitor/all`)
      .then((res) => res.json())
      .then((data) => setVisitors(data))
      .catch((err) => console.log(err));
  }, []);

  const filteredVisitors = visitors.filter((v) => {
    const date = v.date || "";

    if (filter === "today") {
      return date.startsWith(todayDate);
    }

    if (filter === "range") {
      const fromMatch = fromDate ? date >= fromDate : true;
      const toMatch = toDate ? date <= toDate : true;
      return fromMatch && toMatch;
    }

    const statusMatch = filter === "all" || (v.status || "pending") === filter;
    return statusMatch;
  });

  const searchedVisitors = filteredVisitors.filter((v) =>
    (v.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const sortedVisitors = [...searchedVisitors].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sort === "latest" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedVisitors.length / itemsPerPage);

  const paginatedVisitors = sortedVisitors.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const updateStatus = async (id, status, message = "") => {
    // instant UI update (no wait)
    setVisitors((prev) =>
      prev.map((v) => (v._id === id ? { ...v, status } : v)),
    );

    if (status === "approved") {
      setSuccessMsg("Visitor Approved & Email Sent ✔");
      setTimeout(() => setSuccessMsg(""), 2000);
    }

    try {
      await fetch(`${API_BASE_URL}/api/visitor/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, message }),
      });
    } catch (err) {
      console.log(err);
    }
  };

  const verifyPass = async () => {
    if (!verifyId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/visitor/verify/${verifyId}`);
      const data = await res.json();

      if (data.status === "valid") {
        if (data.visitor.status === "approved") {
          setVerifyResult({ type: "valid", visitor: data.visitor });
        } else {
          setVerifyResult({ type: "not-approved", visitor: data.visitor });
        }
      } else {
        setVerifyResult({ type: "invalid" });
      }
    } catch (err) {
      console.log(err);
      setVerifyResult({ type: "error" });
    }
  };

  if (!localStorage.getItem("isAdmin")) {
    return <Navigate to="/AdminLogin" replace />;
  }

  const statBadge = (v) =>
    v === "approved"
      ? { background: "var(--ok-bg)", color: "var(--ok-fg)" }
      : v === "rejected"
        ? { background: "var(--bad-bg)", color: "var(--bad-fg)" }
        : { background: "var(--warn-bg)", color: "var(--warn-fg)" };

  const statCards = [
    { label: "Pending Request", value: pendingRequests, Icon: MdOutlinePendingActions, chip: { background: "var(--warn-bg)", color: "var(--warn-fg)" } },
    { label: "Total Visits", value: totalVisits, Icon: RiGroupFill, chip: { background: "var(--accent-soft)", color: "var(--accent)" } },
    { label: "Approved", value: approvedCount, Icon: RiGroupFill, chip: { background: "var(--ok-bg)", color: "var(--ok-fg)" } },
    { label: "Rejected", value: rejectedCount, Icon: RiGroupFill, chip: { background: "var(--bad-bg)", color: "var(--bad-fg)" } },
    { label: "Today Visits", value: todayVisits, Icon: RiGroupFill, chip: { background: "var(--accent-soft)", color: "var(--accent)" } },
  ];

  return (
    <div className="min-h-screen">
      <Adminnavbar />

      <div className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6" style={{ animation: "fadeUp .4s ease both" }}>
        <div className="mb-6 mt-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">Visitor dashboard</h1>
        </div>

        {/* stat cards */}
        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map(({ label, value, Icon, chip }) => (
            <div key={label} className="clay-sm rounded-[22px] p-4.5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-clay)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-[var(--muted)]">{label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl text-base" style={chip}>
                  <Icon />
                </span>
              </div>
              <p className="font-display text-[28px] font-extrabold leading-none">{value}</p>
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="font-display mr-auto text-lg font-extrabold">Visitors</h1>

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-clay w-[190px] rounded-[13px] px-3.5 py-2.5 text-[13px]"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-clay cursor-pointer appearance-none rounded-[13px] px-3.5 py-2.5 text-[13px] font-bold"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="today">Today</option>
            <option value="range">Date Range</option>
          </select>
          {filter === "range" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-clay rounded-[13px] px-3.5 py-2 text-[13px]"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-clay rounded-[13px] px-3.5 py-2 text-[13px]"
              />
            </>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-clay cursor-pointer appearance-none rounded-[13px] px-3.5 py-2.5 text-[13px] font-bold"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <input
            type="text"
            placeholder="Enter Pass ID"
            value={verifyId}
            onChange={(e) => setVerifyId(e.target.value)}
            className="input-clay w-[150px] rounded-[13px] px-3.5 py-2.5 text-[13px]"
          />

          <button
            onClick={verifyPass}
            className="btn-primary rounded-[13px] px-4.5 py-2.5 text-[13px]"
          >
            Verify
          </button>
        </div>

        {verifyResult && (
          <div
            className="mb-5 rounded-[18px] px-4.5 py-3.5 text-sm font-bold"
            style={{
              boxShadow: "var(--shadow-clay-sm)",
              ...(verifyResult.type === "valid"
                ? { background: "var(--ok-bg)", color: "var(--ok-fg)" }
                : verifyResult.type === "not-approved"
                  ? { background: "var(--warn-bg)", color: "var(--warn-fg)" }
                  : verifyResult.type === "invalid"
                    ? { background: "var(--bad-bg)", color: "var(--bad-fg)" }
                    : { background: "var(--surface)", color: "var(--muted)" }),
              animation: "fadeUp .25s ease both",
            }}
          >
            {verifyResult.type === "valid" && (
              <div>
                <p><strong>VALID ENTRY</strong></p>
                <p className="font-semibold">Name: {verifyResult.visitor.name}</p>
                <p className="font-semibold">Status: {verifyResult.visitor.status}</p>
                <p className="font-semibold">Email: {verifyResult.visitor.email}</p>
                <p className="font-semibold">Phone: {verifyResult.visitor.phone}</p>
              </div>
            )}

            {verifyResult.type === "not-approved" && (
              <div>
                <p><strong>NOT APPROVED</strong></p>
                <p className="font-semibold">Name: {verifyResult.visitor.name}</p>
                <p className="font-semibold">Status: {verifyResult.visitor.status}</p>
              </div>
            )}

            {verifyResult.type === "invalid" && <p>INVALID PASS</p>}
          </div>
        )}

        {rejectVisitor && (
          <div className="clay fixed right-0 top-0 z-50 h-full w-[360px] max-w-[92vw] overflow-y-auto rounded-l-[28px] p-6"
            style={{ animation: "slideIn .25s ease both" }}>
            <button
              onClick={() => {
                setRejectVisitor(null);
                setRejectMsg("");
              }}
              className="btn-soft absolute right-4 top-4 h-9 w-9 rounded-xl text-sm"
            >
              ✕
            </button>

            <h2 className="font-display mb-4 mt-1 text-lg font-extrabold">Reject Visitor</h2>

            <textarea
              placeholder="Optional message..."
              value={rejectMsg}
              onChange={(e) => setRejectMsg(e.target.value)}
              className="input-clay mb-3 w-full min-h-[110px] resize-y"
            />

            <button
              onClick={() => {
                updateStatus(rejectVisitor._id, "rejected", rejectMsg);
                setRejectVisitor(null);
                setRejectMsg("");
              }}
              className="w-full cursor-pointer rounded-2xl py-3 text-sm font-extrabold transition hover:-translate-y-0.5"
              style={{ background: "var(--bad-bg)", color: "var(--bad-fg)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              Send & Reject
            </button>
          </div>
        )}

        {successMsg && (
          <div className="fixed right-5 top-5 z-50 rounded-2xl px-5 py-3 text-sm font-extrabold"
            style={{ background: "var(--ok-bg)", color: "var(--ok-fg)", boxShadow: "var(--shadow-clay)", animation: "fadeUp .25s ease both" }}>
            {successMsg}
          </div>
        )}

        {/* table */}
        <div className="clay overflow-x-auto rounded-[26px] p-5 sm:p-6">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="th-clay">Pass ID</th>
                <th className="th-clay">Name</th>
                <th className="th-clay">Email</th>
                <th className="th-clay">Phone</th>
                <th className="th-clay">To Meet</th>
                <th className="th-clay">Date</th>
                <th className="th-clay">Status</th>
                <th className="th-clay text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedVisitors.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-[var(--muted)]">
                    No results found
                  </td>
                </tr>
              )}
              {paginatedVisitors.map((v, i) => (
                <tr key={i} className="transition hover:bg-[var(--surface)]">
                  <td className="td-clay font-bold text-[var(--muted)]">{v.passId}</td>
                  <td className="td-clay">
                    <div className="flex items-center gap-2 font-extrabold">
                      <span>{v.name || "-"}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                        title="View details"
                      >
                        i
                      </button>
                    </div>
                  </td>
                  <td className="td-clay text-[var(--muted)]">{v.email || "-"}</td>
                  <td className="td-clay text-[var(--muted)]">{v.phone || "-"}</td>
                  <td className="td-clay font-semibold">{v.toMeet || "-"}</td>
                  <td className="td-clay text-[var(--muted)]">
                    {v.date && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : "-"}
                  </td>
                  <td className="td-clay">
                    <span
                      className="rounded-full px-3 py-1 text-[11.5px] font-extrabold capitalize"
                      style={statBadge(v.status || "pending")}
                    >
                      {v.status || "pending"}
                    </span>
                  </td>
                  <td className="td-clay whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setVerifyId(v.passId);
                        setTimeout(() => verifyPass(), 100);
                      }}
                      className="mr-1.5 cursor-pointer rounded-[11px] px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => updateStatus(v._id, "approved")}
                      disabled={v.status === "approved"}
                      className={`mr-1.5 rounded-[11px] px-3 py-1.5 text-xs font-bold transition ${
                        v.status === "approved"
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer hover:opacity-80"
                      }`}
                      style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectVisitor(v)}
                      disabled={v.status === "rejected"}
                      className={`rounded-[11px] px-3 py-1.5 text-xs font-bold transition ${
                        v.status === "rejected"
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer hover:opacity-80"
                      }`}
                      style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="btn-soft rounded-xl px-4 py-1.5 text-[13px]"
            >
              Prev
            </button>

            <span className="px-2 py-1 text-sm font-extrabold">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="btn-soft rounded-xl px-4 py-1.5 text-[13px]"
            >
              Next
            </button>
          </div>
        </div>

        {selectedVisitor && (
          <div className="clay fixed right-0 top-0 z-50 h-full w-[360px] max-w-[92vw] overflow-y-auto rounded-l-[28px] p-6"
            style={{ animation: "slideIn .25s ease both" }}>
            <button
              onClick={() => setSelectedVisitor(null)}
              className="btn-soft absolute right-4 top-4 h-9 w-9 rounded-xl text-sm"
            >
              ✕
            </button>

            <h2 className="font-display mb-5 mt-1 text-lg font-extrabold">Visitor Details</h2>

            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {[
                ["Name", selectedVisitor.name || "-"],
                ["Email", selectedVisitor.email || "-"],
                ["Phone", selectedVisitor.phone || "-"],
                ["Host", selectedVisitor.toMeet || "-"],
                ["Date", selectedVisitor.date || "-"],
                ["Time", selectedVisitor.time || (selectedVisitor.createdAt ? selectedVisitor.createdAt.split("T")[1]?.slice(0, 5) : "-")],
                ["Status", selectedVisitor.status || "pending"],
                ["Pass ID", selectedVisitor.passId || "-"],
              ].map(([label, value]) => (
                <div key={label} className="tile px-3 py-2.5" style={label === "Email" ? { gridColumn: "1 / -1" } : undefined}>
                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</div>
                  <div className="mt-0.5 break-words font-extrabold capitalize">{value}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                (window.location.href = `mailto:${selectedVisitor.email}`)
              }
              className="mt-5 w-full cursor-pointer rounded-2xl py-3 text-sm font-extrabold transition hover:-translate-y-0.5"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              Send Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admindashboard;
