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

  <div className="text-center mt-10">
    <h1 className="text-3xl font-bold mt-[6%]">How VISITRA Works</h1>
    <p className="text-gray-600 mt-2">
      A complete smart flow from visitor registration to approval and secure entry.
    </p>
  </div>

  <div className="mx-[8%] mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
    {steps.map((item, index) => (
      <div
        key={index}
        className="p-6 rounded-2xl bg-white shadow-md hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
      >
        <div className="text-blue-500 font-bold text-sm mb-2">
          Step {index + 1}
        </div>
        <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
        <p className="text-gray-600 text-sm">{item.desc}</p>
      </div>
    ))}
  </div>
</>
  )
}

export default Howitworks