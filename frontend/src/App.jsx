
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./Dashboard";
import Academics from "./pages/Academics";
import Attendance from "./pages/Attendance";
import Insights from "./pages/Insights";
import StudyPlanner from "./pages/StudyPlanner";
import SkillGap from "./pages/SkillGap";
import LearningRoadmap from "./pages/LearningRoadmap";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import JobRecommendations from "./pages/JobRecommendations";
import MockInterview from "./pages/MockInterview";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/study-planner" element={<StudyPlanner />} />
        <Route path="/skill-gap" element={<SkillGap />} />
        <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route
    path="/mock-interview"
    element={<MockInterview />}
/>
        <Route
    path="/job-recommendations"
    element={<JobRecommendations />}
/>
        <Route
  path="/learning-roadmap"
  element={<LearningRoadmap />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
