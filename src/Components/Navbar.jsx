import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from "../assets/visitra_logo.png";

const Navbar = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("visitra-theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("visitra-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="sticky top-0 z-50 px-4 py-3.5 sm:px-8 lg:px-16">
      <nav className="glass flex items-center gap-5 rounded-[20px] px-4 py-2.5">
        <NavLink to="/" className="flex items-center">
          <img src={logo} alt="VISITRA logo" className="h-8 transition hover:scale-105" />
        </NavLink>
        <ul className="ml-auto flex flex-wrap items-center gap-1">
          <NavLink to="/Feature" className="nav-link"><li>Features</li></NavLink>
          <NavLink to="/Works" className="nav-link"><li>How it works</li></NavLink>
          <NavLink to="/Facerecognition" className="nav-link"><li>Face recognition</li></NavLink>
          <button
            onClick={() => setDark((d) => !d)}
            className="clay-sm ml-1.5 cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
