import { FaChalkboardTeacher, FaUser, FaUserCog, FaUserShield } from "react-icons/fa";
import { MdBlock, MdCheckCircle, MdExitToApp, MdMarkEmailRead, MdOutlineEditNote, MdQrCode2, MdSensorOccupied } from "react-icons/md";
import Navbar from "./Navbar";

const STEPS = [
  [MdOutlineEditNote, "Register", "A short form and one photo"],
  [MdMarkEmailRead, "Verify email", "With a one-time code"],
  [MdQrCode2, "Get the pass", "A digital pass with a QR code"],
  [MdCheckCircle, "Host approves", "Or rejects, or gives a new time"],
  [MdSensorOccupied, "Enter", "By face or QR at the gate"],
  [MdExitToApp, "Leave", "The exit is saved too"],
];

const ROLES = [
  [FaUser, "Visitor", ["Choose a host and a free time", "Bring a group on one pass", "Download the pass as a PDF", "Get every answer by email"]],
  [FaChalkboardTeacher, "Teacher", ["Approve, reject or reschedule", "Answer straight from the email", "Get phone notifications", "Set free times, see old meetings"]],
  [FaUserShield, "Guard", ["Scan the QR with any camera", "Check the face and the photo", "See who is expected and inside", "Get an alert for overstays"]],
  [FaUserCog, "Admin", ["Live count, charts and search", "Manage teachers and guards", "Blacklist and activity history", "CSV download, Excel archive"]],
];

const STOPPED = ["Visit not approved", "Pass for another day", "Blacklisted person", "Unknown face", "Two faces in one photo", "Photo of a photo", "Wrong email code"];

const Howitworks = () => (
  <div className="flex min-h-dvh flex-col">
    <Navbar />
    <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center gap-4 px-4 pb-6 sm:px-8" style={{ animation: "fadeUp .5s ease both" }}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[32px]">How VISITRA works</h1>
        <p className="text-[var(--muted)]">From the first click to the exit, in six steps.</p>
      </div>

      <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
        {STEPS.map(([Icon, title, text], i) => (
          <li key={title} className="glass min-w-0 rounded-[20px] p-3.5 transition duration-300 hover:-translate-y-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-white" style={{ background: "linear-gradient(160deg,#8b8ef1,#5457d6)" }}><Icon aria-hidden="true" /></span>
              <span className="font-display text-xl font-extrabold text-[var(--accent)] opacity-40">{i + 1}</span>
            </div>
            <h2 className="text-[15px] font-extrabold">{title}</h2>
            <p className="text-[12.5px] leading-snug text-[var(--muted)]">{text}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {ROLES.map(([Icon, role, points]) => (
          <section key={role} className="clay-sm min-w-0 rounded-[22px] p-4">
            <h2 className="font-display mb-2.5 flex items-center gap-2.5 text-[16px] font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><Icon aria-hidden="true" /></span>
              {role}
            </h2>
            <ul className="grid gap-1.5 text-[13.5px] leading-snug">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <MdCheckCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ok-fg)]" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="glass flex flex-wrap items-center gap-2 rounded-[22px] p-3.5">
        <h2 className="mr-1 flex items-center gap-2 text-[15px] font-extrabold text-[var(--bad-fg)]"><MdBlock aria-hidden="true" /> Stopped by VISITRA</h2>
        <ul className="flex flex-wrap gap-2">
          {STOPPED.map((text) => (
            <li key={text} className="rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}>{text}</li>
          ))}
        </ul>
      </section>
    </main>
  </div>
);

export default Howitworks;
