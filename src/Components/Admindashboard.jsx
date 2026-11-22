import { useCallback, useState } from "react";
import { MdEventAvailable, MdLogin, MdOutlinePendingActions } from "react-icons/md";
import { RiCloseCircleFill, RiCheckboxCircleFill, RiGroupFill } from "react-icons/ri";
import Adminnavbar from "./Adminnavbar";
import DashboardCharts from "./DashboardCharts";
import Drawer from "./Drawer";
import Notice from "./Notice";
import Overstays from "./Overstays";
import VisitorTable from "./VisitorTable";
import { useVisitors } from "../hooks/useVisitors";
import { apiFetch } from "../lib/api";
import { downloadCsv } from "../lib/csv";
import { formatDay, formatTime, groupSize, isInside, needsAdmin, reasonLabel, STATUSES, todayLocal, visitDay } from "../lib/visitors";

const PER_PAGE = 5;
const DEFAULT_VIEW = { filter: "all", search: "", sort: "latest", from: "", to: "", page: 1 };

const TONES = {
  ok: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  warn: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  bad: { background: "var(--bad-bg)", color: "var(--bad-fg)" },
  accent: { background: "var(--accent-soft)", color: "var(--accent)" },
};

function selectVisitors(visitors, { filter, search, sort, from, to }) {
  const query = search.trim().toLowerCase();
  const today = todayLocal();
  const matches = (v) => {
    const day = visitDay(v);
    if (query && !(v.name || "").toLowerCase().includes(query)) return false;
    if (filter === "all") return true;
    if (filter === "today") return day === today;
    if (filter === "inside") return isInside(v);
    if (filter === "admin") return needsAdmin(v);
    if (filter === "range") return (!from || day >= from) && (!to || day <= to);
    return v.status === filter;
  };
  const direction = sort === "latest" ? -1 : 1;
  return visitors.filter(matches).sort((a, b) => direction * visitDay(a).localeCompare(visitDay(b)));
}

function describePass(result) {
  if (result.status !== "valid") return { type: "error", text: "Invalid pass — no visitor has this Pass ID." };
  const { name, status, phone } = result.visitor;
  return status === "approved"
    ? { type: "success", text: `Valid entry — ${name}, ${phone}` }
    : { type: "warn", text: `Not approved — ${name} (${status})` };
}

