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
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
            Visitor Face Verification
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Position your face in the frame and capture to verify your entry pass.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ---------- Camera panel ---------- */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Camera
            </h2>

            <div className="overflow-hidden rounded-xl bg-slate-900">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
            </div>

            <button
              onClick={verify}
              disabled={status === "loading"}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {status === "loading" ? "Verifying..." : "Capture & Verify"}
            </button>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </section>

          {/* ---------- Result panel ---------- */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recognition Result
            </h2>

            {!hasResult && status !== "loading" && (
              <p className="text-sm text-slate-400">
                Your verification result will appear here.
              </p>
            )}

            {status === "loading" && (
              <p className="text-sm text-slate-400">Checking against visitor records...</p>
            )}

            {hasResult && (
              <div className="space-y-4">
                {/* status banner */}
                <div
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    status === "granted"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {status === "granted" ? (
                    <VscVerifiedFilled className="shrink-0 text-2xl" />
                  ) : (
                    <VscError className="shrink-0 text-2xl" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {status === "granted" ? "Entry Granted" : "Entry Denied"}
                    </p>
                    <p className="text-xs opacity-80">
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
                      className="h-28 w-28 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  )}

                  {visitor ? (
                    <dl className="flex-1 space-y-1.5 text-sm">
                      {DETAIL_FIELDS.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Icon className="shrink-0 text-slate-400" />
                          <dt className="w-16 shrink-0 text-slate-500">{label}</dt>
                          <dd
                            className={
                              key === "status"
                                ? "font-medium capitalize text-slate-700"
                                : "text-slate-700"
                            }
                          >
                            {visitor[key] || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="flex-1 self-center text-sm text-slate-400">
                      No matching visitor record found.
                    </p>
                  )}
                </div>

                {status === "granted" && visitor?.name && (
                  <p className="text-sm text-slate-500">
                    Welcome, <span className="font-medium text-slate-700">{visitor.name}</span>!
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
