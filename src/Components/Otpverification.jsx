import React from "react";
import Navbar from "./Navbar";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCode } from "react-qr-code";
import { API_BASE_URL } from "../config";

const Otpverification = () => {
  //jo pichlie pg se data aaya hai usko access krne k lie
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  if (!location.state?.fromForm) {
    navigate("/", { replace: true });
  }
  //variable hai jisme eamail ko val store h jo user n dali hai
  const email = localStorage.getItem("Email");

  const [enteredOtp, setEnteredOtp] = useState("");
  const [Timer, setTimer] = useState(null);
  const [trigger, settrigger] = useState(0);

  const [pendingRequest, setpendingRequest] = useState(0);

  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error | info
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(true);
  const [otpSent, setotpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const downloadPass = async () => {
    const element = document.getElementById("pass");

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let imgWidth = pageWidth - 20; // margins
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pageHeight - 20) {
      imgHeight = pageHeight - 20;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("visitor-pass.pdf");
  };

  async function sendOtp() {
    try {
      setLoadingOtp(true);
      await fetch(`${API_BASE_URL}/api/visitor/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      setMessage({ text: "OTP sent to your email", type: "success" });

      const newEndTime = Date.now() + 60000;
      localStorage.setItem("endTime", newEndTime);

      settrigger((prev) => prev + 1);

      setLoadingOtp(false);
      setotpSent(true);
    } catch (err) {
      console.log(err);
      setLoadingOtp(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("otpVerified")) {
      localStorage.removeItem("otpVerified");
    }
    localStorage.removeItem("endTime");
    //phli br otp pg khula khulte hi otp send hua
    sendOtp();
  }, []);

  //jb bhi resend otp p click krenge toh sendotp wala func chla--usse trigger update hua ye useeffect chla --isse timer ki val dec hgi
  useEffect(() => {
    //otp kb expire hga vo time
    const savedEndTime = Number(localStorage.getItem("endTime"));
    let endTime;

    //agr localstorage mai endtime save hi nhi hai ya agr otp expire hgya hai
    if (!savedEndTime || savedEndTime <= Date.now()) {
      //toh timer ko 0 krde
      setTimer(0);
      return;
    }

    endTime = savedEndTime;

    const updateTimer = () => {
      //remaining time nikalega seconds mai
      const remainingTime = Math.floor((endTime - Date.now()) / 1000);
      if (remainingTime <= 0) {
        setTimer(0);
        clearInterval(intervalRef.current);
        return;
      }

      setTimer(remainingTime > 0 ? remainingTime : 0);
    };

    updateTimer(); // immediately update timer to avoid flicker
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalRef.current);
  }, [trigger]);

  async function handleVerifyOtp() {
    try {
      setVerifyingOtp(true);
      const res = await fetch(`${API_BASE_URL}/api/visitor/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });

      const data = await res.json();

      if (data.status === "verified") {
        setVerifyingOtp(false);
        clearInterval(intervalRef.current);
        setTimer(0);
        localStorage.removeItem("endTime");

        setIsVerified(true);
        localStorage.removeItem("otpAccess");
        localStorage.setItem("otpVerified", "true");
        setMessage({ text: "OTP verified successfully ✔", type: "success" });
        setShowSuccessAnim(true);
        setTimer(0);
        setTimeout(() => setShowSuccessAnim(false), 1500);
      } else if (data.status === "expired") {
        setMessage({ text: "OTP expired ⏰ Please resend OTP", type: "error" });
        setTimer(0);
        setVerifyingOtp(false);
      } else {
        setTimer(0);
        setMessage({ text: "Invalid OTP ❌", type: "error" });
        setVerifyingOtp(false);
      }
    } catch (err) {
      console.log(err);
      setVerifyingOtp(false);
      setMessage({
        text: "Something went wrong!",
        type: "error",
      });
    }
  }

  function handleInstantvisit() {
    if (!isVerified) {
      setMessage({ text: "Please verify OTP first ❌", type: "error" });
      return;
    }
    //pass generate
    const passId = localStorage.getItem("passId");
    setMessage({ text: "Pass generated successfully ✔", type: "success" });
    setShowSuccessAnim(true);
    setTimer(0);
    setTimeout(() => setShowSuccessAnim(false), 1500);
    document.getElementById("pass").style.display = "block";
  }

  function handleBookvisit() {
    if (!isVerified) {
      setMessage({ text: "Please verify OTP first ❌", type: "error" });
      return;
    }
    setTimer(0);
    setMessage({
      text: "Request sent. Waiting for admin approval.",
      type: "info",
    });
  }

  const animationStyle = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  30% { opacity: 1; transform: translateY(0); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}
`;

  if (!location.state?.fromForm) {
    navigate("/Visitor", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <style>{animationStyle}</style>
      <Navbar />

      <div className="mx-auto w-full max-w-[520px] px-4 pb-16 pt-6 sm:pt-12" style={{ animation: "fadeUp .5s ease both" }}>
        <div className="clay rounded-[28px] p-6 sm:p-9">
          <div className="font-display mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-extrabold"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}>
            OTP
          </div>
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">OTP verification</h1>
          {/* agr js k kisi bhi chij ko use krna h jsx mai toh use {} */}
          <p className="mb-6 text-[14.5px] leading-relaxed text-[var(--muted)]">
            Please enter the one-time password sent to your registered email to
            complete your verification.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              onChange={(e) => {
                setEnteredOtp(e.target.value);

                setMessage({ text: "", type: "" });
              }}
              value={enteredOtp}
              placeholder="Enter OTP sent on your email"
              className="input-clay mb-3 w-full font-display text-center text-lg font-bold tracking-[.35em]"
            />

            {enteredOtp.length == 4 && !isVerified && (
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="btn-primary mb-3 shrink-0 px-5 text-sm"
              >
                {verifyingOtp ? "Verifying..." : "Verify"}
              </button>
            )}
          </div>

          {showSuccessAnim && (
            <div
              className="fixed right-5 top-5 z-50 rounded-2xl px-4 py-2.5 text-sm font-extrabold"
              style={{
                background: "var(--ok-bg)",
                color: "var(--ok-fg)",
                boxShadow: "var(--shadow-clay)",
                animation: "fadeInOut 1.5s ease",
              }}
            >
              ✔ Success
            </div>
          )}

          {message.text && (
            <p
              className="mb-5 rounded-[14px] px-3.5 py-2.5 text-center text-[13.5px] font-bold transition-all"
              style={{
                background:
                  message.type === "success"
                    ? "var(--ok-bg)"
                    : message.type === "error"
                      ? "var(--bad-bg)"
                      : "var(--surface)",
                color:
                  message.type === "success"
                    ? "var(--ok-fg)"
                    : message.type === "error"
                      ? "var(--bad-fg)"
                      : "var(--muted)",
              }}
            >
              {message.text}
            </p>
          )}

          {!isVerified && Timer > 0 && (
            <p className="text-[13.5px] text-[var(--muted)]">
              Resend available in <strong className="text-[var(--ink)]">{Timer}s</strong>
            </p>
          )}
          {Timer == 0 && !isVerified && (
            <>
              <button
                onClick={sendOtp}
                disabled={loadingOtp || Timer > 0}
                className="btn-soft mb-3 w-full py-3 text-sm"
              >
                {loadingOtp ? "Sending..." : "Didn't get the code? Resend OTP"}
              </button>
            </>
          )}

          <div className="mt-4 flex gap-3 border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <button
              onClick={handleInstantvisit}
              className="mb-1 flex-1 cursor-pointer rounded-2xl py-3 text-sm font-extrabold transition hover:-translate-y-0.5"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              Instant Visit
            </button>
            <button
              onClick={handleBookvisit}
              className="btn-soft mb-1 flex-1 py-3 text-sm"
            >
              Book Visit
            </button>
          </div>
          <p className="mt-3 text-center text-[12.5px] text-[var(--muted)]">
            Instant visit issues your pass now · Book visit sends a request for admin approval.
          </p>

          <div
            id="pass"
            className="mt-5 rounded-[24px] p-6"
            style={{
              display: "none",
              background: "var(--card)",
              border: "1px solid var(--glass-line)",
              boxShadow: "var(--shadow-clay)",
              color: "var(--ink)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[13px] font-extrabold tracking-[.14em] text-[var(--muted)]">
                VISITOR PASS
              </h2>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide"
                style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}>
                VERIFIED
              </span>
            </div>
            <h3 className="font-display mb-4 text-lg font-extrabold">VISITRA</h3>

            <div className="mb-4 grid grid-cols-2 gap-2.5 text-[13px]">
              <div className="tile px-3 py-2.5">
                <div className="text-[10.5px] font-extrabold tracking-wider text-[var(--muted)]">NAME</div>
                <div className="mt-0.5 font-extrabold">{localStorage.getItem("Name")}</div>
              </div>
              <div className="tile px-3 py-2.5">
                <div className="text-[10.5px] font-extrabold tracking-wider text-[var(--muted)]">EMAIL</div>
                <div className="mt-0.5 break-all font-extrabold">{email}</div>
              </div>
              <div className="tile px-3 py-2.5">
                <div className="text-[10.5px] font-extrabold tracking-wider text-[var(--muted)]">PHONE</div>
                <div className="mt-0.5 font-extrabold">{localStorage.getItem("Phone")}</div>
              </div>
              <div className="tile px-3 py-2.5">
                <div className="text-[10.5px] font-extrabold tracking-wider text-[var(--muted)]">TO MEET</div>
                <div className="mt-0.5 font-extrabold">{localStorage.getItem("Meet")}</div>
              </div>
              <div className="tile col-span-2 px-3 py-2.5">
                <div className="text-[10.5px] font-extrabold tracking-wider text-[var(--muted)]">TIME</div>
                <div className="mt-0.5 font-extrabold">{new Date().toLocaleString()}</div>
              </div>
            </div>

            <p className="font-display mb-3 text-lg font-extrabold">
              Pass ID: {localStorage.getItem("passId")}
            </p>
            <div className="tile flex justify-center rounded-[18px] p-4">
              <QRCode
                value={localStorage.getItem("passId") || "NoPass"}
                size={130}
              />
            </div>

            <button
              onClick={downloadPass}
              className="mt-4 w-full cursor-pointer rounded-2xl py-3.5 text-sm font-extrabold transition hover:-translate-y-0.5"
              style={{ background: "var(--ink)", color: "var(--bg)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              Download Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Otpverification;
