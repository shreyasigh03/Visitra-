import React from 'react'
import Navbar from './Navbar'
import { NavLink } from 'react-router-dom'

const Landingpg = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* clay background blobs */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full opacity-15 blur-sm"
        style={{ background: "linear-gradient(140deg,var(--accent2),var(--accent))", animation: "floaty 9s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute -bottom-36 -left-28 h-[420px] w-[420px] rounded-full opacity-10 blur-md"
        style={{ background: "linear-gradient(140deg,var(--accent),var(--accent2))", animation: "floaty 12s ease-in-out infinite" }} />

      <Navbar />

      <div className="relative z-10 grid items-center gap-10 px-5 pt-8 pb-16 sm:px-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:px-20 lg:pt-16">
        <div style={{ animation: "fadeUp .6s ease both" }}>
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[#3FBF7F]" />
            Enterprise visitor management
          </div>
          <h1 className="font-display mb-4 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl" style={{ textWrap: "pretty" }}>
            Smart &amp; secure visitor management
          </h1>
          <p className="mb-8 max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)] sm:text-lg" style={{ textWrap: "pretty" }}>
            Digitize visitor entry, strengthen security, and manage records effortlessly — from
            registration and OTP verification to face-verified entry.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <NavLink to="/Visitor">
              <button className="btn-primary px-6 py-3.5 text-[15px]">Register as visitor</button>
            </NavLink>
            <NavLink to="/AdminLogin">
              <button className="clay-sm cursor-pointer rounded-[18px] px-6 py-3.5 text-[15px] font-extrabold text-[var(--ink)] transition hover:-translate-y-0.5">
                Login as admin
              </button>
            </NavLink>
          </div>
        </div>

        {/* floating pass-card visual */}
        <div className="relative hidden min-h-[420px] items-center justify-center md:flex">
          <div className="clay w-[min(340px,90%)] rounded-[28px] p-6" style={{ animation: "floaty 8s ease-in-out infinite" }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[13px] font-extrabold tracking-[.14em] text-[var(--muted)]">VISITOR PASS</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide" style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}>APPROVED</span>
            </div>
            <div className="mb-4 flex items-center gap-3.5">
              <div className="font-display flex h-14 w-14 items-center justify-center rounded-[18px] text-xl font-extrabold text-white"
                style={{ background: "linear-gradient(160deg,var(--accent2),var(--accent))", boxShadow: "var(--shadow-clay-sm)" }}>PS</div>
              <div>
                <div className="text-[17px] font-extrabold">Priya Sharma</div>
                <div className="text-[13px] text-[var(--muted)]">Meeting · R. Mehta</div>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div className="tile px-3 py-2.5">
                <div className="text-[11px] font-bold tracking-wider text-[var(--muted)]">PASS ID</div>
                <div className="mt-0.5 text-[15px] font-extrabold">481264</div>
              </div>
              <div className="tile px-3 py-2.5">
                <div className="text-[11px] font-bold tracking-wider text-[var(--muted)]">DATE</div>
                <div className="mt-0.5 text-[15px] font-extrabold">19 Jul 2026</div>
              </div>
            </div>
            <div className="tile flex justify-center rounded-[18px] p-3.5">
              <div className="h-24 w-24 rounded-lg opacity-85"
                style={{ background: "repeating-conic-gradient(var(--ink) 0% 25%,transparent 0% 50%) 0 0/12px 12px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landingpg
