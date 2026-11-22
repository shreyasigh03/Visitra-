import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";

// The liveness model expects a 3:4 portrait frame.
const VIDEO = {
  width: { ideal: 480 },
  height: { ideal: 640 },
  aspectRatio: { ideal: 0.75 },
  facingMode: "user",
};
const PAUSE_MS = 150;
const GIVE_UP_MS = 25_000; // the online check can be slow the first time
const GOOD_IN_A_ROW = 2; // one lucky frame is not enough

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function toFile(dataUrl) {
  const blob = await fetch(dataUrl).then((res) => res.blob());
  return new File([blob], "face.jpg", { type: "image/jpeg" });
}

async function check(file) {
  const body = new FormData();
  body.append("img", file);
  return apiFetch("/api/visitor/check-face", { method: "POST", body });
}

// One tap: shows what to change and takes the photo by itself once it is good.
const CameraCapture = ({ onCapture, label, busyLabel, busy = false, className = "btn-primary" }) => {
  const webcamRef = useRef(null);
  const runRef = useRef(0); // a new number stops the search that is running
  const [ready, setReady] = useState(false);
  const [looking, setLooking] = useState(false);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      runRef.current = -1;
    },
    [],
  );

  function stop() {
    runRef.current += 1;
    setLooking(false);
    setHint("");
  }

  async function capture() {
    const run = ++runRef.current;
    const active = () => runRef.current === run;
    const giveUpAt = Date.now() + GIVE_UP_MS;
    let good = 0;
    let advice = "";
    setError("");
    setLooking(true);
    setHint("Look straight at the camera");
    try {
      while (Date.now() < giveUpAt) {
        const dataUrl = webcamRef.current?.getScreenshot();
        if (dataUrl) {
          const file = await toFile(dataUrl);
          const { success, message } = await check(file);
          if (!active()) return;
          good = success ? good + 1 : 0;
          if (good === GOOD_IN_A_ROW) {
            stop();
            onCapture({ file, dataUrl });
            return;
          }
          if (message) advice = message;
          setHint(success ? "Perfect, hold still" : message);
        }
        await wait(PAUSE_MS);
        if (!active()) return;
      }
      setError(`${advice || "The camera is not ready yet."} Then tap the button again.`);
    } catch (err) {
      if (active()) setError(err.message);
    }
    if (active()) stop();
  }

  const good = hint.startsWith("Perfect");

  return (
    <>
      <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-[20px] bg-[#141727]" style={{ boxShadow: "var(--shadow-clay-sm)" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          forceScreenshotSourceSize
          videoConstraints={VIDEO}
          onUserMedia={() => {
            setReady(true);
            setError("");
          }}
          onUserMediaError={() =>
            setError("Camera access was blocked. Allow the camera for this site in your browser, then reload the page.")
          }
          className="w-full -scale-x-100" // a mirror on screen only; the photo is not flipped
        />
        {ready && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[44%] aspect-[3/4] h-[68%] max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-[3px] border-dashed transition-colors"
            style={{ borderColor: good ? "#4ade80" : "rgba(255,255,255,.75)" }}
          />
        )}
        {ready && !error && (
          <p
            role="status"
            className="absolute inset-x-3 bottom-3 rounded-[14px] px-3 py-2.5 text-center text-sm font-bold text-white"
            style={{ background: good ? "rgba(21,128,61,.92)" : "rgba(20,23,39,.82)" }}
          >
            {hint || "Only you in the circle. Look straight, good light."}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={looking ? stop : capture}
        disabled={busy || !ready}
        className={`${looking ? "btn-soft" : className} mt-4 w-full py-3.5 text-[15px]`}
      >
        {busy ? busyLabel : looking ? "Cancel" : label}
      </button>
      {error && <Notice type="error" className="mt-3">{error}</Notice>}
    </>
  );
};

export default CameraCapture;
