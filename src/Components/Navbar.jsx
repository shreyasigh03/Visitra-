import React from 'react'
import { IoIosArrowDown } from "react-icons/io";
import { NavLink } from 'react-router-dom'
import logo from "../assets/visitra_logo.png";


const Navbar = () => {
  return (
    <div>

      
        <nav className='flex justify-between items-center text-[var(--primary-color)] bg-[var(--bg-color)] px-[6%] py-3 shadow-md fixed top-0 left-0 w-full z-50'>
        <NavLink to="/" className="pl-[6%] flex items-center">
          <img
            src={logo}
            alt="VISITRA logo"
            className="h-10 hover:scale-105 transition"
          />
        </NavLink>
        <ul className='flex gap-10 items-center'>
          
          {/* //icons css */}
        
        <NavLink to="/Feature"><li className='flex'>Features </li></NavLink>
        <NavLink to="/Works"><li className='flex'>How it works </li></NavLink>
        
      </ul>
      </nav>

      



     
    </div>
  )
}

export default Navbar