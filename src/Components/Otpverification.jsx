import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { QRCode } from "react-qr-code";
import Navbar from "./Navbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { formatDay } from "../lib/visitors";
import { downloadPassPdf } from "../lib/passPdf";
import { loadRegistration, saveRegistration } from "../lib/registration";

const Otpverification = () => {
  const [registration, setRegistration] = useState(loadRegistration);

  if (!registration?.visitorId) return <Navigate to="/Visitor" replace />;

  const update = (changes) => {
    const next = { ...registration, ...changes };
    saveRegistration(next);
    setRegistration(next);
  };

  return <OtpForm registration={registration} update={update} />;
};

const OtpForm = ({ registration, update }) => {
  const { visitorId, email, verified, resendAt, showPass } = registration;
  const approver = registration.teacherId ? registration.toMeet : "the admin";
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(verified ? null : registration.notice);
  const [busy, setBusy] = useState(""); // "" | "verify" | "resend" | "pdf"
  const [now, setNow] = useState(() => Date.now());
  const qrRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function run(name, action) {
    if (busy) return;
    setBusy(name);
    try {
      await action();
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setBusy("");
    }
  }

  const resend = () =>
    run("resend", async () => {
      const data = await apiFetch("/api/visitor/send-otp", { method: "POST", body: { visitorId } });
      setNow(Date.now());
      update({ resendAt: Date.now() + data.resendAfter * 1000 });
      setOtp("");
      setMessage({ text: data.message, type: "success" });
    });

  const verify = (e) => {
    e.preventDefault();
    run("verify", async () => {
      const data = await apiFetch("/api/visitor/verify-otp", { method: "POST", body: { visitorId, otp } });
      const lostTime = Boolean(registration.visitTime) && !data.visitTime;
      update({ verified: true, visitTime: data.visitTime });
      setMessage({
        text: lostTime
          ? data.message
          : registration.teacherId
            ? `OTP verified. ${registration.toMeet} has been told, and you'll get an email with the answer.`
            : "OTP verified. Your request is with the admin, and you'll get an email with the answer.",
        type: lostTime ? "warn" : "success",
      });
    });
  };

  const instantVisit = () => {
    update({ showPass: true, issuedAt: registration.issuedAt || new Date().toLocaleString("en-IN") });
    setMessage({ text: "Pass generated successfully.", type: "success" });
  };

  const bookVisit = () => setMessage({ text: `Request sent. Waiting for ${approver} to approve.`, type: "info" });

  const rows = [
    ["Organization", registration.org],
    ["Name", registration.name],
    ["Email", email],
    ["Phone", registration.phone],
    ["To meet", registration.toMeet],
    ...(registration.groupMembers?.length ? [["Group", `${registration.groupMembers.length + 1} people`]] : []),
    ["Visit", [formatDay(registration), registration.visitTime].filter(Boolean).join(", ")],
    ["Issued", registration.issuedAt],
  ];

  const downloadPass = () =>
    run("pdf", () => downloadPassPdf({ rows, passId: registration.passId, qrSvg: qrRef.current.querySelector("svg") }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-[520px] px-4 pb-16 pt-6 sm:pt-12" style={{ animation: "fadeUp .5s ease both" }}>
        <div className="clay rounded-[28px] p-5 sm:p-9">
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">
            {verified ? "Email verified" : "OTP verification"}
          </h1>
          <p className="mb-6 break-words text-[14.5px] leading-relaxed text-[var(--muted)]">
            {verified ? "Choose how you would like to visit." : `Enter the 4-digit code sent to ${email}. It is valid for 5 minutes.`}
          </p>

          {!verified && (
            <form onSubmit={verify} className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setMessage(null);
                }}
                aria-label="OTP"
                placeholder="0000"
                className="input-clay w-full min-w-0 text-center text-lg font-bold tracking-[.35em]"
              />
              <button disabled={otp.length !== 4 || Boolean(busy)} className="btn-primary shrink-0 px-6 py-3 text-sm">
                {busy === "verify" ? "Verifying…" : "Verify"}
              </button>
            </form>
          )}

          {message && <Notice type={message.type} className="mb-5 text-center">{message.text}</Notice>}

          {!verified &&
            (secondsLeft > 0 ? (
              <p className="text-[13.5px] text-[var(--muted)]">
                Resend available in <strong className="text-[var(--ink)]">{secondsLeft}s</strong>
              </p>
            ) : (
              <button type="button" onClick={resend} disabled={Boolean(busy)} className="btn-soft w-full py-3 text-sm">
                {busy === "resend" ? "Sending…" : "Didn't get the code? Resend OTP"}
              </button>
            ))}

          {verified && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={instantVisit} className="btn-primary flex-1 py-3 text-sm">Instant visit</button>
                <button type="button" onClick={bookVisit} className="btn-soft flex-1 py-3 text-sm">Book visit</button>
              </div>
              <p className="mt-3 text-center text-[12.5px] text-[var(--muted)]">
                Instant visit issues your pass now · Book visit waits for {approver} to approve.
              </p>
            </>
          )}

          {verified && showPass && (
            <section className="clay mt-6 rounded-[24px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-[13px] font-extrabold tracking-[.14em] text-[var(--muted)]">VISITOR PASS</h2>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}>
                  VERIFIED
                </span>
              </div>
              <dl className="mb-4 grid gap-2.5 text-[13px] sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="tile min-w-0 px-3 py-2.5">
                    <dt className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
                    <dd className="mt-0.5 break-words font-extrabold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="font-display mb-3 text-lg font-extrabold">Pass ID: {registration.passId}</p>
              <div ref={qrRef} className="flex justify-center rounded-[18px] bg-white p-4">
                <QRCode value={registration.passId} size={130} />
              </div>
              <button type="button" onClick={downloadPass} disabled={Boolean(busy)} className="btn-primary mt-4 w-full py-3.5 text-sm">
                {busy === "pdf" ? "Preparing…" : "Download pass"}
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Otpverification;
