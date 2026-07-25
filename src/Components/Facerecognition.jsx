import Webcam from "react-webcam";
import { useState, useRef } from "react";
import { API_BASE_URL } from "../config";
import Navbar from "./Navbar";
import { BsFillPersonFill } from "react-icons/bs";
import { MdEmail, MdDateRange } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { TbBrandReason, TbStatusChange } from "react-icons/tb";
import { FaIdCard } from "react-icons/fa6";
import { VscVerifiedFilled, VscError } from "react-icons/vsc";

// Fields shown in the visitor detail card. Centralising this makes it
// trivial to add/remove a row without touching the markup twice.
const DETAIL_FIELDS = [
  { key: "name", label: "Name", icon: BsFillPersonFill },
  { key: "email", label: "Email", icon: MdEmail },
  { key: "phone", label: "Phone", icon: FaPhoneAlt },
  { key: "reason", label: "Reason", icon: TbBrandReason },
  { key: "toMeet", label: "Host", icon: BsFillPersonFill },
  { key: "date", label: "Date", icon: MdDateRange },
  { key: "passId", label: "Pass ID", icon: FaIdCard },
  { key: "status", label: "Status", icon: TbStatusChange },
];

const Facerecognition = () => {
  const [preview, setPreview] = useState("");        // captured frame (base64) for the <img> tag
  const [message, setMessage] = useState("");         // backend message, e.g. "Match found"
  const [similarity, setSimilarity] = useState(null); // % match score
  const [visitor, setVisitor] = useState(null);       // matched visitor record (or null)
  const [status, setStatus] = useState("idle");       // idle | loading | granted | denied
  const [error, setError] = useState("");

  const webcamRef = useRef(null);

  async function verify() {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      setError("Couldn't access the camera. Please allow camera access and try again.");
      return;
    }

    setPreview(screenshot);
    setStatus("loading");
    setError("");

    try {
      const blob = await fetch(screenshot).then((res) => res.blob());
      const file = new File([blob], "face.jpeg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("img", file);

      const response = await fetch(`${API_BASE_URL}/api/visitor/verify-face`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Face verification request failed");

      const data = await response.json();

      setMessage(data.message ?? "");
      setSimilarity(data.similarity ?? null);
      setVisitor(data.visitor ?? null);
      setStatus(data.success ? "granted" : "denied");
    } catch (err) {
      console.error("Error while verifying face:", err);
      setError("Something went wrong while verifying. Please try again.");
      setStatus("idle");
    }
  }

  const hasResult = status === "granted" || status === "denied";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-4 md:pt-8" style={{ animation: "fadeUp .5s ease both" }}>
        <header className="mb-8 text-center">
          <h1 className="font-display text-[26px] font-extrabold tracking-tight md:text-[34px]">
            Face-verified entry
          </h1>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">
            Position your face in the frame and capture to verify your entry pass.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ---------- Camera panel ---------- */}
          <section className="clay rounded-[28px] p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[15px] font-extrabold">Camera</h2>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-[#3FBF7F]" />
                LIVE
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[22px] bg-[#141727]" style={{ boxShadow: "var(--shadow-clay-sm)" }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
              <div className="pointer-events-none absolute inset-4 rounded-2xl border-[1.5px] border-white/10" />
            </div>

            <button
              onClick={verify}
              disabled={status === "loading"}
              className="btn-primary mt-4.5 w-full py-3.5 text-[15px]"
            >
              {status === "loading" ? "Verifying..." : "Capture & Verify"}
            </button>

            {error && (
              <p className="mt-3 rounded-[14px] px-3.5 py-2.5 text-sm font-bold"
                style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}>
                {error}
              </p>
            )}
          </section>

          {/* ---------- Result panel ---------- */}
          <section className="clay rounded-[28px] p-5 sm:p-7">
            <h2 className="font-display mb-4 text-[15px] font-extrabold">Recognition Result</h2>

            {!hasResult && status !== "loading" && (
              <div className="rounded-[20px] border-[1.5px] border-dashed px-6 py-10 text-center text-sm font-semibold text-[var(--muted)]"
                style={{ borderColor: "var(--line)" }}>
                Your verification result will appear here.
              </div>
            )}

            {status === "loading" && (
              <div className="rounded-[20px] border-[1.5px] border-dashed px-6 py-10 text-center text-sm font-semibold text-[var(--muted)]"
                style={{ borderColor: "var(--line)" }}>
                Checking against visitor records...
              </div>
            )}

            {hasResult && (
              <div className="space-y-4" style={{ animation: "fadeUp .35s ease both" }}>
                {/* status banner */}
                <div
                  className="flex items-center gap-3.5 rounded-[18px] px-4.5 py-3.5"
                  style={
                    status === "granted"
                      ? { background: "var(--ok-bg)", color: "var(--ok-fg)" }
                      : { background: "var(--bad-bg)", color: "var(--bad-fg)" }
                  }
                >
                  {status === "granted" ? (
                    <VscVerifiedFilled className="shrink-0 text-2xl" />
                  ) : (
                    <VscError className="shrink-0 text-2xl" />
                  )}
                  <div>
                    <p className="text-[15px] font-extrabold">
                      {status === "granted" ? "Entry Granted" : "Entry Denied"}
                    </p>
                    <p className="text-xs font-semibold opacity-80">
                      {message}
                      {similarity !== null && ` · ${similarity}% match`}
                    </p>
                  </div>
                </div>

                {/* captured frame + details */}
                <div className="flex gap-4">
                  {preview && (
                    <img
                      src={preview}
                      alt="Captured face"
                      className="h-28 w-28 shrink-0 rounded-[20px] object-cover"
                      style={{ boxShadow: "var(--shadow-clay-sm)" }}
                    />
                  )}

                  {visitor ? (
                    <dl className="flex-1 space-y-1.5 text-sm">
                      {DETAIL_FIELDS.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Icon className="shrink-0 text-[var(--muted)]" />
                          <dt className="w-16 shrink-0 font-semibold text-[var(--muted)]">{label}</dt>
                          <dd
                            className={
                              key === "status"
                                ? "font-extrabold capitalize"
                                : "font-semibold"
                            }
                          >
                            {visitor[key] || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="flex-1 self-center text-sm text-[var(--muted)]">
                      No matching visitor record found.
                    </p>
                  )}
                </div>

                {status === "granted" && visitor?.name && (
                  <p className="text-sm text-[var(--muted)]">
                    Welcome, <span className="font-extrabold text-[var(--ink)]">{visitor.name}</span> — your host has been notified.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Facerecognition;
