import { useState } from "react";
import { Link } from "react-router-dom";
import { FaChalkboardTeacher, FaUserCog, FaUserShield } from "react-icons/fa";
import { MdClose, MdLogin } from "react-icons/md";

const LOGINS = [
  ["/TeacherLogin", "Teacher", FaChalkboardTeacher],
  ["/GuardLogin", "Guard", FaUserShield],
  ["/AdminLogin", "Admin", FaUserCog],
];

// One button that opens the choice, so that visitors see only what they need.
const StaffLogin = () => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" aria-expanded="false" onClick={() => setOpen(true)} className="glass flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--ink)]">
        <MdLogin aria-hidden="true" /> Staff login
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Log in as">
      {LOGINS.map(([to, label, Icon], i) => (
        <Link key={to} to={to} className="glass flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold hover:text-[var(--accent)]" style={{ animation: `pop .35s ${i * 0.07}s ease both` }}>
          <Icon aria-hidden="true" /> {label}
        </Link>
      ))}
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="flex h-11 w-11 cursor-pointer items-center justify-center text-lg text-[var(--muted)]">
        <MdClose />
      </button>
    </div>
  );
};

export default StaffLogin;
