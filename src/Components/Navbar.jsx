import NavShell from "./NavShell";

const LINKS = [
  { to: "/Organizations", label: "Organizations" },
  { to: "/Feature", label: "Features" },
  { to: "/Works", label: "How it works" },
  { to: "/Facerecognition", label: "Face recognition" },
];

const Navbar = () => <NavShell home="/" links={LINKS} />;

export default Navbar;
