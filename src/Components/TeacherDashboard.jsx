import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Drawer from "./Drawer";
import LogoutButton from "./LogoutButton";
import NavShell from "./NavShell";
import Notice from "./Notice";
import SlotManager from "./SlotManager";
import { apiFetch } from "../lib/api";
import { clearToken } from "../lib/auth";
import { isPushOn, pushSupported, turnOffPush, turnOnPush } from "../lib/push";
import { appointmentGroup, appointmentNote, formatDay, formatTime, groupSize, reasonLabel, todayLocal, visitDay } from "../lib/visitors";

const REFRESH_MS = 15_000;

const TABS = [
  ["waiting", "Waiting for you", "Nobody is waiting right now."],
  ["today", "Today", "No appointments today."],
  ["upcoming", "Upcoming", "No upcoming appointments."],
  ["past", "Past", "No past appointments."],
];

const NOTE_COLORS = {
  "Needs your answer": { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  Rejected: { background: "var(--bad-bg)", color: "var(--bad-fg)" },
  Approved: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  Completed: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  "Inside now": { background: "var(--ok-bg)", color: "var(--ok-fg)" },
};
const PLAIN = { background: "var(--surface)", color: "var(--muted)" };

// Soonest first, except the past, where the latest comes first.
function byTime(group) {
  const key = (v) => `${visitDay(v)} ${v.visitTime || "99"} ${v.createdAt}`;
  return (a, b) => key(a).localeCompare(key(b)) * (group === "past" ? -1 : 1);
}

async function logout() {
  await turnOffPush().catch(() => {});
  clearToken("teacher");
}

const PushCard = ({ pushKey }) => {
  const [on, setOn] = useState(null); // null while checking
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    isPushOn().then((value) => active && setOn(value), () => active && setOn(false));
    return () => {
      active = false;
    };
  }, []);

  if (on === null || on || !pushKey) return null;
  if (!pushSupported()) {
    return (
      <Notice className="mb-6">
        You'll get an email for every request. For phone notifications on an iPhone, open this page in Safari, tap Share, then Add to Home Screen.
      </Notice>
    );
  }

  const enable = async () => {
    setError("");
    try {
      await turnOnPush(pushKey);
      setOn(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="clay-sm mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] p-4">
      <p className="text-sm font-semibold">Get a notification on this device when someone comes to meet you.</p>
      <button type="button" onClick={enable} className="btn-primary px-5 py-3 text-sm">Turn on notifications</button>
      {error && <Notice type="error" className="w-full">{error}</Notice>}
    </div>
  );
};

const RequestCard = ({ request: v, group, highlighted, busy, onApprove, onReject, onReschedule, onClear }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (highlighted) ref.current.scrollIntoView({ block: "center" });
  }, [highlighted]);

  const note = appointmentNote(v);
  const button = "flex-1 px-2 py-3 text-[13px]";

  return (
    <li
      ref={ref}
      className="clay-sm min-w-0 rounded-[22px] p-4 sm:p-5"
      style={highlighted ? { outline: "3px solid var(--accent)" } : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-extrabold">{v.name}</h3>
        <span className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-extrabold" style={NOTE_COLORS[note] ?? PLAIN}>{note}</span>
      </div>
      <dl className="mb-4 grid grid-cols-2 gap-2 text-[13px]">
        {[
          ["Visit", `${formatDay(v)}${v.visitTime ? `, ${v.visitTime}` : ""}`],
          ["Reason", reasonLabel(v.reason)],
          ...(groupSize(v) > 1 ? [["Group", `${groupSize(v)} people, with ${v.groupMembers.join(", ")}`]] : []),
          ["Phone", v.phone],
          ["Registered", formatTime(v.createdAt)],
          ...(v.entryTime ? [["Entry", formatTime(v.entryTime)], ["Exit", formatTime(v.exitTime)]] : []),
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[var(--muted)]">{label}</dt>
            <dd className="break-words font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        {group === "past" ? (
          <>
            {!v.entryTime && (
              <button type="button" disabled={busy} onClick={() => onReschedule(v)} className={`btn-soft ${button}`}>Give a new time</button>
            )}
            <button type="button" disabled={busy} onClick={() => onClear([v._id])} className={`btn-soft ${button}`}>Clear</button>
          </>
        ) : note === "Inside now" ? null : (
          <>
            {v.status === "verified" && (
              <button type="button" disabled={busy} onClick={() => onApprove(v)} className={`btn-ok ${button}`}>Approve</button>
            )}
            <button type="button" disabled={busy} onClick={() => onReject(v)} className={`btn-danger ${button}`}>Reject</button>
            <button type="button" disabled={busy} onClick={() => onReschedule(v)} className={`btn-soft ${button}`}>Reschedule</button>
          </>
        )}
      </div>
    </li>
  );
};

