import React from "react";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
//first pg p jake pg ka /... bnao fir navigate ka use krke us /   ko lgao jaha lgana ho
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const AdminLogin = () => {
  const [Email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  //use navigate ko store kr navigate mai
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: Email,
          password: password
        })
      });

      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("isAdmin", "true");
        navigate("/Admindashboard");
      } else {
        alert("Invalid email or password");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <form
          className="clay w-full max-w-[440px] rounded-[28px] p-7 sm:p-10"
          style={{ animation: "fadeUp .5s ease both" }}
          onSubmit={handleSubmit}
          action="submit"
        >
          <div className="font-display mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] text-[17px] font-extrabold text-white"
            style={{ background: "linear-gradient(160deg,var(--accent2),var(--accent))", boxShadow: "var(--shadow-clay-sm)" }}>
            VA
          </div>
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">Admin sign in</h1>
          <p className="mb-7 text-[14.5px] text-[var(--muted)]">
            Access the VISITRA dashboard to manage visitors and approvals.
          </p>

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={Email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className="input-clay mb-5 w-full"
            required
          />

          <label className="mb-1.5 block text-[13px] font-bold text-[var(--muted)]" htmlFor="">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setpassword(e.target.value);
            }}
            className="input-clay mb-5 w-full"
            required
          />

          <button type="submit" className="btn-primary mt-2 w-full py-3.5 text-[15px]">
            Sign in
          </button>
          <p className="mt-4 text-center text-[12.5px] text-[var(--muted)]">
            Restricted area — authorized security staff only.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
