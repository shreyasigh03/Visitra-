import React from "react";
import Navbar from "./Navbar";
import { useState, useEffect,useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCode } from "react-qr-code";
import { API_BASE_URL } from "../config";

const Otpverification = () => {
  //jo pichlie pg se data aaya hai usko access krne k lie
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef=useRef(null);
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

    // अगर image height page se badi hai → scale down
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
      // setEnteredOtp("");
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
    //arrow function hai jo timer ko update krega
    
    const updateTimer = () => {
      //remaining time nikalega seconds mai
      const remainingTime = Math.floor((endTime - Date.now()) / 1000);
       if(remainingTime<=0){
      setTimer(0);
      clearInterval(intervalRef.current);
      return;
    }

      //timer m vo time set --fir jaise hi state update hui pg re-render hua toh timer scrren pe update
      //agr 0 hgya toh 0 show krdo  - m nhi leke jaenge
      //agr 0 hgya toh --resend wala btn show
      setTimer(remainingTime > 0 ? remainingTime : 0);
    };
   
    updateTimer(); // immediately update timer to avoid flicker
    //hr ek sec k bd update timer func call krega
     intervalRef.current = setInterval(updateTimer, 1000);


    //isse interval stop hojaega nhi krge toh vo hr ek sec bd cal krta rhega updateTimer ko
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
        // setEnteredOtp("");
        setTimer(0);
        setTimeout(() => setShowSuccessAnim(false), 1500);
       
      } else if (data.status === "expired") {
        setMessage({ text: "OTP expired ⏰ Please resend OTP", type: "error" });
        // 
        // setEnteredOtp("");
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
    ///toh request sent hjaegi admin ke pass or uska data save hjaega database mai -------backend
    //jb bhi prev val ko upadte krna ho or udko local storgae p store krana ho toh aise kro ---always return in this syntax of setpending(prev=>{})
    //-----------------------------

    //setstate state chnge krega or re-render hne k bd hi chnges hnge jidhr bhi state use hui hai pr local m nhi hnge jb tk manulally chnge na kro useeffect gake ki jb bhi state chnge ho local storage p data chnges hjae
    // setpendingRequest(prev=>prev+1);
    // localStorage.setItem("pendingrequest",JSON.stringify(pendingRequest));
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
    <div>
      <style>{animationStyle}</style>
      <Navbar />
      <div
        className="container ml-[37%]  place-items-center mt-[8%] w-[30%]"
        style={{
          marginLeft: "37%",
          padding: "25px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 className="text-[180%] font-bold ">OTP VERIFICATION </h1>
        {/* agr js k kisi bhi chij ko use krna h jsx mai toh use {} */}
        <div className="gap-7 mt-[1%] mb-[1%]">
          <p className="text-[105%] pt-[1.9%] mb-[3%]">
            Please enter the OTP(One-Time-Password)sent to your registered
            email/phone number to complete your verification.
          </p>

          <div className="flex">
            <input
            //maxlength no input p work nhi krta
              type="text"
              inputMode="numeric"
              maxLength={4}
              onChange={(e) => {
                setEnteredOtp(e.target.value);

                setMessage({ text: "", type: "" });
              }}
              value={enteredOtp}
              //phn p send hga toh name ki jrurt nhi h bec local storage p store nbhi hra--------
              placeholder="Enter OTP sent on your email"
              className="w-[75%]  mb-3 p-2 border rounded"
            />

            {/* //ye ternary cond h toh agr true h toh btn dikhao nhi h toh kch mt dkhao */}
            {/* //same logic hai agr--input enter krdia or uski length>3 h toh
              //ek btn show hojaega --initialy verifying otp ki val false hai toh btn pe verify itp aajaega 
              //uspe click krne pr verifyingotp h vo true hojaege agr or btn pe show hojaega verifying otp or disabled hjaega mtlb uspe click nhi kr paenge
              //jb otp verified krke response agya toh verifyingotp firse false hojaega  */}
            {enteredOtp.length == 4  && !isVerified && (
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="bg-[var(--bg-color)] w-20 ml-5 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3"
              >
                {verifyingOtp ? "Verifying..." : "Verify"}
              </button>
            )}
          </div>
        </div>

        {showSuccessAnim && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "#22c55e",
              color: "#fff",
              padding: "10px 15px",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              animation: "fadeInOut 1.5s ease",
            }}
          >
            ✔ Success
          </div>
        )}

        {message.text && (
          <p
            style={{
              marginBottom: "20px",
              padding: "8px 12px",
              borderRadius: "8px",
              background:
                message.type === "success"
                  ? "#dcfce7"
                  : message.type === "error"
                    ? "#fee2e2"
                    : "#e5e7eb",
              color:
                message.type === "success"
                  ? "#166534"
                  : message.type === "error"
                    ? "#991b1b"
                    : "#374151",
              fontWeight: "500",
              textAlign: "center",
              transition: "all 0.3s ease",
            }}
          >
            {message.text}
          </p>
        )}
        
       
        {!isVerified && Timer > 0 && (
          <p>Resend OTP in {Timer} seconds</p>
        )}
        {Timer == 0 && !isVerified &&(
          <>
            <button
              onClick={sendOtp}
              disabled={loadingOtp || Timer > 0}
              className="bg-[var(--bg-color)] w-102 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3 disabled:opacity-50"
            >
              {loadingOtp ? "Sending..." : "Didn't get the code? Resend OTP"}
            </button>
          </>
        )}


        <div className="flex gap-5">
          <button
            onClick={handleInstantvisit}
            className="bg-[var(--bg-color)] w-25 mt  p-1 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3"
          >
            Instant Visit
          </button>
          <button
            onClick={handleBookvisit}
            className="bg-[var(--bg-color)] w-29 p-1 mr-3 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3"
          >
            Book Visit
          </button>
        </div>

        <div
          id="pass"
          style={{
            display: "none",
            marginTop: "20px",
            padding: "20px",
            border: "2px solid #333",
            borderRadius: "15px",
            background: "linear-gradient(135deg,#d9f99d,#bef264)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            color: "#000",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            🎟️ Visitor Pass
          </h2>
          <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>VISITRA</h3>

          <p>
            <strong>Name:</strong> {localStorage.getItem("Name")}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Phone:</strong> {localStorage.getItem("Phone")}
          </p>
          <p>
            <strong>To Meet:</strong> {localStorage.getItem("Meet")}
          </p>
          <p>
            <strong>Time:</strong> {new Date().toLocaleString()}
          </p>
          <p style={{ fontSize: "18px", fontWeight: "bold", marginTop: "8px" }}>
            Pass ID: {localStorage.getItem("passId")}
          </p>
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <QRCode
              value={localStorage.getItem("passId") || "NoPass"}
              size={130}
            />
          </div>

          <button
            onClick={downloadPass}
            style={{
              marginTop: "15px",
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              background: "#000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Download Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default Otpverification;