const TeacherDashboard = () => {
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [drawer, setDrawer] = useState(null); // { type: "reject" | "reschedule", visitor }
  const [message, setMessage] = useState("");
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [chosen, setChosen] = useState(null); // { tab, requestId }
  const [confirmClear, setConfirmClear] = useState(false);
  const [params] = useSearchParams();
  const changes = useRef(0);
  const requestId = params.get("request");

  const refresh = useCallback(async () => {
    const before = changes.current;
    try {
      const list = await apiFetch("/api/teacher/requests", { auth: "teacher" });
      if (before === changes.current) setRequests(list);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh, requestId]);

  useEffect(() => {
    apiFetch("/api/teacher/me", { auth: "teacher" }).then(setMe, (err) => setError(err.message));
  }, []);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  async function decide(visitor, action, body, done) {
    setBusyId(visitor._id);
    setDrawer(null);
    try {
      const updated = await apiFetch(`/api/teacher/requests/${visitor._id}/${action}`, { method: "POST", body, auth: "teacher" });
      changes.current += 1;
      setRequests((list) => list.map((v) => (v._id === updated._id ? updated : v)));
      setNotice({ type: "success", text: `${visitor.name} ${done}. An email is on its way to them.` });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  const openDrawer = (type) => (visitor) => {
    setMessage("");
    setSlot({ date: visitDay(visitor) >= todayLocal() ? visitDay(visitor) : todayLocal(), time: visitor.visitTime || "" });
    setDrawer({ type, visitor });
  };

  async function clear(ids) {
    setConfirmClear(false);
    setBusyId("clear");
    try {
      const { cleared } = await apiFetch("/api/teacher/requests/clear", { method: "POST", body: { ids }, auth: "teacher" });
      changes.current += 1;
      await refresh();
      setNotice({ type: "success", text: `${cleared} cleared from your list. The admin still has the record.` });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  const groups = { waiting: [], today: [], upcoming: [], past: [] };
  for (const v of requests ?? []) groups[appointmentGroup(v)].push(v);
  for (const name of Object.keys(groups)) groups[name].sort(byTime(name));

  // A tapped notification opens the tab its request is in, until another tab is chosen.
  const linked = requests?.find((v) => v._id === requestId);
  const tab = chosen?.requestId === requestId ? chosen.tab : linked ? appointmentGroup(linked) : "waiting";
  const rows = groups[tab];
  const emptyText = TABS.find(([name]) => name === tab)[2];

  return (
    <div className="min-h-screen">
      <NavShell home="/TeacherDashboard" links={[]}>
        <LogoutButton onLogout={logout} />
      </NavShell>
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">
          {me ? `Hello, ${me.name}` : "Your visitors"}
        </h1>
        <p className="mb-6 text-[13.5px] text-[var(--muted)]">New requests appear here by themselves.</p>

        {me && <PushCard pushKey={me.pushKey} />}
        {error && <Notice type="error" className="mb-5">{error}</Notice>}
        {notice && <Notice type={notice.type} className="mb-5">{notice.text}</Notice>}

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TABS.map(([name, label]) => (
            <button
              key={name}
              type="button"
              aria-pressed={tab === name}
              onClick={() => {
                setChosen({ tab: name, requestId });
                setConfirmClear(false);
              }}
              className="clay-sm cursor-pointer rounded-[22px] p-4 text-left"
              style={tab === name ? { outline: "3px solid var(--accent)" } : undefined}
            >
              <span className="block text-[13px] font-bold text-[var(--muted)]">{label}</span>
              <span className="font-display text-[28px] font-extrabold leading-tight">{requests ? groups[name].length : "…"}</span>
            </button>
          ))}
        </div>

        {tab === "past" && rows.length > 0 && (
          <div className="mb-5">
            {!confirmClear ? (
              <button type="button" disabled={Boolean(busyId)} onClick={() => setConfirmClear(true)} className="btn-soft px-5 py-3 text-sm">
                Clear all past appointments
              </button>
            ) : (
              <div className="rounded-[18px] p-4" style={{ background: "var(--warn-bg)", color: "var(--warn-fg)" }}>
                <p className="mb-3 text-sm font-bold">Clear {rows.length} from your list? The admin keeps the records.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => clear(rows.map((v) => v._id))} className="btn-danger px-5 py-3 text-sm">Yes, clear</button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="btn-soft px-5 py-3 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {rows.length === 0 ? (
          <Notice className="text-center">{requests || error ? emptyText : "Loading…"}</Notice>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((v, i) => (
              <Fragment key={v._id}>
                {tab === "upcoming" && visitDay(v) !== visitDay(rows[i - 1] ?? {}) && (
                  <li className="font-display text-base font-extrabold sm:col-span-2">{formatDay(v)}</li>
                )}
                <RequestCard
                  request={v}
                  group={tab}
                  highlighted={v._id === requestId}
                  busy={busyId === v._id || busyId === "clear"}
                  onApprove={(x) => decide(x, "approve", undefined, "approved")}
                  onReject={openDrawer("reject")}
                  onReschedule={openDrawer("reschedule")}
                  onClear={clear}
                />
              </Fragment>
            ))}
          </ul>
        )}
        <section className="clay mt-8 rounded-[26px] p-4 sm:p-6">
          <h2 className="font-display mb-1 text-lg font-extrabold">My free times</h2>
          <p className="mb-4 text-[13px] text-[var(--muted)]">On days with free times, visitors must choose one. On other days they can ask for any time.</p>
          <SlotManager api="/api/teacher/slots" auth="teacher" />
        </section>
      </main>

      {drawer?.type === "reject" && (
        <Drawer title={`Reject ${drawer.visitor.name}`} onClose={closeDrawer}>
          <textarea aria-label="Reason" maxLength={500} placeholder="Optional message to the visitor…" value={message} onChange={(e) => setMessage(e.target.value)} className="input-clay mb-3 min-h-[110px] w-full resize-y" />
          <button type="button" onClick={() => decide(drawer.visitor, "reject", { message }, "rejected")} className="btn-danger w-full py-3 text-sm">Send & reject</button>
        </Drawer>
      )}

      {drawer?.type === "reschedule" && (
        <Drawer title={`Reschedule ${drawer.visitor.name}`} onClose={closeDrawer}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              decide(drawer.visitor, "reschedule", slot, "rescheduled");
            }}
          >
            <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="new-date">New date</label>
            <input id="new-date" type="date" required min={todayLocal()} value={slot.date} onChange={(e) => setSlot((s) => ({ ...s, date: e.target.value }))} className="input-clay mb-4 w-full" />
            <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="new-time">New time</label>
            <input id="new-time" type="time" required value={slot.time} onChange={(e) => setSlot((s) => ({ ...s, time: e.target.value }))} className="input-clay mb-4 w-full" />
            <p className="mb-4 text-[13px] text-[var(--muted)]">The visit is approved for the new time, and the visitor gets an email.</p>
            <button className="btn-primary w-full py-3 text-sm">Send new time</button>
          </form>
        </Drawer>
      )}
    </div>
  );
};

export default TeacherDashboard;
