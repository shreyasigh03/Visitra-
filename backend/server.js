

// Force Google DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const visitorRoutes = require("./routes/visitorRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected to Atlas DB"))
  .catch((err) => console.log("Mongo Error:", err));

// routes
app.use("/api/visitor", visitorRoutes);
app.use("/api/admin", adminRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});