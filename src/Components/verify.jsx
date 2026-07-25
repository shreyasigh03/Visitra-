import React from 'react'

const verify = () => {
    const [timer, setTimer] = useState(null);
    const email=localStorage.getItem("Email");
    //phli bari ke lie
    useEffect(() => {
     //otp auto sent hojaega
     sendOTP();

    }, [third])

    //otp sent func
    async function sendOTP(){
        const response= await fetch(`${API_BASE_URL}/api/visitor/send-otp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
              });
        if(!response.ok){
            console.log(response.message);
            return;
        }
        //10sec bd invalid hojaega
        setTimer(10);
    }

    //otp send hgya
    //agr e ail send hgai uske bd msg show hoega otp sent on your email
    //timer strt krdia timer khtm hte h h resent otp ka btn
  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-10" style={{ animation: "fadeUp .5s ease both" }}>
      <div className="clay rounded-[28px] p-7 sm:p-9">
        <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight">OTP verification</h1>
        <p className="mb-6 text-[14.5px] leading-relaxed text-[var(--muted)]">
          Please enter the OTP (one-time password) sent to your registered
          email/phone number to complete your verification.
        </p>
        <input
          type="number"
          placeholder="Enter OTP sent on your email."
          className="input-clay font-display mb-4 w-full text-center text-lg font-bold tracking-[.35em]"
        />

        {timer > 0 && (
          <p className="text-[13.5px] text-[var(--muted)]">
            Timer end in <strong className="text-[var(--ink)]">{timer}s</strong>
          </p>
        )}
        {timer == 0 && (
          <button onClick={sendOTP()} className="btn-soft w-full py-3 text-sm">
            Didn't get the OTP? Resend it again
          </button>
        )}
      </div>
    </div>
  )
}

export default verify
