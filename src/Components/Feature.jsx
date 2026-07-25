import React from 'react'
import Navbar from './Navbar';

const Feature = () => {

const features = [
  {
    title: "AI-Powered Face Recognition",
    desc: "Instantly identify visitors with secure AI-based facial recognition for faster and contactless check-ins."
  },
  {
    title: "Smart Visitor Registration",
    desc: "Quick and easy visitor registration with user-friendly forms."
  },
  {
    title: "Secure Entry System",
    desc: "Ensures only authorized visitors can enter using verification."
  },
  {
    title: "Visit Scheduling",
    desc: "Schedule visits in advance and avoid long queues."
  },
  {
    title: "Digital Visitor Pass",
    desc: "Generate instant passes with unique IDs."
  },
  {
    title: "Admin Dashboard",
    desc: "Manage and monitor all visitor activities easily."
  },
  {
    title: "Real-time Notifications",
    desc: "Get instant updates about visitor requests and approvals."
  }

];

  return (
    <>
      <Navbar/>

      <div className="mx-auto max-w-[1140px] px-4 pt-10 pb-20" style={{ animation: "fadeUp .5s ease both" }}>
        <div className="mb-11 text-center">
          <h1 className="font-display mb-2.5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[44px]" style={{ textWrap: "pretty" }}>
            Secure &amp; smart visitor experience
          </h1>
          <p className="text-[var(--muted)]">From registration to exit, manage every visitor seamlessly and securely.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <div
              key={index}
              className="clay-sm rounded-[26px] p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-clay)]"
            >
              <div className="font-display clay-sm mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <h2 className="font-display mb-2 text-[17px] font-bold">{item.title}</h2>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Feature
