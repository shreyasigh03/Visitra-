import React from 'react'
import Navbar from './Navbar'
import { useState,useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCode } from "react-qr-code";
const Otpverification = () => {
  const location = useLocation();
  //variable hai jisme eamail ko val store h jo user n dali hai

  const [Timer, setTimer] = useState(null);


  //event hai
  const [input, setinput] = useState(false);
  const [inputVal, setinputVal] = useState();
  const [trigger, settrigger] = useState(0);

  const [pendingRequest, setpendingRequest] = useState(0);

  const [enteredOtp, setEnteredOtp] = useState("");
  const [email] = useState(localStorage.getItem("Email"));
  const [visitorEmail] = useState(localStorage.getItem("Email"));

  useEffect(() => {
    if (localStorage.getItem("otpVerified")) {
      localStorage.removeItem("otpVerified");
    }
  }, []);



  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error | info
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
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
    await fetch("http://localhost:5001/api/visitor/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });
    setMessage({ text: "OTP sent to your email", type: "success" });

    // reset resend timer (10s demo)
    const newEndTime = Date.now() + 10000;
    localStorage.setItem("endTime", newEndTime);
    setTimer(10);
    settrigger(prev => prev + 1);

    setLoadingOtp(false);
  } catch (err) {
    console.log(err);
    setLoadingOtp(false);
  }
}

async function handleVerifyOtp() {
  try {
    setVerifyingOtp(true);
    const res = await fetch("http://localhost:5001/api/visitor/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp: enteredOtp })
    });

    const data = await res.json();

    if (data.status === "verified") {
      setIsVerified(true);
      localStorage.removeItem("otpAccess");
      localStorage.setItem("otpVerified", "true");
      setMessage({ text: "OTP verified successfully ✔", type: "success" });
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 1500);
      setVerifyingOtp(false);
    } else if (data.status === "expired") {
      setMessage({ text: "OTP expired ⏰ Please resend OTP", type: "error" });
      setVerifyingOtp(false);
    } else {
      setMessage({ text: "Invalid OTP ❌", type: "error" });
      setVerifyingOtp(false);
    }
  } catch (err) {
    console.log(err);
    setVerifyingOtp(false);
  }
}

