import { useCallback, useState } from "react";
import { MdDownload, MdEventAvailable, MdLogin, MdOutlinePendingActions } from "react-icons/md";
import { RiCloseCircleFill, RiCheckboxCircleFill, RiGroupFill } from "react-icons/ri";
import Adminnavbar from "./Adminnavbar";
import DashboardCharts from "./DashboardCharts";
import Drawer from "./Drawer";
import Notice from "./Notice";
import Overstays from "./Overstays";
import VisitorTable from "./VisitorTable";
import { useFitRows } from "../hooks/useFitRows";
import { useVisitors } from "../hooks/useVisitors";
import { apiFetch } from "../lib/api";
import { downloadCsv } from "../lib/csv";
import { formatDay, formatTime, groupSize, isInside, needsAdmin, reasonLabel, STATUSES, todayLocal, visitDay } from "../lib/visitors";

// On a laptop the page shows as many rows as fit, so it does not scroll.
const ROWS = { rowHeight: 51, headHeight: 36, normal: 5, isOn: "(min-width: 1024px) and (min-height: 600px)" };
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
  const [tableRef, perPage] = useFitRows(ROWS);
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
  const totalPages = Math.max(1, Math.ceil(selected.length / perPage));
  const page = Math.min(view.page, totalPages);
  const pageRows = selected.slice((page - 1) * perPage, page * perPage);
  const inside = visitors.filter(isInside);
  const waiting = visitors.filter(needsAdmin);
  const count = (status) => visitors.filter((v) => v.status === status).length;

  const cards = [
    ["People inside now", inside.reduce((n, v) => n + groupSize(v), 0), MdLogin, "ok", "inside"],
    ["Pending requests", count("pending"), MdOutlinePendingActions, "warn", "pending"],
    ["Total visits", visitors.length, RiGroupFill, "accent", "all"],
    ["Approved", count("approved"), RiCheckboxCircleFill, "ok", "approved"],
    ["Rejected", count("rejected"), RiCloseCircleFill, "bad", "rejected"],
    ["Today's visits", visitors.filter((v) => visitDay(v) === todayLocal()).length, MdEventAvailable, "accent", "today"],
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
    <div className="flex min-h-screen flex-col fit:h-dvh fit:overflow-hidden">
      <Adminnavbar />
      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 px-4 pb-4 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display mr-auto text-xl font-extrabold tracking-tight sm:text-2xl">Visitor dashboard</h1>
          <Overstays compact role="admin" onChange={refresh} />
          {waiting.length > 0 && (
            <button
              type="button"
              title="The person they want to meet is not in the teacher list"
              onClick={() => setView({ ...DEFAULT_VIEW, filter: "admin" })}
              className="min-h-10 cursor-pointer rounded-full px-4 text-[13px] font-extrabold"
              style={TONES.accent}
            >
              Waiting for admin ({waiting.length})
            </button>
          )}
        </div>
        {error && <Notice type="error">{error}</Notice>}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map(([label, value, Icon, tone, filter]) => (
            <button
              key={label}
              type="button"
              aria-pressed={view.filter === filter}
              onClick={() => setView({ ...DEFAULT_VIEW, filter })}
              className="clay-sm flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[18px] px-3 py-2.5 text-left transition hover:-translate-y-0.5"
              style={view.filter === filter ? { outline: "2px solid var(--accent)" } : undefined}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={TONES[tone]}>
                <Icon aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="font-display block text-xl font-extrabold leading-none">{loading ? "…" : value}</span>
                <span className="block text-[12px] font-bold leading-tight text-[var(--muted)]">{label}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="flex min-h-0 min-w-0 flex-col gap-2.5 lg:rounded-[22px] lg:border lg:border-[var(--glass-line)] lg:bg-[var(--card)] lg:p-4 lg:shadow-[var(--shadow-clay)]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display w-full text-[15px] font-extrabold sm:w-auto">Visitors ({selected.length})</h2>
              <input type="search" aria-label="Search by name" placeholder="Search name…" value={view.search} onChange={change("search")} className="input-clay input-slim min-w-0 flex-[2_1_110px]" />
              <select aria-label="Filter" value={view.filter} onChange={change("filter")} className="input-clay input-slim min-w-0 flex-[1_1_128px] capitalize">
                <option value="all">All visitors</option>
                <option value="inside">Inside now</option>
                <option value="admin">Waiting for admin</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="today">Today</option>
                <option value="range">Date range</option>
              </select>
              <select aria-label="Sort" value={view.sort} onChange={change("sort")} className="input-clay input-slim min-w-0 flex-[1_1_122px]">
                <option value="latest">Latest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              {view.filter === "range" && (
                <>
                  <input type="date" aria-label="From date" value={view.from} onChange={change("from")} className="input-clay input-slim min-w-0 flex-[1_1_130px]" />
                  <input type="date" aria-label="To date" value={view.to} onChange={change("to")} className="input-clay input-slim min-w-0 flex-[1_1_130px]" />
                </>
              )}
              <form
                className="flex flex-[1_1_150px] gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyPass(passId);
                }}
              >
                <input aria-label="Pass ID" inputMode="numeric" placeholder="Pass ID" value={passId} onChange={(e) => setPassId(e.target.value)} className="input-clay input-slim w-full min-w-[84px] px-3" />
                <button className="btn-primary rounded-[13px] px-3 text-[13px]">Verify</button>
              </form>
              <button type="button" aria-label="Download CSV" title="Download this list for Excel" onClick={() => downloadCsv(selected)} disabled={selected.length === 0} className="btn-soft flex items-center gap-1.5 rounded-[13px] px-3 text-[13px]">
                <MdDownload aria-hidden="true" /> CSV
              </button>
            </div>

            {notice && (
              <Notice type={notice.type}>
                <span className="flex items-center justify-between gap-3">
                  {notice.text}
                  <button type="button" aria-label="Dismiss" className="cursor-pointer px-2" onClick={() => setNotice(null)}>✕</button>
                </span>
              </Notice>
            )}

            <div ref={tableRef} className="min-h-0 flex-1 fit:overflow-hidden">
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
            </div>

            <div className="flex items-center justify-center gap-3">
              <button type="button" disabled={page === 1} onClick={() => setView((v) => ({ ...v, page: page - 1 }))} className="btn-soft rounded-[13px] px-4 text-[13px]">
                Prev
              </button>
              <span className="text-[13px] font-extrabold">Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setView((v) => ({ ...v, page: page + 1 }))} className="btn-soft rounded-[13px] px-4 text-[13px]">
                Next
              </button>
            </div>
          </section>

          <aside className="grid min-h-0 gap-3 sm:grid-cols-2 lg:grid-cols-1 fit:grid-rows-[auto_minmax(0,1fr)_minmax(0,.9fr)]">
            <DashboardCharts visitors={visitors} />
            <section className="clay flex min-h-0 min-w-0 flex-col rounded-[22px] p-4 sm:col-span-2 lg:col-span-1">
              <h2 className="font-display mb-2 text-[15px] font-extrabold">Inside now{inside.length > 0 && ` (${inside.length})`}</h2>
              {inside.length === 0 ? (
                <p className="text-[13px] text-[var(--muted)]">{loading ? "Loading…" : "Nobody is inside right now."}</p>
              ) : (
                <ul className="grid min-h-0 max-h-56 content-start gap-2 overflow-y-auto fit:max-h-none fit:flex-1">
                  {inside.map((v) => (
                    <li key={v._id} className="min-w-0 border-b border-[var(--line)] pb-1.5 text-[13px] last:border-0">
                      <b className="block truncate">{v.name}{groupSize(v) > 1 && ` + ${groupSize(v) - 1}`}</b>
                      <span className="block truncate text-[12px] text-[var(--muted)]">{v.toMeet || "—"} · since {formatTime(v.entryTime)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
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
              <div key={label} className={`tile min-w-0 px-3 py-2.5 ${label === "Email" || label === "Name" ? "col-span-2" : ""}`}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
                <dd className={`mt-0.5 break-words font-extrabold ${label === "Status" ? "capitalize" : ""}`}>{value || "—"}</dd>
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
