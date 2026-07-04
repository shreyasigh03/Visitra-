const sendEmail = require("../utils/sendEmail");
const express = require("express");
const upload=require("../middleware/upload");

//router server hai idhr
const router = express.Router();
const Visitor = require("../models/Visitor");
const Otp = require("../models/Otp");

const axios = require("axios");
const path = require("path");





// Register visitor
router.post("/register",upload.single("photo"), async (req, res) => {
  try {
    
    //check file ari h ya nhi ari
    console.log(req.body);
    console.log(req.file);


      // 👇 YAHAN ye code likhna hai
    const imagePath = path.resolve(req.file.path);

    //axios return krta h output object form mai
    const response = await axios.post(
      "http://127.0.0.1:8000/generate-embedding",
      {
        image_path: imagePath
      }
    );
   console.log(response.data);
    //jo hmne photo di h regiter k tym agr usme face hi nhi h toh no face detect error aaeag or database m save hi nhi hgi
    if (!response.data.success) {
    return res.status(400).json({
        success: false,
        
        message: response.data.message
    });
}

    

    // Ab MongoDB me save karna
    const visitor = new Visitor({
      ...req.body,
      
      photo: req.file.path,
      faceEncoding: response.data.embedding
    });


   

    await visitor.save();
    console.log("after save");

    res.status(200).json({ message: "Details received. Please verify OTP." });
  } catch (error) {
    console.log("Error while saving visitor:", error);
    res.status(500).json({ error: "Error saving visitor" });
  }
});



// router.post("/verify-face", upload.single("img"),async(req,res)=>{
//   const imgpath=path.resolve(req.file.path);
//   try{
//     const response=await axios.post("http://127.0.0.1:8000/generate-embedding", {
//       image_path: imgpath
//     });
//     //agr face hi detect nhi hua toh --success fail aya toh

//     if (!response.data.success) {
//     return res.status(400).json({
//         success: false,
//         message: response.data.message
//     });
// }


//     const visitors=await Visitor.find({
//       status:"approved",
//     },{
//       faceEncoding:1
//     })
//     const liveEmbedding=response.data.embedding;

//     const compare= await axios.post("http://127.0.0.1:8000/compare-embeding",{
//       //json format m data jaega
//       visitors,
//       liveEmbedding

//     });
//     if(!compare.data.success){
//       //mtlb mathc nhi hua face
//       return res.json({
//         "success":false,
//         "message":"Face not Recognized"
//       })
//     }
//     //match hgya toh visitor ki details bhj do 
//     const visitor=await Visitor.findById(compare.data.visitor_id);
//      //agr bychnace visitor dlt hgya toh 
//      if(!visitor){
//       return res.json({
//         "status":false,
//         "message":"Visitor not found"

//       })
//     }

//     Date().now

//     return res.json({
//       "success":true,
//       "similarity":compare.data.similarity,
//       "visitor": visitor,
//       "message":"Match Found"
//     })

   
   
//   } catch (error) {
//     console.error("Error while verifying face:", error);
//     res.status(500).json({ error: "Error verifying face" });
//   }
// });




router.post("/verify-face", upload.single("img"), async (req, res) => {
  const imgpath = path.resolve(req.file.path);
  try {
    const response = await axios.post("http://127.0.0.1:8000/generate-embedding", {
      image_path: imgpath,
    });

    // agr face hi detect nhi hua toh --success fail aya toh
    if (!response.data.success) {
      return res.status(400).json({
        success: false,
        message: response.data.message,
      });
    }

    // NOTE: yaha status:"approved" wala filter hata diya hai
    // kyunki humein har visitor (approved/pending/rejected) ko
    // pehchan-ke uski entry/exit log karni hai, sirf approved wale ko nhi
    const visitors = await Visitor.find(
      {},
      {
        faceEncoding: 1,
      }
    );
    const liveEmbedding = response.data.embedding;

    const compare = await axios.post("http://127.0.0.1:8000/compare-embeding", {
      visitors,
      liveEmbedding,
    });

    if (!compare.data.success) {
      // mtlb match nhi hua face
      return res.json({
        success: false,
        message: "Face not Recognized",
      });
    }

    // match hgya toh visitor ki details nikal lo
    let visitor = await Visitor.findById(compare.data.visitor_id);

    // agr bychance visitor delete hgya toh
    if (!visitor) {
      return res.json({
        success: false,
        message: "Visitor not found",
      });
    }

    // ---- ENTRY / EXIT TIME LOGIC ----
    const now = new Date();
    let entryStatus = ""; // "entry" ya "exit" — frontend ko batane ke liye kya record hua

    if (!visitor.entryTime) {
      // pehli baar scan hua -> entry time set karo
      visitor.entryTime = now;
      entryStatus = "entry";
    } else if (visitor.entryTime && !visitor.exitTime) {
      // pehle se entry hai, exit nhi -> ye scan exit maana jaega
      visitor.exitTime = now;
      entryStatus = "exit";
    } else {
      // pehle entry+exit dono ho chuke the -> naya visit cycle shuru,
      // purani entry/exit reset karke fresh entry maano
      visitor.entryTime = now;
      visitor.exitTime = null;
      entryStatus = "entry";
    }

    await visitor.save();

    // visitor "approved" hai ya nhi, wo alag se batao
    // (entry/exit record ho jaegi chahe approved ho ya na ho)
    const authorized = visitor.status === "approved";

    let finalSuccess;
    let finalMessage;

    if(authorized){
      finalSuccess=true;
      finalMessage="Entry Granted - Authorized Visitor";


    }
    else{
      finalSuccess=false;
      finalMessage=" Not Authorized - Entry not Granted ";

    }

    return res.json({
      success:finalSuccess,
      similarity: compare.data.similarity,
      visitor,
      entryStatus, // "entry" | "exit"
      
     message:finalMessage
    });
  } catch (error) {
    console.error("Error while verifying face:", error);
    res.status(500).json({ error: "Error verifying face" });
  }
});





