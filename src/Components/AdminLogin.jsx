import React from "react";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
//first pg p jake pg ka /... bnao fir navigate ka use krke us /   ko lgao jaha lgana ho
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [Email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  //use navigate ko store kr navigate mai
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/api/admin/login", {
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
    <div>
      <Navbar />
       
      {/* horizonatlly and vertically center hjaega */} 
      <div className="place-items-center ">
        
        <form
          className="flex flex-col items-start w-[50%] my-20 shadow-lg px-[5%] py-[3%]"
          onSubmit={handleSubmit}
          action="submit"
        >
          <h1 className="mb-10 text-[180%] font-bold pt-5">Admin Login Page</h1>
          
          <label className="text-lg text-left mb-1" htmlFor="">
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
            className="w-[100%] mb-5 p-2 border rounded"
            required
          />

          <label className="text-lg text-left mb-1" htmlFor="">
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
            className="w-[100%] mb-5 p-2 border rounded"
            required
          />

          <button
            type="submit"
            className="bg-[var(--bg-color)] w-40 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
