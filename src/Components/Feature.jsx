import React from 'react'
import Navbar from './Navbar';

const Feature = () => {

const features = [
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
      
      <div className='my-10'>
      <h1 className='text-[200%] mt-[6%] font-bold text-center'>Secure & Smart Visitor Experience</h1>
      <p className='text-center'>From registration to exit, manage every visitor seamlessly and securely.</p>
      </div>


       <div className="p-6 mx-[10%] mt-[4%] grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((item, index) => (
        <div
          key={index}
          className="p-5 rounded-2xl shadow-md hover:shadow-xl transition duration-300 bg-white"
        >
          <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
          <p className="text-sm text-gray-600">{item.desc}</p>
        </div>
      ))}
    </div>
    </>
  );
}

export default Feature