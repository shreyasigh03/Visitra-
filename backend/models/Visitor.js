const mongoose = require("mongoose");

//required or default sth m mt likho usse agr required false hgya toh default add hojaega
const visitorSchema = new mongoose.Schema({
  //required mtlb field compulsory hai hni hi chahiye
  name: { type: String, required: true },
  email: String,
  phone: {type:String, required:true},
  reason: {type:String,required:true},
  toMeet: String,
  date: Date,
  passId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "pending"
  },
  entryTime: {type:Date,default:null},
  exitTime: {type:Date,default:null},
  //live photo capture hui hai jo gate pe vo store hogi
  photo:{
    type: String,
   
    required: true
  },
  //jo photo register tym dali thi uski encoding store hogi
  faceEncoding:{
    type:[Number],
    default:[]
  }
}, { timestamps: true });
//ye ek field h jisse created at and updatedat field bn jaege jisme jis time p ye document create hua tha mtlb jb user n register kia vo tym store hga or updated at m jb bhi document update hra h vo tym store hga 
//visitor n kb register kia y pta lg jaega ///ya kb y docu update hua
module.exports = mongoose.model("Visitor", visitorSchema);