//admin wale pg p sari details idhr se fecth hri hai 
router.get("/all", async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching visitors" });
  }
});


//jb visitor data bhja toh admin k opss data aaya usne fir jb approve p click kia toh api cakll hui usne database se us visitor ka data fetch kia fir status change kia res bhja frontend s data chnge hua 
router.put("/update/:id", async (req, res) => {
  try {
    const { status, message } = req.body;

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    //  ab agr statsu approve hgya toh email jaegi 
    //y format h email ka 
    if (status === "approved" && updatedVisitor && updatedVisitor.email) {
      try {
        await sendEmail(
          updatedVisitor.email,
          `
<div style="font-family: Arial; padding: 10px;">

<img src="https://github.com/vanshika-0/visitor-management/raw/main/visitra_logo.png" style="height:50px; margin-bottom:10px;" />

<h3>Hello ${updatedVisitor.name || "User"}</h3>

<p>Your visit request has been <b>APPROVED</b>.</p>

<p><b>Host:</b> ${updatedVisitor.toMeet || "-"}</p>
<p><b>Date:</b> ${updatedVisitor.date || "-"}</p>
<p><b>Pass ID:</b> ${updatedVisitor.passId || "-"}</p>

<br/>

<p>Please carry your ID during the visit.</p>

<p><b>VISITRA Team</b></p>

</div>
          `
        );
      } catch (emailErr) {
        console.log("Email error:", emailErr);
      }
    }

    // agr admin n reject krdi toh email jaegi rejectyed wali 
    if (status === "rejected" && updatedVisitor && updatedVisitor.email) {
      try {
        await sendEmail(
          updatedVisitor.email,
          `
<div style="font-family: Arial; padding: 10px;">

<img src="https://github.com/vanshika-0/visitor-management/raw/main/visitra_logo.png" style="height:50px; margin-bottom:10px;" />

<h3>Hello ${updatedVisitor.name || "User"}</h3>

<p>Your visit request has been <b>REJECTED</b>.</p>

<p><b>Reason:</b> ${message || "Not specified"}</p>

<p><b>Host:</b> ${updatedVisitor.toMeet || "-"}</p>
<p><b>Date:</b> ${updatedVisitor.date || "-"}</p>

<br/>

<p>For any queries, reply to this email.</p>

<p><b>VISITRA Team</b></p>

</div>
          `
        );
      } catch (emailErr) {
        console.log("Reject email error:", emailErr);
      }
    }

    res.json(updatedVisitor);
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
});

//admin pe verify p click krege toh 
router.get("/verify/:passId", async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ passId: req.params.passId });

    if (!visitor) {
      return res.json({ status: "invalid" });
    }

    return res.json({ status: "valid", visitor });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

//otp wala function 
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // delete old OTP if exists
    await Otp.deleteMany({ email });

    // // store new OTP in DB
    // await Otp.create({
    //   email,
    //   otp,
    //   expiresAt: new Date(Date.now() + 1 * 60 * 1000)
    // });

 const newOtp = new Otp({
  email,
  otp,
  expiresAt: new Date(Date.now() + 1 * 60 * 1000),
});

await newOtp.save();

    await sendEmail(email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP" });
  }
});


//verify
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.json({ status: "invalid" });
    }

    if (Date.now() > record.expiresAt) {
      await Otp.deleteMany({ email });
      await Visitor.findOneAndUpdate(
        {email},
        {status:"verified"
        })

      return res.json({ status: "expired" });
    }

    if (record.otp === otp) {
      await Otp.deleteMany({ email });
      
      await Visitor.findOneAndUpdate(
        {email},
        {status:"verified"
        })

      return res.json({ status: "verified" });
    } else {
      return res.json({ status: "invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
});
module.exports = router;