import { Link } from "react-router-dom";
import { MdArrowForward, MdPersonAddAlt1 } from "react-icons/md";
import Navbar from "./Navbar";
import HeroPass, { HeroSteps } from "./HeroPass";
import StaffLogin from "./StaffLogin";
import { useHeroStep } from "../hooks/useHeroStep";
import { getOrg } from "../lib/org";

const Landingpg = () => {
  const { step, person } = useHeroStep();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="aurora -right-24 -top-32 h-[440px] w-[440px]" style={{ background: "var(--accent2)" }} />
        <span className="aurora -bottom-40 -left-28 h-[460px] w-[460px]" style={{ background: "var(--accent)", animationDelay: "-6s" }} />
        <span className="aurora left-[38%] top-[30%] h-[300px] w-[300px]" style={{ background: "#3fbf7f", opacity: 0.1, animationDelay: "-11s" }} />
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-between gap-6 px-4 pb-6 sm:px-10">
        <div className="grid flex-1 items-center gap-6 pt-2 md:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div style={{ animation: "fadeUp .6s ease both" }}>
            <div className="glass mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-[var(--muted)]">
              <span className="live-dot h-2 w-2 rounded-full bg-[#3FBF7F]" />
              {getOrg().name}
            </div>
            <h1 className="font-display mb-4 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl xl:text-6xl" style={{ textWrap: "balance" }}>
              Smart &amp; secure visitor management
            </h1>
            <p className="mb-6 text-lg font-semibold text-[var(--muted)] sm:text-xl">
              Every guest expected. Every entry verified.
            </p>
            <Link to="/Visitor" className="btn-primary btn-shine flex w-full items-center gap-4 rounded-[24px] p-4 sm:max-w-[440px] sm:p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl"><MdPersonAddAlt1 aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-xl font-extrabold sm:text-[22px]">Register as visitor</span>
                <span className="block text-sm font-semibold text-white/90">Takes under a minute</span>
              </span>
              <MdArrowForward aria-hidden="true" className="shrink-0 text-2xl" />
            </Link>
            <div className="mt-5 flex min-h-12 items-center">
              <StaffLogin />
            </div>
          </div>

          <HeroPass step={step} person={person} />
        </div>

        <HeroSteps step={step} />
      </main>
    </div>
  );
};

export default Landingpg;
