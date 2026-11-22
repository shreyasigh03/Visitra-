import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import logo from "../assets/visitra_logo.png";
import { useTheme } from "../hooks/useTheme";

const linkClass = ({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link");

// Where the hamburger menu gives way to inline links.
const SIZES = {
  md: { button: "md:hidden", menu: "md:flex md:w-auto md:flex-row md:items-center md:pt-0" },
  xl: { button: "xl:hidden", menu: "xl:flex xl:w-auto xl:flex-row xl:items-center xl:pt-0" },
};

const NavShell = ({ home, links, inlineFrom = "md", children }) => {
  const [open, setOpen] = useState(false);
  const { dark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 px-4 py-3.5 sm:px-8">
      <nav className="glass relative flex flex-wrap items-center justify-between gap-x-4 rounded-[20px] px-4 py-2.5">
        <Link to={home} aria-label="VISITRA home" className="flex min-h-11 items-center">
          <img src={logo} alt="VISITRA" className="h-8 w-auto dark:brightness-0 dark:invert" />
        </Link>

        <button
          type="button"
          className={`btn-soft flex h-11 w-11 items-center justify-center text-xl ${SIZES[inlineFrom].button}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <HiX /> : <HiMenu />}
        </button>

        <div
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 pt-3 ${SIZES[inlineFrom].menu}`}
        >
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          <button type="button" onClick={toggleTheme} className="btn-soft px-3.5 py-2 text-left text-[13px]">
            {dark ? "Light mode" : "Dark mode"}
          </button>
          {children}
        </div>
      </nav>
    </header>
  );
};

export default NavShell;
