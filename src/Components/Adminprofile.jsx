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
    <div className="min-h-screen">

        <Adminnavbar/>

      <div className="flex items-start justify-center px-4 py-8 sm:py-14">
        <div className="clay w-full max-w-[720px] overflow-hidden rounded-[28px]" style={{ animation: "fadeUp .4s ease both" }}>
          {/* gradient banner */}
          <div className="relative h-[110px]" style={{ background: "linear-gradient(160deg,var(--accent2),var(--accent))" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(300px 120px at 80% 0%,rgba(255,255,255,.25),transparent)" }} />
          </div>

          <div className="px-5 pb-7 sm:px-9">
            <div className="-mt-12 mb-6 flex flex-wrap items-end gap-5">
              <img
                src={Adminpic}
                alt="Admin"
                className="clay h-[104px] w-[104px] rounded-[28px] object-contain p-2"
              />
              <div className="pb-1.5">
                <h1 className="font-display text-2xl font-extrabold">{Name}</h1>
                <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">Security Management · VISITRA</p>
              </div>
              <span className="mb-2.5 ml-auto rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wide"
                style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}>
                ACTIVE
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">EMAIL</div>
                <div className="mt-1 break-all text-[15px] font-extrabold">{Profilemail}</div>
              </div>
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">PASSWORD</div>
                <div className="mt-1 text-[15px] font-extrabold tracking-[.2em]">{Profilepass}</div>
              </div>
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">PHONE NO.</div>
                <div className="mt-1 text-[15px] font-extrabold">{Phone}</div>
              </div>
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">DEPARTMENT</div>
                <div className="mt-1 text-[15px] font-extrabold">Security Management</div>
              </div>
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">JOINED ON</div>
                <div className="mt-1 text-[15px] font-extrabold">29 march 2026</div>
              </div>
              <div className="tile rounded-2xl px-4 py-3.5">
                <div className="text-[11px] font-extrabold tracking-wider text-[var(--muted)]">ROLE</div>
                <div className="mt-1 text-[15px] font-extrabold">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Adminprofile
