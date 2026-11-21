
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { db, testConnection } = require("./config/db");
const attendanceRoutes = require("./routes/attendanceRoutes");
const insightsRoutes = require("./routes/insightsRoutes");
const app = express();
const authRoutes = require("./routes/authRoutes");
const academicRoutes = require("./routes/academicRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const learningRoadmapRoutes = require("./routes/learningRoadmapRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());
app.use("/api/academics", academicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/learning-roadmap", learningRoadmapRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Student Success Backend is running!"
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT DATABASE() AS database_name");

    res.json({
      success: true,
      message: "Database connected successfully!",
      database: result[0].database_name
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Smart Student Success Backend running on port ${PORT}`);
  await testConnection();
});
