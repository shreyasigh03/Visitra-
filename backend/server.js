const config = require("./config/env");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDB, connectOnce, isDbConnected } = require("./config/db");
const { isFaceServiceUp } = require("./utils/faceService");
const { requireDb, notFound, errorHandler } = require("./middleware/errors");
const { startCleanupSchedule } = require("./services/retention");
const { startMailAnswers } = require("./services/mailAnswers");
const visitorRoutes = require("./routes/visitorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const gateRoutes = require("./routes/gateRoutes");
const { chooseOrg } = require("./middleware/tenant");
const superRoutes = require("./routes/superRoutes");
const orgRoutes = require("./routes/orgRoutes");
const { startAutoClose } = require("./services/gate");
const teacherRoutes = require("./routes/teacherRoutes");

const app = express();

// Vercel puts one proxy in front; the phone tunnel connects from this computer.
app.set("trust proxy", config.online ? 1 : "loopback");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  req.body ??= {}; // Express 5 leaves body undefined when none is sent
  next();
});

if (config.webDir) {
  app.use(express.static(config.webDir));
} else {
  app.get("/", (req, res) => res.send("VISITRA backend running"));
}

// Used by the frontend to show a clear warning when something is down.
app.get("/api/health", async (req, res) => {
  const faceService = await isFaceServiceUp();
  if (config.online && !isDbConnected()) await connectOnce().catch((err) => console.error("[db]", err.message));
  const db = isDbConnected();
  res.status(db && faceService ? 200 : 503).json({ db, faceService, online: config.online });
});

app.use("/api/org", requireDb, orgRoutes);
app.use("/api/super", requireDb, superRoutes);
app.use("/api/visitor", requireDb, chooseOrg, visitorRoutes);
app.use("/api/admin", requireDb, chooseOrg, adminRoutes);
app.use("/api/gate", requireDb, chooseOrg, gateRoutes);
app.use("/api/teacher", requireDb, chooseOrg, teacherRoutes);

if (config.webDir) {
  // Website pages such as /TeacherDashboard; unknown /api addresses still get a 404.
  app.get(/^(?!\/api(\/|$))/, (req, res) => res.sendFile(path.join(config.webDir, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  if (config.online) return; // the computer on campus does the regular jobs
  console.log(`[server] Backend running on http://localhost:${config.port}`);
  connectDB();
  startCleanupSchedule();
  startMailAnswers();
  startAutoClose(isDbConnected);
});