//curr timer show hra h pg reload pr bhi ------------smjnaaa
useEffect(() => {
  const savedEndTime = Number(localStorage.getItem("endTime"));
  let endTime;

  // agar localStorage me valid endTime hai aur future me hai
  if (savedEndTime && savedEndTime > Date.now()) {
    endTime = savedEndTime;
  } else {
    endTime = Date.now() + 10000; // default 10 sec timer
    localStorage.setItem("endTime", endTime);
  }

  const updateTimer = () => {
    const remainingTime = Math.floor((endTime - Date.now()) / 1000);
    setTimer(remainingTime > 0 ? remainingTime : 0);
  };

  updateTimer(); // immediately update timer to avoid flicker

  const interval = setInterval(updateTimer, 1000);

  return () => clearInterval(interval);
}, [trigger]);


  
  function handleVerify(){
    //  verify p click krne pe timer strt or email send hgi gmail pe 
    const newEndTime = Date.now() + 10000; // 60 sec
    localStorage.setItem("endTime", newEndTime);
    setTimer(10);
    settrigger(prev=>prev+1);  
  }
  function handleInstantvisit(){
    if (!isVerified) {
      setMessage({ text: "Please verify OTP first ❌", type: "error" });
      return;
    }
          //pass generate 
          const passId = localStorage.getItem("passId");
          setMessage({ text: "Pass generated successfully ✔", type: "success" });
          setShowSuccessAnim(true);
          setTimeout(() => setShowSuccessAnim(false), 1500);
          document.getElementById("pass").style.display = "block";
        }
          

  function handleBookvisit(){
    ///toh request sent hjaegi admin ke pass or uska data save hjaega database mai -------backend
      //jb bhi prev val ko upadte krna ho or udko local storgae p store krana ho toh aise kro ---always return in this syntax of setpending(prev=>{})
    //-----------------------------


      //setstate state chnge krega or re-render hne k bd hi chnges hnge jidhr bhi state use hui hai pr local m nhi hnge jb tk manulally chnge na kro useeffect gake ki jb bhi state chnge ho local storage p data chnges hjae 
      // setpendingRequest(prev=>prev+1);
      // localStorage.setItem("pendingrequest",JSON.stringify(pendingRequest));
      
      setMessage({ text: "Request sent. Waiting for admin approval.", type: "info" });
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
    return <Navigate to="/Visitor" replace />;
  }

  return (
    <div>
      <style>{animationStyle}</style>
        <Navbar/>
        <div className="container place-items-center mt-[8%] w-[30%]" style={{
  marginLeft:"37%",
  padding:"25px",
  borderRadius:"15px",
  background:"#ffffff",
  boxShadow:"0 10px 25px rgba(0,0,0,0.1)",
  border:"1px solid #e5e7eb"
}} >
          <h1 className='text-[180%] font-bold '>OTP VERIFICATION </h1>
          {/* agr js k kisi bhi chij ko use krna h jsx mai toh use {} */}
          <div className='gap-7 mt-[1%] mb-[1%]'>
          <p className='text-[105%] pt-[1.9%] mb-[3%]'>Please enter the OTP(One-Time-Password)sent to your registered email/phone number to complete your verification.</p>

          
          <div className='flex flex-col items-center'>
            <button onClick={sendOtp} disabled={loadingOtp} className='bg-[var(--bg-color)] w-40 p-2 mb-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)]'>{loadingOtp ? "Sending..." : "Send OTP"}</button>
            <div className='flex'>


          <input type="tel" onChange={(e)=>{
            setinputVal(e.target.value);
            setEnteredOtp(e.target.value);
            setinput(true);
            setMessage({ text: "", type: "" });
          }} value={inputVal}
          //phn p send hga toh name ki jrurt nhi h bec local storage p store nbhi hra--------
          placeholder='Enter OTP sent on your email'
          className='w-[60%]  ml-[18%] mb-3 p-2 border rounded'/>
         {input && inputVal.length>3?<button onClick={handleVerifyOtp} disabled={verifyingOtp} className='bg-[var(--bg-color)] w-20 ml-5 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3'>{verifyingOtp ? "Verifying..." : "Verify"}</button>:null}
          </div>
          </div>
          </div>

{showSuccessAnim && (
  <div style={{
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#22c55e",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    animation: "fadeInOut 1.5s ease"
  }}>
    ✔ Success
  </div>
)}

{message.text && (
  <p
    style={{
      marginTop: "10px",
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
      transition: "all 0.3s ease"
    }}
  >
    {message.text}
  </p>
)}

          {Timer>0 && <p>Resend OTP in {Timer} seconds</p>}
          {Timer==0 &&(
            <>
            
            <button
              onClick={sendOtp}
              disabled={loadingOtp || Timer > 0}
              className='bg-[var(--bg-color)] w-70 ml-16 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3 disabled:opacity-50'
            >
              {loadingOtp ? "Sending..." : "Didn't get the code? Resend OTP"}
            </button>
            </>
          )}

          <div className='flex gap-5'>
          <button onClick={handleInstantvisit} className='bg-[var(--bg-color)] w-25  p-1 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3'>Instant Visit</button>
          <button onClick={handleBookvisit} className='bg-[var(--bg-color)] w-20 p-1 mr-3 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3'>Book Visit</button>
          </div>
          
          <div id="pass" style={{
    display:"none",
    marginTop:"20px",
    padding:"20px",
    border:"2px solid #333",
    borderRadius:"15px",
    background:"linear-gradient(135deg,#d9f99d,#bef264)",
    boxShadow:"0 4px 10px rgba(0,0,0,0.2)",
    color:"#000"
  }}>
    <h2 style={{fontSize:"20px", fontWeight:"bold", marginBottom:"10px"}}>
      🎟️ Visitor Pass
    </h2>
    <h3 style={{marginBottom:"10px", fontWeight:"bold"}}>VISITRA</h3>

    <p><strong>Name:</strong> {localStorage.getItem("Name")}</p>
    <p><strong>Email:</strong> {visitorEmail}</p>
    <p><strong>Phone:</strong> {localStorage.getItem("Phone")}</p>
    <p><strong>To Meet:</strong> {localStorage.getItem("Meet")}</p>
    <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
    <p style={{fontSize:"18px", fontWeight:"bold", marginTop:"8px"}}>
      Pass ID: {localStorage.getItem("passId")}
    </p>
    <div style={{marginTop:"10px", textAlign:"center"}}>
      <QRCode value={localStorage.getItem("passId") || "NoPass"} size={130} />
    </div>

    <button 
      onClick={downloadPass} 
      style={{
        marginTop:"15px",
        padding:"10px",
        width:"100%",
        borderRadius:"8px",
        background:"#000",
        color:"#fff",
        cursor:"pointer"
      }}
    >
      Download Pass
    </button>
  </div>
        </div>
    </div>
  )
}

export default Otpverification
