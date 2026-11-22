import { useRef } from "react";
import { QRCode } from "react-qr-code";
import { MdCheckCircle, MdLock, MdMarkEmailRead, MdOutlineEditNote, MdSensorOccupied } from "react-icons/md";

// The path of every visit. The pass below moves along it by itself.
const STEPS = [
  { label: "Register", text: "A short form and one photo", badge: "REGISTERED", chip: "Details saved", Icon: MdOutlineEditNote, tone: "accent" },
  { label: "Email OTP", text: "Confirms who is coming", badge: "OTP VERIFIED", chip: "Email confirmed", Icon: MdMarkEmailRead, tone: "warn" },
  { label: "Approval", text: "The host approves the visit", badge: "APPROVED", chip: "Host approved", Icon: MdCheckCircle, tone: "ok" },
  { label: "Entry", text: "Face or QR at the gate", badge: "INSIDE", chip: "Face matched", Icon: MdSensorOccupied, tone: "ok" },
];

const TONES = {
  accent: { background: "var(--accent-soft)", color: "var(--accent)" },
  warn: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  ok: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
};

// Sample visitors, only for this picture.
const PASSES = [
  { name: "Priya Sharma", initials: "PS", visit: "Meeting · R. Mehta", id: "481264", time: "10:30" },
  { name: "Arjun Nair", initials: "AN", visit: "Interview · Dr. Rao", id: "730518", time: "11:15" },
  { name: "Fatima Khan", initials: "FK", visit: "Guest lecture · S. Iyer", id: "295046", time: "14:00" },
];

// Front card, then the two behind it.
const DECK = [
  { transform: "none", opacity: 1, zIndex: 3 },
  { transform: "translate(7%, -9%) scale(.93) rotate(4deg)", opacity: 0.7, zIndex: 2 },
  { transform: "translate(-8%, -13%) scale(.87) rotate(-5deg)", opacity: 0.45, zIndex: 1 },
];

const Pass = ({ pass, step, front }) => {
  const { badge, tone } = STEPS[step];
  const ready = step >= 2;
  return (
    <div className="glass-strong rounded-[28px]">
      {/* Only the front card shows its details. */}
      <div className="p-5 transition-opacity duration-500 sm:p-6" style={{ opacity: front ? 1 : 0 }}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="font-display text-[12px] font-extrabold tracking-[.14em] text-[var(--muted)]">VISITOR PASS</span>
        <span key={badge} className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide" style={{ ...TONES[tone], animation: "pop .45s ease both" }}>{badge}</span>
      </div>
      <div className="mb-4 flex items-center gap-3.5">
        <div className="font-display flex h-13 w-13 shrink-0 items-center justify-center rounded-[17px] text-lg font-extrabold text-white" style={{ background: "linear-gradient(160deg,#8b8ef1,#5457d6)" }}>{pass.initials}</div>
        <div className="min-w-0">
          <div className="truncate text-[17px] font-extrabold">{pass.name}</div>
          <div className="truncate text-[13px] text-[var(--muted)]">{pass.visit}</div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {[["PASS ID", pass.id], ["TODAY", pass.time]].map(([label, value]) => (
          <div key={label} className="tile px-3 py-2">
            <div className="text-[11px] font-bold tracking-wider text-[var(--muted)]">{label}</div>
            <div className="text-[15px] font-extrabold">{value}</div>
          </div>
        ))}
      </div>
      <div className="tile relative flex justify-center overflow-hidden rounded-[18px] p-3">
        <QRCode value={pass.id} size={84} className="rounded-lg bg-white p-2 transition duration-700" style={{ filter: ready ? "none" : "blur(5px)", opacity: ready ? 1 : 0.5 }} />
        {!ready && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="glass flex h-11 w-11 items-center justify-center rounded-full text-lg"><MdLock /></span>
          </span>
        )}
        {front && step === 3 && <span className="scan-line absolute inset-x-6 h-[3px] rounded-full" style={{ background: "#3fbf7f", boxShadow: "0 0 14px #3fbf7f" }} />}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {STEPS.map(({ label }, i) => (
          <span key={label} className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
            <span className="block h-full rounded-full transition-all duration-700" style={{ width: i <= step ? "100%" : "0%", background: "linear-gradient(90deg,#8b8ef1,#5457d6)" }} />
          </span>
        ))}
      </div>
      </div>
    </div>
  );
};

// A picture, so it is hidden from screen readers; the steps below it say the same.
const HeroPass = ({ step, person }) => {
  const sceneRef = useRef(null);
  const { chip, Icon, tone } = STEPS[step];

  function tilt(e) {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    sceneRef.current.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
  }

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex w-full max-w-[460px] items-center justify-center px-6 pb-4 pt-14 sm:pt-11"
      style={{ perspective: "1100px" }}
      onPointerMove={tilt}
      onPointerLeave={() => (sceneRef.current.style.transform = "none")}
    >
      <span className="hero-ring absolute left-1/2 top-1/2 h-[86%] w-[86%] rounded-full" />
      <div ref={sceneRef} className="relative w-[min(310px,100%)] transition-transform duration-300 ease-out" style={{ transformStyle: "preserve-3d" }}>
        <div style={{ animation: "floaty 8s ease-in-out infinite" }}>
          {/* The front card sits in the flow, so the deck has its height. */}
          <div className="grid">
            {PASSES.map((pass, i) => {
              const place = (i - person + PASSES.length) % PASSES.length;
              return (
                <div key={pass.id} className="col-start-1 row-start-1 transition-all duration-700 ease-in-out" style={DECK[place]}>
                  <Pass pass={pass} step={place === 0 ? step : 0} front={place === 0} />
                </div>
              );
            })}
          </div>
        </div>

        <span
          key={`${person}-${step}`}
          className={`glass-strong absolute z-10 flex items-center gap-2 whitespace-nowrap rounded-full py-2 pl-2 pr-4 text-[13px] font-extrabold ${step % 2 ? "-right-4 -top-12 sm:-right-14" : "-bottom-4 -left-4 sm:-left-14"}`}
          style={{ animation: "pop .5s .15s ease both" }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={TONES[tone]}><Icon /></span>
          {chip}
        </span>
      </div>
    </div>
  );
};

export const HeroSteps = ({ step }) => (
  <ol className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
    {STEPS.map(({ label, text, Icon }, i) => (
      <li key={label} className="glass relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[20px] p-3 transition duration-500 sm:p-3.5" style={i === step ? { transform: "translateY(-4px)", borderColor: "var(--accent2)" } : undefined}>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-xl transition duration-500"
          style={i === step ? { background: "linear-gradient(160deg,#8b8ef1,#5457d6)", color: "#fff" } : { background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <b className="block text-sm">{i + 1}. {label}</b>
          <span className="block text-[12.5px] leading-snug text-[var(--muted)]">{text}</span>
        </span>
      </li>
    ))}
  </ol>
);

export default HeroPass;
