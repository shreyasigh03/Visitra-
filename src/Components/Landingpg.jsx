import React from 'react'
import Navbar from './Navbar'
import backgroundImage from '../assets/landingPG.png';
import { NavLink } from 'react-router-dom'

const Landingpg = () => {
  return (
    <div>
      <Navbar/>
      <div className='w-full h-screen' style={{backgroundImage:`url(${backgroundImage})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}}>
        <div className='flex flex-col pl-[7%] pt-[6%] items-start h-full px-4'>
        <h1 className='font-bold w-[50%] text-[350%] mb-3'>Smart & Secure Visitor Management System</h1>
        <p className='mb-8 text-lg'>“Digitize visitor entry, enhance security, and manage records efficiently.”</p>
        <div className='flex gap-10'>
        <NavLink to="/AdminLogin"><button className='bg-[var(--bg-color)] w-40 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)]'>Login as Admin</button></NavLink>
        <NavLink to="/Visitor"><button className='bg-[var(--bg-color)] w-40 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)]'>Register as Visitor</button></NavLink>
         </div>
      </div>
      </div>
    </div>
  )
}

export default Landingpg
