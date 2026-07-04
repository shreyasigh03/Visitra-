import React from "react";
import { IoIosArrowDown } from "react-icons/io";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/visitra_logo.png";

const Adminnavbar = () => {

  const [showLogout, setShowLogout] = useState(false);

  const navigate=useNavigate();

  function handleLogout() {
    localStorage.removeItem("isAdmin");
    navigate("/AdminLogin", { replace: true });
  }


  return (
    <div>
      <nav className="flex   gap-200 text-[var(--primary-color)] bg-[var(--bg-color)] p-2">
        <div className="pl-[6%] flex items-center gap-2">
          <img src={logo} alt="logo" className="h-8 w-auto" />
          {/* <span className="font-bold text-lg">VISITRA</span> */}
        </div>
        <ul className="flex gap-20">
          {/* //icons css */}
          <NavLink to="/Admindashboard">
            <li className="flex">Home</li>
          </NavLink>

          <NavLink to="/Adminprofile">
            <li className="flex">Profile </li>
          </NavLink>

          <NavLink to="/Adminentry"><li className="flex">Visitor Details </li></NavLink>


          <button onClick={() => setShowLogout(!showLogout)}>Logout</button>
          {showLogout && (
            <div className="absolute right-5 top-16 w-64 bg-white shadow-xl rounded-xl p-4">
              <p className="text-gray-700 text-sm mb-4">
                Are you sure you want to logout?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
                >
                  No
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                >
                  Yes
                </button>
              </div>
            </div>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Adminnavbar;