const Admindashboard = () => {
  const { visitors, loading, error, refresh, updateStatus } = useVisitors();
  const [view, setView] = useState(DEFAULT_VIEW);
  const [passId, setPassId] = useState("");
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [details, setDetails] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectMessage, setRejectMessage] = useState("");

  // Any filter change goes back to the first page.
  const change = (key) => (e) => setView((v) => ({ ...v, [key]: e.target.value, page: 1 }));

  const selected = selectVisitors(visitors, view);
  const totalPages = Math.max(1, Math.ceil(selected.length / PER_PAGE));
  const page = Math.min(view.page, totalPages);
  const pageRows = selected.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const inside = visitors.filter(isInside);
  const waiting = visitors.filter(needsAdmin);
  const count = (status) => visitors.filter((v) => v.status === status).length;

  const cards = [
    ["People inside now", inside.reduce((n, v) => n + groupSize(v), 0), MdLogin, "ok"],
    ["Pending requests", count("pending"), MdOutlinePendingActions, "warn"],
    ["Total visits", visitors.length, RiGroupFill, "accent"],
    ["Approved", count("approved"), RiCheckboxCircleFill, "ok"],
    ["Rejected", count("rejected"), RiCloseCircleFill, "bad"],
    ["Today's visits", visitors.filter((v) => visitDay(v) === todayLocal()).length, MdEventAvailable, "accent"],
  ];

  async function setStatus(visitor, status, message) {
    setBusyId(visitor._id);
    try {
      await updateStatus(visitor._id, status, message);
      setNotice({ type: "success", text: `${visitor.name} ${status}. An email is on its way.` });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  async function verifyPass(id) {
    const value = (id ?? "").trim();
    if (!value) {
      setNotice({ type: "error", text: "There is no Pass ID to check." });
      return;
    }
    setPassId(value);
    try {
      setNotice(describePass(await apiFetch(`/api/visitor/verify/${encodeURIComponent(value)}`, { auth: true })));
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  async function blacklist(v) {
    setDetails(null);
    try {
      await apiFetch("/api/admin/blacklist", {
        method: "POST",
        body: { name: v.name, email: v.email, phone: /\d{10}$/.test((v.phone || "").replace(/\D/g, "")) ? v.phone : "", reason: "" },
        auth: true,
      });
      setNotice({ type: "success", text: `${v.name} is on the blacklist. You can undo this on the Blacklist page.` });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  const closeDetails = useCallback(() => setDetails(null), []);
  const closeReject = useCallback(() => {
    setRejecting(null);
    setRejectMessage("");
  }, []);

  return (
    <div className="min-h-screen">
      <Adminnavbar />
      <main className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6">
        <h1 className="font-display mb-6 mt-2 text-2xl font-extrabold tracking-tight sm:text-[28px]">Visitor dashboard</h1>
        {error && <Notice type="error" className="mb-5">{error}</Notice>}

        <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {cards.map(([label, value, Icon, tone]) => (
            <div key={label} className="clay-sm min-w-0 rounded-[22px] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-[var(--muted)]">{label}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={TONES[tone]}>
                  <Icon />
                </span>
              </div>
              <p className="font-display text-[28px] font-extrabold leading-none">{loading ? "…" : value}</p>
            </div>
          ))}
        </div>

        <section className="clay mb-7 rounded-[26px] p-4 sm:p-6">
          <h2 className="font-display mb-3 text-lg font-extrabold">Inside now</h2>
          {inside.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{loading ? "Loading…" : "Nobody is inside right now."}</p>
          ) : (
            <ul className="grid max-h-72 gap-2.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {inside.map((v) => (
                <li key={v._id} className="tile min-w-0 px-4 py-3">
                  <p className="break-words font-extrabold">{v.name}{groupSize(v) > 1 && ` + ${groupSize(v) - 1}`}</p>
                  <p className="text-[13px] text-[var(--muted)]">Meeting {v.toMeet || "—"} · in since {formatTime(v.entryTime)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Overstays role="admin" onChange={refresh} />

        {waiting.length > 0 && (
          <section className="mb-7">
            <h2 className="font-display text-lg font-extrabold">Waiting for admin ({waiting.length})</h2>
            <p className="mb-3 text-[13px] text-[var(--muted)]">
              The person they want to meet is not in the teacher list. Click a visitor's name to see details or email them.
            </p>
            <VisitorTable
              visitors={waiting}
              busyId={busyId}
              onDetails={setDetails}
              onVerify={verifyPass}
              onApprove={(v) => setStatus(v, "approved")}
              onReject={setRejecting}
            />
          </section>
        )}

        <DashboardCharts visitors={visitors} />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold">Visitors ({selected.length})</h2>
          <button type="button" onClick={() => downloadCsv(selected)} disabled={selected.length === 0} className="btn-soft px-4 py-2.5 text-[13px]">
            Download CSV
          </button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="search" aria-label="Search by name" placeholder="Search by name…" value={view.search} onChange={change("search")} className="input-clay w-full" />
          <select aria-label="Filter" value={view.filter} onChange={change("filter")} className="input-clay w-full capitalize">
            <option value="all">All visitors</option>
            <option value="inside">Inside now</option>
            <option value="admin">Waiting for admin</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="today">Today</option>
            <option value="range">Date range</option>
          </select>
          <select aria-label="Sort" value={view.sort} onChange={change("sort")} className="input-clay w-full">
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              verifyPass(passId);
            }}
          >
            <input aria-label="Pass ID" inputMode="numeric" placeholder="Pass ID" value={passId} onChange={(e) => setPassId(e.target.value)} className="input-clay w-full min-w-0" />
            <button className="btn-primary px-4 text-[13px]">Verify</button>
          </form>
          {view.filter === "range" && (
            <>
              <input type="date" aria-label="From date" value={view.from} onChange={change("from")} className="input-clay w-full" />
              <input type="date" aria-label="To date" value={view.to} onChange={change("to")} className="input-clay w-full" />
            </>
          )}
        </div>

        {notice && (
          <Notice type={notice.type} className="mb-4">
            <span className="flex items-center justify-between gap-3">
              {notice.text}
              <button type="button" aria-label="Dismiss" className="cursor-pointer px-2" onClick={() => setNotice(null)}>✕</button>
            </span>
          </Notice>
        )}

        {pageRows.length === 0 ? (
          <Notice className="text-center">{loading ? "Loading visitors…" : "No results found."}</Notice>
        ) : (
          <VisitorTable
            visitors={pageRows}
            busyId={busyId}
            onDetails={setDetails}
            onVerify={verifyPass}
            onApprove={(v) => setStatus(v, "approved")}
            onReject={setRejecting}
          />
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" disabled={page === 1} onClick={() => setView((v) => ({ ...v, page: page - 1 }))} className="btn-soft px-4 py-2.5 text-[13px]">
            Prev
          </button>
          <span className="text-sm font-extrabold">Page {page} of {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setView((v) => ({ ...v, page: page + 1 }))} className="btn-soft px-4 py-2.5 text-[13px]">
            Next
          </button>
        </div>
      </main>

      {details && (
        <Drawer title="Visitor details" onClose={closeDetails}>
          <dl className="grid grid-cols-2 gap-2.5 text-sm">
            {[
              ["Name", details.name],
              ["Email", details.email],
              ["Phone", details.phone],
              ["Host", details.toMeet],
              ["Reason", reasonLabel(details.reason)],
              ["People", groupSize(details) > 1 ? `${groupSize(details)}: ${details.name}, ${details.groupMembers.join(", ")}` : 1],
              ["Visit date", formatDay(details)],
              ["Registered", formatTime(details.createdAt)],
              ["Status", details.status],
              ["Pass ID", details.passId],
              ["Entry", formatTime(details.entryTime)],
              ["Exit", formatTime(details.exitTime)],
            ].map(([label, value]) => (
              <div key={label} className={`tile min-w-0 px-3 py-2.5 ${label === "Email" ? "col-span-2" : ""}`}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
                <dd className="mt-0.5 break-words font-extrabold">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={() => blacklist(details)} className="btn-danger mt-5 w-full py-3 text-sm">Add to blacklist</button>
          {details.email && (
            <a href={`mailto:${details.email}`} className="btn-primary mt-3 block w-full py-3 text-center text-sm">Send email</a>
          )}
        </Drawer>
      )}

      {rejecting && (
        <Drawer title={`Reject ${rejecting.name}`} onClose={closeReject}>
          <textarea
            aria-label="Reason for rejection"
            placeholder="Optional message…"
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            className="input-clay mb-3 min-h-[110px] w-full resize-y"
          />
          <button
            type="button"
            onClick={() => {
              setStatus(rejecting, "rejected", rejectMessage);
              closeReject();
            }}
            className="btn-danger w-full py-3 text-sm"
          >
            Send & reject
          </button>
        </Drawer>
      )}
    </div>
  );
};

export default Admindashboard;
