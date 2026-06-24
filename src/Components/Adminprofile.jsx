import React from 'react'
import Adminnavbar from './Adminnavbar'
import { useState,useEffect } from 'react'
import Adminpic from "../assets/Admin.png"

const Adminprofile = () => {
    const [Name, setName] = useState("Admin");
    const [Phone, setPhone] = useState("770000683");

    const [Profilemail, setProfilemail] = useState("");
    const [Profilepass, setProfilepass] = useState("");
    

    //jb bhhi getitem kre use eseeffect and newstate bnaege 
    useEffect(() => {
      const storedemail=localStorage.getItem("Adminemail");
      const storedpass=localStorage.getItem("Adminpassword");
      console.log(storedemail);
      if(storedemail && storedpass){
      setProfilemail(storedemail);
      setProfilepass(storedpass);
      }
    }, [])
    





  return (
    <div>

        <Adminnavbar/>

    <div className="min-h-screen flex justify-center items-center ">
  
      <div className="w-[60%] bg-white shadow-lg rounded-2xl p-6  gap-6">
           
           <img src={Adminpic} alt="Admin" className="w-32 h-32 mb-4 " />
           <p className='mb-4'><b>Name:</b> {Name}</p>
           <p className='mb-4'><b>Email:</b> {Profilemail}</p>
           <p className='mb-4'><b>Password:</b> {Profilepass}</p>
           <p className='mb-4'><b>Phone No. :</b> {Phone}</p>
           <p className='mb-4'><b>Department:</b> Security Management</p>
           <p className='mb-4'><b>Joined On:</b> 29 march 2026</p>

       </div>
    </div>
    </div>
  )
}

export default Adminprofile
