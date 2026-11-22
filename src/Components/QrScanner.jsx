import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";

const FAST_MS = 300;
const SERVER_MS = 1200;
const VIDEO = { facingMode: "environment", width: { ideal: 1280 } };

// The browser's own QR reader, or null where it is missing (Firefox, Safari, Windows).
async function makeDetector() {
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    return formats.includes("qr_code") ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
  } catch {
    return null;
  }
}

async function readOnServer(blob, role) {
  const body = new FormData();
  body.append("img", new File([blob], "qr.jpg", { type: blob.type || "image/jpeg" }));
  return (await apiFetch("/api/gate/decode-qr", { method: "POST", body, auth: role })).text;
}

async function readImage(detector, blob, role) {
  if (detector) {
    const bitmap = await createImageBitmap(blob);
    const [code] = await detector.detect(bitmap);
    if (code) return code.rawValue;
  }
  return readOnServer(blob, role);
}

const QrScanner = ({ role, onCode }) => {
  const webcamRef = useRef(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    let timer;
    (async () => {
      const detector = await makeDetector();
      const look = async () => {
        if (!active) return;
        let text = "";
        try {
          const video = webcamRef.current?.video;
          if (video?.readyState >= 2) {
            if (detector) {
              text = (await detector.detect(video))[0]?.rawValue ?? "";
            } else {
              const shot = webcamRef.current.getScreenshot();
              if (shot) text = await readOnServer(await fetch(shot).then((r) => r.blob()), role);
            }
          }
        } catch (err) {
          if (active && !detector) setError(err.message);
        }
        if (!active) return;
        if (text) {
          onCode(text);
          return;
        }
        timer = setTimeout(look, detector ? FAST_MS : SERVER_MS);
      };
      look();
    })();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [role, onCode]);

  async function upload(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const text = await readImage(await makeDetector(), file, role);
      if (text) onCode(text);
      else setError("No QR code was found in this picture. Try a clearer one.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Looks and works like a hand-held gate scanner. */}
      <div className="mx-auto max-w-[480px] rounded-[26px] bg-[#141727] p-3">
        <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold tracking-widest text-white/80">
          <span>VISITRA SCANNER</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3FBF7F]" />READY</span>
        </div>
        <div className="relative overflow-hidden rounded-[18px]">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          forceScreenshotSourceSize
          videoConstraints={VIDEO}
          onUserMediaError={() => setError("Camera access was blocked. Allow it in the browser, or use one of the options below.")}
          className="w-full"
        />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-1/2 overflow-hidden rounded-2xl border-[3px] border-white/80">
              <div className="scan-line absolute left-0 h-0.5 w-full bg-[#ff5a5a]" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[13px] text-[var(--muted)]">Hold the pass QR code in front of the camera.</p>
      <label className="btn-soft mt-3 block w-full py-3 text-center text-sm">
        {uploading ? "Reading…" : "Or choose a picture of the QR code"}
        <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={upload} />
      </label>
      {error && <Notice type="error" className="mt-3">{error}</Notice>}
    </>
  );
};

export default QrScanner;
