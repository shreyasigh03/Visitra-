import LogoutButton from "./LogoutButton";
import NavShell from "./NavShell";
import { clearToken } from "../lib/auth";

const LINKS = [
  { to: "/Admindashboard", label: "Dashboard" },
  { to: "/Adminentry", label: "Entry / Exit" },
  { to: "/Gate", label: "Gate" },
  { to: "/Adminteachers", label: "Teachers" },
  { to: "/Adminguards", label: "Guards" },
  { to: "/Adminblacklist", label: "Blacklist" },
  { to: "/Adminactivity", label: "Activity" },
  { to: "/Adminarchive", label: "Old records" },
  { to: "/Adminprofile", label: "Profile" },
];

const Adminnavbar = () => (
  <NavShell home="/Admindashboard" links={LINKS} inlineFrom="xl">
    <LogoutButton onLogout={() => clearToken("admin")} />
  </NavShell>
);

export default Adminnavbar;
