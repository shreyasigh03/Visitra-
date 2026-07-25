import React from "react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/visitra_logo.png";

const Adminnavbar = () => {

  const [showLogout, setShowLogout] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("visitra-theme") === "dark");

  const navigate=useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("visitra-theme", dark ? "dark" : "light");
  }, [dark]);

  function handleLogout() {
    localStorage.removeItem("isAdmin");
    navigate("/AdminLogin", { replace: true });
  }

  const linkClass = ({ isActive }) => (isActive ? "side-link-active" : "side-link");

  return (
    <div className="sticky top-0 z-50 px-4 py-3.5 sm:px-8">
      <nav className="glass relative flex items-center gap-4 rounded-[20px] px-4 py-2.5">
        <NavLink to="/Admindashboard" className="flex items-center">
          <img src={logo} alt="logo" className="h-8 w-auto" />
        </NavLink>

        <ul className="ml-auto flex flex-wrap items-center gap-1">
          <NavLink to="/Admindashboard" className={linkClass}>
            <li>Home</li>
          </NavLink>

          <NavLink to="/Adminprofile" className={linkClass}>
            <li>Profile</li>
          </NavLink>

          <NavLink to="/Adminentry" className={linkClass}>
            <li>Visitor Details</li>
          </NavLink>

          <button
            onClick={() => setDark((d) => !d)}
            className="clay-sm ml-1.5 cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            {dark ? "Light" : "Dark"}
          </button>

          <button
            className="ml-1.5 cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-bold transition hover:opacity-80"
            style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}
            onClick={() => setShowLogout(!showLogout)}
          >
            Logout
          </button>

          {showLogout && (
            <div className="clay absolute right-2 top-16 w-64 rounded-[18px] p-4" style={{ animation: "fadeUp .2s ease both" }}>
              <p className="mb-4 text-sm font-semibold text-[var(--muted)]">
                Are you sure you want to logout?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="btn-soft rounded-xl px-3.5 py-1.5 text-[13px]"
                >
                  No
                </button>

                <button
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl px-3.5 py-1.5 text-[13px] font-bold transition hover:opacity-80"
                  style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}
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
