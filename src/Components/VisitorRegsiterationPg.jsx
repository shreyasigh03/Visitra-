//is lib se browser ke webcam ko access kr skte hai
import Webcam from "react-webcam";
import React, { useState, useRef } from "react";
import Navbar from "./Navbar";
import { IoMdPerson } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import { FaPhoneFlip } from "react-icons/fa6";
import { FaUserGroup } from "react-icons/fa6";
import { IoMdPhotos } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const VisitorRegsiterationPg = () => {
  const [Name, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [Phone, setPhone] = useState("");
  const [Reason, setReason] = useState("");
  const [Visitdate, setVisitdate] = useState("");
  const [ToMeet, setMeet] = useState("");
  const [photo, setphoto] = useState(null);
  const [preview, setPreview] = useState("");
  //ek ref variable bnaya webcam
  const webcamRef = useRef(null);

  const navigate = useNavigate();

  async function capturePhoto() {
    //webcamRef.current--ka mtlb actual component jiska ref webcamRef m stored hai
    //.getss--us component ka function
    //webcam m jo bhi store h uska ss lega fir base64 us img ko convert kr dega
    //initially img binary format m store hti hai uski ye strng format m convert kr deta hai
    //or ye encoded format m store hti h mtlb img k andr ecoded numbers hte hai
    //photo m base64 ecoded strng stored hai
    const imageSrc = webcamRef.current.getScreenshot();
    //bec img ko show krne k lie screen pe--img tag
    setPreview(imageSrc);

    //base64 ko blob convert(binary large object--imgae ka binary formnat)
    const blob = await fetch(imageSrc).then((res) => res.blob());

    //ab binary ko File m convert krenge--jpg/jpeg same
    const file = new File([blob], "visitor.jpg", {
      type: "image/jpeg",
    });
    setphoto(file);

    //???//
    // //ab khi p bhi localstorage.getitem(photo) photo likha toh y wali img mil jaegi data:image/jpeg;base64,/9j/4AAQSk...is format mai
    // localStorage.setItem("Photoo", file);
  }

  function handleName(e) {
    setName(e.target.value);
    //name local storage p store hgya ab usko is label s kisi bhi component m use kr skte hai
    localStorage.setItem("Name", e.target.value);
  }
  function handleEmail(e) {
    //phle values set kro
    setEmail(e.target.value);
    //ab email ko kisi bhi component m access kr skte hai,usko local storage pe store krdo
    localStorage.setItem("Email", e.target.value);
  }

  function handlePhone(e) {
    setPhone(e.target.value);
    localStorage.setItem("Phone", e.target.value);
  }

  function handleReason(e) {
    setReason(e.target.value);
  }
  // function handleVisitdate(e){

  // setVisitdate(e.target.value);
  // }
  function handlemeet(e) {
    setMeet(e.target.value);
    localStorage.setItem("Meet", e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!photo) {
  alert("Please capture a face image before registering.");
  return;
}

    const passId = Date.now().toString().slice(-6);
    localStorage.setItem("passId", passId);

    const formData = new FormData();
    formData.append("name", Name);
    formData.append("email", Email);
    formData.append("phone", Phone);
    formData.append("reason", Reason);
    formData.append("toMeet", ToMeet);
    formData.append("date", Visitdate);
    formData.append("photo", photo);
    formData.append("passId", passId);
    // const formData = {
    //   name: Name,
    //   email: Email,
    //   phone: Phone,
    //   reason: Reason,
    //   toMeet: ToMeet,
    //   date: Visitdate,
    //   passId,
    //   photo:photo
    // };

    //formdata kbhi strngify nhi krte or jb formdata bhj rhe h headers mt bhejo
    try {
      const res = await fetch(`${API_BASE_URL}/api/visitor/register`, {
        method: "POST",

        body: formData,
      });
      
      const data = await res.json();
      console.log(data.status,data.message);

      if(!res.ok){
        alert(data.message);
        return;
      }
      
      console.log(data.message);

      const endTime = Date.now() + 10000;
      localStorage.setItem("endTime", endTime);

      //alert("Visitor Registered ✅");
      //jb ek pg se dusre pg p data bhjena ho toh use krte hai state
      //fromform--check krne k lie ki otp pg pr register krke hi aae hai sidha browser m url likhke nhi aae 
      //replace wala ki otp pg se agr back dbya atoh ab home pg khulege ya isse phle wala pg ye wala pg nhi khulega
      navigate("/otp", { state: { fromForm: true }, replace: true });
    } catch (error) {
      console.error("fake img",error);
      alert("Error submitting form ❌");
    }
  }

  return (
    <div>
      <Navbar />
      <div className="place-items-center ">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start w-[50%] my-8"
          action="Submit"
        >
          <h1 className="my-5 text-[180%] font-bold mt-[6%] ">
            User Registeration Form
          </h1>
          <label className="text-lg text-left mb-1" htmlFor="">
            Name:{" "}
          </label>
          {/* agr icon ko input k andr dena h toh wrapper div */}
          <div className="relative w-full ">
            <IoMdPerson className="absolute text-sm mt-[1.5%] h-4 w-[35px]  ml-[95.3%]" />

            <input
              type="text"
              name="name"
              placeholder="Enter your Name"
              value={Name}
              onChange={handleName}
              className="w-[100%] mb-5 p-2 border rounded"
              required
            />
          </div>
          <label className="text-lg text-left mb-1" htmlFor="">
            Email:
          </label>
          <div className="relative w-full ">
            <MdEmail className="absolute text-sm mt-[1.5%] h-4 w-[35px]  ml-[95.3%]" />
            <input
              type="email"
              name="Email"
              placeholder="Enter your Email"
              value={Email}
              onChange={handleEmail}
              className="w-[100%]  mb-5 p-2 border rounded"
              required
            />
          </div>
          <label className="text-lg text-left mb-1" htmlFor="">
            Phone Number:
          </label>
          <div className="relative w-full ">
            <FaPhoneFlip className="absolute text-sm mt-[1.5%] h-4 w-[35px]  ml-[95.3%]" />
            <input
              type="tel"
              name="Phone"
              placeholder="Enter your Phone"
              value={Phone}
              onChange={handlePhone}
              className="w-[100%] mb-5 p-2 border rounded"
              required
            />
          </div>
          <label className="text-lg text-left mb-1" htmlFor="">
            Reason:
          </label>
          <div className="relative w-full ">
            <IoIosArrowDown className="absolute text-sm mt-[1.5%] h-4 w-[35px]  ml-[95.3%]" />

            <select
              name="reason"
              //for placeholder

              value={Reason}
              onChange={handleReason}
              className="w-[100%] mb-5 p-2 border rounded appearance-none"
              required
            >
              <option value="">Select Reason</option>
              <option value="meeting">Meeting</option>
              <option value="Interview">Interview</option>
              <option value="Delivery">Delivery</option>
              <option value="Maintenence">Maintenence</option>
              <option value="Visit">Visit</option>
            </select>
          </div>

          <label className="text-lg text-left mb-1" htmlFor="">
            Date:
          </label>
          <input
            type="date"
            name="Date of Visit"
            placeholder="Date of Visit"
            value={Visitdate}
            onChange={(e) => setVisitdate(e.target.value)}
            className="w-[100%] mb-5 p-2 border rounded"
            required
          />
          <label className="text-lg text-left mb-1" htmlFor="">
            Host Name:
          </label>
          <div className="relative w-full ">
            <FaUserGroup className="absolute text-sm mt-[1.5%] h-4 w-[35px]  ml-[95.3%]" />
            <input
              type="text"
              name="ToMeet"
              placeholder="Host Name"
              value={ToMeet}
              onChange={handlemeet}
              className="w-[100%] mb-6 p-2 border rounded"
              required
            />
          </div>

          {preview && (
            //img tag ko ya toh https://example.com/photo.jpg ,/images/photo.jpg,data:image/jpeg;base64,/9j/4AAQSk...,{URL.createObjectURL(file)} bs y hi smj aate hai usko file object
            //File {
            //    name: "visitor.jpg",
            //    size: 12345,
            //    type: "image/jpeg"
            // } y smj nhi aata or img ko hmne file m convert kr dia h islie preview m base64 store krva li show krvane k lie
            //yha browser photo ko decode krke img show krta hai--
            <img
              src={preview}
              alt="photo"
              className="w-[15%] h-32 object-cover rounded mb-3 mr-[44%]"
            />
          )}

          <label className="text-lg text-left mb-1">Profile Photo:</label>
          {/*           
          //yha webcam ek component h is component ke func us krne k lie iska ref bnana pdega*/}
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-[300px] mb-3"
          />

          <button
            type="button"
            //ye func run hojaega btn p click krne pr
            onClick={capturePhoto}
            className="bg-blue-500 p-2 rounded mb-5"
          >
            Capture Photo
          </button>

          <button className="bg-[var(--bg-color)] w-40 p-2 rounded hover:bg-[var(--hover-color)] text-[var(--primary-color)] mb-3">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorRegsiterationPg;
