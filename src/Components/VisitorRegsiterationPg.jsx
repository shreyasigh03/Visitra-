//is lib se browser ke webcam ko access kr skte hai
import Webcam from "react-webcam";
import React, { useState, useRef } from "react";
import Navbar from "./Navbar";
import { IoMdPerson } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import { FaPhoneFlip } from "react-icons/fa6";
import { FaUserGroup } from "react-icons/fa6";
import { IoMdPhotos } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const VisitorRegsiterationPg = () => {
  const [Name, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [Phone, setPhone] = useState("");
  const [Reason, setReason] = useState("");
  const [Visitdate, setVisitdate] = useState("");
  const [ToMeet, setMeet] = useState("");
  const [photo, setphoto] = useState(null);
  const [preview, setPreview] = useState("");
  //ek ref variable bnaya webcam
  const webcamRef = useRef(null);

  const navigate = useNavigate();

  async function capturePhoto() {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);

    const blob = await fetch(imageSrc).then((res) => res.blob());

    const file = new File([blob], "visitor.jpg", {
      type: "image/jpeg",
    });
    setphoto(file);
  }

  function handleName(e) {
    setName(e.target.value);
    localStorage.setItem("Name", e.target.value);
  }
  function handleEmail(e) {
    setEmail(e.target.value);
    localStorage.setItem("Email", e.target.value);
  }

  function handlePhone(e) {
    setPhone(e.target.value);
    localStorage.setItem("Phone", e.target.value);
  }

  function handleReason(e) {
    setReason(e.target.value);
  }
  function handlemeet(e) {
    setMeet(e.target.value);
    localStorage.setItem("Meet", e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!photo) {
      alert("Please capture a face image before registering.");
      return;
    }

    const passId = Date.now().toString().slice(-6);
    localStorage.setItem("passId", passId);

    const formData = new FormData();
    formData.append("name", Name);
    formData.append("email", Email);
    formData.append("phone", Phone);
    formData.append("reason", Reason);
    formData.append("toMeet", ToMeet);
    formData.append("date", Visitdate);
    formData.append("photo", photo);
    formData.append("passId", passId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/visitor/register`, {
        method: "POST",

        body: formData,
      });

      const data = await res.json();
      console.log(data.status, data.message);

      if (!res.ok) {
        alert(data.message);
        return;
      }

      console.log(data.message);

      const endTime = Date.now() + 10000;
      localStorage.setItem("endTime", endTime);

      navigate("/otp", { state: { fromForm: true }, replace: true });
    } catch (error) {
      console.error("fake img", error);
      alert("Error submitting form ❌");
    }
  }

  const labelClass = "mb-1.5 block text-[13px] font-bold tracking-wide text-[var(--muted)]";
  const iconClass = "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:pt-10" style={{ animation: "fadeUp .5s ease both" }}>
        <div className="mb-8 text-center">
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Visitor registration
          </h1>
          <p className="text-[15px] text-[var(--muted)]">
            Tell us who you are and who you're visiting — it takes under a minute.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr]"
          action="Submit"
        >
          <div className="clay rounded-[28px] p-5 sm:p-8">
            <div className="grid gap-4.5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="">Name</label>
                <div className="relative w-full">
                  <IoMdPerson className={iconClass} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your Name"
                    value={Name}
                    onChange={handleName}
                    className="input-clay w-full pr-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="">Email</label>
                <div className="relative w-full">
                  <MdEmail className={iconClass} />
                  <input
                    type="email"
                    name="Email"
                    placeholder="Enter your Email"
                    value={Email}
                    onChange={handleEmail}
                    className="input-clay w-full pr-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="">Phone Number</label>
                <div className="relative w-full">
                  <FaPhoneFlip className={iconClass} />
                  <input
                    type="tel"
                    name="Phone"
                    placeholder="Enter your Phone"
                    value={Phone}
                    onChange={handlePhone}
                    className="input-clay w-full pr-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="">Reason</label>
                <div className="relative w-full">
                  <IoIosArrowDown className={iconClass} />
                  <select
                    name="reason"
                    value={Reason}
                    onChange={handleReason}
                    className="input-clay w-full appearance-none pr-10"
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="meeting">Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Maintenence">Maintenence</option>
                    <option value="Visit">Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="">Date</label>
                <input
                  type="date"
                  name="Date of Visit"
                  placeholder="Date of Visit"
                  value={Visitdate}
                  onChange={(e) => setVisitdate(e.target.value)}
                  className="input-clay w-full"
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="">Host Name</label>
                <div className="relative w-full">
                  <FaUserGroup className={iconClass} />
                  <input
                    type="text"
                    name="ToMeet"
                    placeholder="Host Name"
                    value={ToMeet}
                    onChange={handlemeet}
                    className="input-clay w-full pr-10"
                    required
                  />
                </div>
              </div>
            </div>

            <button className="btn-primary mt-7 w-full py-3.5 text-[15px]">
              Continue to OTP verification
            </button>
            <p className="mt-3.5 text-center text-[12.5px] text-[var(--muted)]">
              You'll receive a one-time password on your email to confirm your identity.
            </p>
          </div>

          <div className="clay rounded-[28px] p-5 sm:p-7">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="font-display text-[15px] font-bold">Profile Photo</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                REQUIRED
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[20px] bg-[#141727]" style={{ boxShadow: "var(--shadow-clay-sm)" }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
              <div className="pointer-events-none absolute inset-3.5 rounded-[14px] border-[1.5px] border-white/10" />
            </div>

            <button
              type="button"
              onClick={capturePhoto}
              className="btn-soft mt-4 w-full py-3 text-sm"
            >
              Capture Photo
            </button>

            {preview && (
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={preview}
                  alt="photo"
                  className="h-20 w-20 rounded-2xl object-cover"
                  style={{ boxShadow: "var(--shadow-clay-sm)" }}
                />
                <span className="text-[13px] font-semibold" style={{ color: "var(--ok-fg)" }}>
                  Photo captured ✓
                </span>
              </div>
            )}

            <p className="mt-3.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Your photo is used once for face-verified entry at the gate, then stored securely
              with your visit record.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorRegsiterationPg;
