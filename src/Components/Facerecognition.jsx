import { useState } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { FaPhoneAlt } from "react-icons/fa";
import { FaIdCard } from "react-icons/fa6";
import { MdDateRange, MdEmail } from "react-icons/md";
import { TbBrandReason, TbStatusChange } from "react-icons/tb";
import { VscError, VscVerifiedFilled } from "react-icons/vsc";
import Navbar from "./Navbar";
import CameraCapture from "./CameraCapture";
import Notice from "./Notice";
import ServiceBanner from "./ServiceBanner";
import { apiFetch } from "../lib/api";
import { formatDay, reasonLabel } from "../lib/visitors";

const DETAILS = [
  ["Name", BsFillPersonFill, (v) => v.name],
  ["Email", MdEmail, (v) => v.email],
  ["Phone", FaPhoneAlt, (v) => v.phone],
  ["Reason", TbBrandReason, (v) => reasonLabel(v.reason)],
  ["Host", BsFillPersonFill, (v) => v.toMeet],
  ["Date", MdDateRange, formatDay],
  ["Pass ID", FaIdCard, (v) => v.passId],
  ["Status", TbStatusChange, (v) => v.status],
];

const Facerecognition = () => {
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify({ file, dataUrl }) {
    setPreview(dataUrl);
    setResult(null);
    setError("");
    setLoading(true);
    try {
      const body = new FormData();
      body.append("img", file);
      setResult(await apiFetch("/api/visitor/verify-face", { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const granted = result?.success;
  const title = !granted ? "Entry denied" : result.entryStatus === "exit" ? "Exit recorded" : "Entry granted";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-4 md:pt-8" style={{ animation: "fadeUp .5s ease both" }}>
        <header className="mb-8 text-center">
          <h1 className="font-display text-[26px] font-extrabold tracking-tight md:text-[34px]">Face-verified entry</h1>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">
            Make sure only one person is in the frame, then capture to verify the entry pass.
          </p>
        </header>
        <ServiceBanner />

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          <section className="clay min-w-0 rounded-[28px] p-5 sm:p-7">
            <h2 className="font-display mb-4 text-[15px] font-extrabold">Camera</h2>
            <CameraCapture label="Capture & verify" busyLabel="Verifying…" busy={loading} onCapture={verify} />
          </section>

          <section className="clay min-w-0 rounded-[28px] p-5 sm:p-7" aria-live="polite">
            <h2 className="font-display mb-4 text-[15px] font-extrabold">Recognition result</h2>

            {error && <Notice type="error" className="mb-4">{error}</Notice>}

            {!result && !error && (
              <div className="rounded-[20px] border-[1.5px] border-dashed border-[var(--line)] px-6 py-10 text-center text-sm font-semibold text-[var(--muted)]">
                {loading ? "Checking against visitor records…" : "Your verification result will appear here."}
              </div>
            )}

            {result && (
              <div className="space-y-4" style={{ animation: "fadeUp .35s ease both" }}>
                <div
                  className="flex items-center gap-3.5 rounded-[18px] px-4.5 py-3.5"
                  style={granted ? { background: "var(--ok-bg)", color: "var(--ok-fg)" } : { background: "var(--bad-bg)", color: "var(--bad-fg)" }}
                >
                  {granted ? <VscVerifiedFilled className="shrink-0 text-2xl" /> : <VscError className="shrink-0 text-2xl" />}
                  <div>
                    <p className="text-[15px] font-extrabold">{title}</p>
                    <p className="text-xs font-semibold">
                      {result.message}
                      {result.similarity != null && ` · ${result.similarity}% match`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row md:flex-col lg:flex-row">
                  {preview && <img src={preview} alt="Captured face" className="h-28 w-28 shrink-0 rounded-[20px] object-cover" />}
                  {result.visitor ? (
                    <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
                      {DETAILS.map(([label, Icon, get]) => (
                        <div key={label} className="flex items-start gap-2">
                          <Icon className="mt-0.5 shrink-0 text-[var(--muted)]" />
                          <dt className="w-16 shrink-0 font-semibold text-[var(--muted)]">{label}</dt>
                          <dd className={`min-w-0 break-words font-semibold ${label === "Status" ? "capitalize" : ""}`}>
                            {get(result.visitor) || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">No visitor details are available for this capture.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Facerecognition;
