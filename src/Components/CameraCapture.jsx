import { useRef, useState } from "react";
import Webcam from "react-webcam";
import Notice from "./Notice";

// The liveness model expects a 3:4 portrait frame.
const VIDEO = {
  width: { ideal: 480 },
  height: { ideal: 640 },
  aspectRatio: { ideal: 0.75 },
  facingMode: "user",
};

const CameraCapture = ({ onCapture, label, busyLabel, busy = false, className = "btn-primary" }) => {
  const webcamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  async function capture() {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) {
      setError("The camera is not ready yet. Please wait a moment and try again.");
      return;
    }
    setError("");
    const blob = await fetch(dataUrl).then((res) => res.blob());
    onCapture({ file: new File([blob], "face.jpg", { type: "image/jpeg" }), dataUrl });
  }

  return (
    <>
      <div className="mx-auto max-w-[420px] overflow-hidden rounded-[20px] bg-[#141727]" style={{ boxShadow: "var(--shadow-clay-sm)" }}>
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
          className="w-full"
        />
      </div>

      <button type="button" onClick={capture} disabled={busy || !ready} className={`${className} mt-4 w-full py-3.5 text-[15px]`}>
        {busy ? busyLabel : label}
      </button>
      {error && <Notice type="error" className="mt-3">{error}</Notice>}
    </>
  );
};

export default CameraCapture;
