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
    <div>
      <h1>OTP VERIFICATION</h1>
      <p>Please enter the OTP(One-Time-Password)sent to your registered email/phone number to complete your verification.</p>
      <input type="number"
      placeholder='Enter OTP sent on your email.' />
      
      {timer>0 && (
        <p>Timer end in {timer}seconds</p>
      )}
      {timer==0 && (<button onClick={sendOTP()}>Didn't get the OTP? Resend it again</button>)}
    </div>
  )
}

export default verify
