import { useCallback, useEffect, useState } from "react";
import Adminnavbar from "./Adminnavbar";
import LogoutButton from "./LogoutButton";
import NavShell from "./NavShell";
import Notice from "./Notice";
import Overstays from "./Overstays";
import QrScanner from "./QrScanner";
import ServiceBanner from "./ServiceBanner";
import StatusBadge from "./StatusBadge";
import { apiFetch, fetchImage } from "../lib/api";
import { clearToken, isLoggedIn } from "../lib/auth";
import { beep } from "../lib/beep";
import { formatDay, formatTime, groupSize, isInside, reasonLabel } from "../lib/visitors";

const REFRESH_MS = 20_000;
const FACE_LINK = [{ to: "/Facerecognition", label: "Face scan" }];

const Photo = ({ id, role }) => {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    let made = "";
    fetchImage(`/api/gate/photo/${id}`, role).then(
      (u) => {
        made = u;
        if (active) setUrl(u);
        else URL.revokeObjectURL(u);
      },
      () => {},
    );
    return () => {
      active = false;
      URL.revokeObjectURL(made);
    };
  }, [id, role]);

  if (!url) return null;
  return <img src={url} alt="Registration" className="h-40 w-32 shrink-0 rounded-[18px] object-cover" />;
};

const Result = ({ result, role, busy, onConfirm, onNext }) => {
  const { allowed, action, message, code, hasPhoto, visitor: v, done } = result;
  const good = allowed || done;

  return (
    <div aria-live="assertive">
      <div
        className="mb-4 rounded-[18px] px-5 py-4 text-lg font-extrabold"
        style={good ? { background: "var(--ok-bg)", color: "var(--ok-fg)" } : { background: "var(--bad-bg)", color: "var(--bad-fg)" }}
      >
        {done ? (action === "exit" ? "Exit recorded" : "Entry recorded") : message}
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        {hasPhoto && <Photo id={v._id} role={role} />}
        <dl className="grid min-w-0 flex-1 grid-cols-2 content-start gap-2 text-sm">
          {[
            ["Name", v.name],
            ["Meeting", v.toMeet],
            ["Visit", `${formatDay(v)}${v.visitTime ? `, ${v.visitTime}` : ""}`],
            ["People", groupSize(v)],
            ["Reason", reasonLabel(v.reason)],
            ["Pass ID", v.passId],
            ["Entry", formatTime(v.entryTime)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[13px] text-[var(--muted)]">{label}</dt>
              <dd className="break-words font-bold">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {v.groupMembers?.length > 0 && (
        <Notice className="mb-4">
          Group of {groupSize(v)}. With {v.name}: {v.groupMembers.join(", ")}
        </Notice>
      )}
      {!done && allowed && action === "entry" && (
        <p className="mb-4 text-[13px] text-[var(--muted)]">
          {hasPhoto ? "Check that the photo matches the person." : "There is no photo for this visitor, so check their ID."}
        </p>
      )}
      {code === "blacklisted" && !done && <Notice type="error" className="mb-4">This alert is saved in the activity history.</Notice>}

      <div className="flex gap-3">
        {!done && allowed && (
          <button type="button" disabled={busy} onClick={onConfirm} className="btn-primary flex-1 py-3.5 text-[15px]">
            {busy ? "Saving…" : action === "exit" ? "Record exit" : "Let in"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={onNext} className="btn-soft flex-1 py-3.5 text-[15px]">
          {done ? "Next visitor" : "Cancel"}
        </button>
      </div>
    </div>
  );
};

const Gate = () => {
  // A guard's own sign-in comes first; the admin can work here as well.
  const [role] = useState(() => (isLoggedIn("guard") ? "guard" : "admin"));
  const auth = role === "admin" ? true : role;
  const [today, setToday] = useState(null);
  const [passId, setPassId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const loadToday = useCallback(async () => {
    try {
      setToday(await apiFetch("/api/gate/today", { auth }));
      setListError("");
    } catch (err) {
      setListError(err.message);
    }
  }, [auth]);

  useEffect(() => {
    const first = setTimeout(loadToday, 0);
    const timer = setInterval(loadToday, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [loadToday]);

  const scan = useCallback(
    async (text) => {
      setError("");
      setBusy(true);
      try {
        const found = await apiFetch("/api/gate/scan", { method: "POST", body: { passId: text }, auth });
        beep(found.allowed);
        setResult(found);
        setPassId("");
      } catch (err) {
        beep(false);
        setError(err.message);
        setScanKey((k) => k + 1); // look for the next code
      } finally {
        setBusy(false);
      }
    },
    [auth],
  );

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const { visitor } = await apiFetch("/api/gate/confirm", {
        method: "POST",
        body: { id: result.visitor._id, action: result.action },
        auth,
      });
      setResult((r) => ({ ...r, visitor, done: true }));
      loadToday();
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const next = () => {
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen">
      {role === "admin" ? (
        <Adminnavbar />
      ) : (
        <NavShell home="/Gate" links={FACE_LINK}>
          <LogoutButton onLogout={() => clearToken("guard")} />
        </NavShell>
      )}
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-2">
        <h1 className="font-display mb-6 text-2xl font-extrabold tracking-tight sm:text-[28px]">Gate</h1>
        <ServiceBanner />
        <Overstays role={role} onChange={loadToday} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="clay min-w-0 rounded-[28px] p-5 sm:p-7">
            <h2 className="font-display mb-4 text-lg font-extrabold">Check a pass</h2>
            {error && <Notice type="error" className="mb-4">{error}</Notice>}
            {result ? (
              <Result result={result} role={role} busy={busy} onConfirm={confirm} onNext={next} />
            ) : (
              <>
                <QrScanner key={scanKey} role={role} onCode={scan} />
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    scan(passId);
                  }}
                >
                  <input aria-label="Pass ID" inputMode="numeric" placeholder="Or type the Pass ID" value={passId} onChange={(e) => setPassId(e.target.value)} className="input-clay w-full min-w-0" required />
                  <button disabled={busy} className="btn-primary px-6 text-sm">Check</button>
                </form>
              </>
            )}
          </section>

          <section className="clay min-w-0 rounded-[28px] p-5 sm:p-7">
            <h2 className="font-display mb-4 text-lg font-extrabold">Today and inside{today ? ` (${today.length})` : ""}</h2>
            {listError && <Notice type="error" className="mb-4">{listError}</Notice>}
            {!today?.length && !listError && <Notice className="text-center">{today ? "No visitors today." : "Loading…"}</Notice>}
            <ul className="grid gap-2.5">
              {today?.map((v) => (
                <li key={v._id} className="tile flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="break-words font-extrabold">{v.name}{groupSize(v) > 1 && ` + ${groupSize(v) - 1}`}</p>
                    <p className="text-[13px] text-[var(--muted)]">
                      {v.toMeet || "—"}{v.visitTime ? ` · ${v.visitTime}` : ""}
                      {isInside(v) ? ` · inside since ${formatTime(v.entryTime)}` : v.exitTime ? " · left" : ""}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Gate;
