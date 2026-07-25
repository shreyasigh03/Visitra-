import React from 'react'
import Navbar from './Navbar';

const Howitworks = () => {
    const steps = [
  {
    title: "Visitor Registration",
    desc: "Visitor fills the registration form with name, contact, host, and purpose."
  },
  {
    title: "OTP Verification",
    desc: "User verifies identity through OTP for secure access."
  },
  {
    title: "Request Submitted",
    desc: "Visitor request is stored and sent to admin for approval."
  },
  {
    title: "Admin Review",
    desc: "Admin checks details and either approves or rejects the request."
  },
  {
    title: "Approval Notification",
    desc: "Visitor receives email confirmation once approved."
  },
  {
    title: "Pass Generation",
    desc: "System generates a digital pass with unique ID."
  },
  {
    title: "Entry Verification",
    desc: "Admin verifies pass at entry using system."
  },
  {
    title: "Visit Tracking",
    desc: "All visitor data is stored securely for records."
  }
];

  return (
<>
  <Navbar/>

  <div className="mx-auto max-w-[1140px] px-4 pt-10 pb-20" style={{ animation: "fadeUp .5s ease both" }}>
    <div className="mb-11 text-center">
      <h1 className="font-display mb-2.5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[44px]">How VISITRA works</h1>
      <p className="text-[var(--muted)]" style={{ textWrap: "pretty" }}>
        A complete smart flow from visitor registration to approval and secure entry.
      </p>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((item, index) => (
        <div
          key={index}
          className="clay-sm rounded-[26px] p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-clay)]"
        >
          <div className="font-display mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[14px] text-[15px] font-extrabold text-white"
            style={{ background: "linear-gradient(160deg,var(--accent2),var(--accent))", boxShadow: "var(--shadow-clay-sm)" }}>
            {index + 1}
          </div>
          <h2 className="font-display mb-2 text-[17px] font-bold">{item.title}</h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</>
  )
}

export default Howitworks
