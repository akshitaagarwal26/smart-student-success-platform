
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

import "./Analytics.css";

const API_URL = "http://localhost:5000/api/analytics";

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          setError("Please log in to view your analytics.");
          setLoading(false);
          return;
        }

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load analytics.");
        }

        setData(result);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        Loading your analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h2>Unable to load analytics</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = [
    "#6366f1",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444"
  ];

  const studyData = [
    { name: "Completed", value: data.studyPlanner.completedTasks },
    { name: "Pending", value: data.studyPlanner.pendingTasks }
  ];

  const roadmapData = [
    { name: "Completed", value: data.roadmap.completedTasks },
    { name: "Pending", value: data.roadmap.pendingTasks }
  ];

  const proficiencyLabels = {
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert"
  };

  const skillData = data.skills.proficiencyDistribution.map(item => ({
    level: proficiencyLabels[item.level] || `Level ${item.level}`,
    count: item.count
  }));

  const formatMonth = (month) => {
    if (!month) return "";
    const [year, number] = month.split("-");
    return new Date(Number(year), Number(number) - 1)
      .toLocaleString("en-US", { month: "short", year: "2-digit" });
  };

  const attendanceData = data.attendance.monthlyTrend.map(item => ({
    ...item,
    month: formatMonth(item.month)
  }));

  const StatCard = ({ icon, title, value, subtitle }) => (
    <div className="analytics-stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{subtitle}</span>
    </div>
  );

  const ProgressCard = ({ title, completed, pending, percentage }) => (
    <div className="analytics-progress-card">
      <div className="progress-card-heading">
        <h3>{title}</h3>
        <strong>{percentage}%</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="progress-details">
        <span>Completed: {completed}</span>
        <span>Pending: {pending}</span>
      </div>
    </div>
  );

  return (
    <div className="analytics-page">

      <div className="analytics-header">
        <div>
          <p className="analytics-label">SMART STUDENT SUCCESS PLATFORM</p>
          <h1>Student Success Analytics 📊</h1>
          <p>
            Track your academic growth, learning progress and career readiness.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="analytics-stats-grid">

        <StatCard
          icon="🎓"
          title="Average Marks"
          value={`${data.academics.averageMarks}%`}
          subtitle={`${data.academics.totalRecords} academic records`}
        />

        <StatCard
          icon="📅"
          title="Attendance"
          value={`${data.attendance.percentage}%`}
          subtitle={`${data.attendance.present} present classes`}
        />

        <StatCard
          icon="💻"
          title="Skills Acquired"
          value={data.skills.totalSkills}
          subtitle="Recorded skills"
        />

        <StatCard
          icon="📚"
          title="Study Progress"
          value={`${data.studyPlanner.completionPercentage}%`}
          subtitle={`${data.studyPlanner.completedTasks}/${data.studyPlanner.totalTasks} tasks completed`}
        />

        <StatCard
          icon="🗺️"
          title="Roadmap Progress"
          value={`${data.roadmap.completionPercentage}%`}
          subtitle={`${data.roadmap.completedTasks}/${data.roadmap.totalTasks} tasks completed`}
        />

        <StatCard
          icon="📄"
          title="Average ATS Score"
          value={`${data.resume.averageAtsScore}%`}
          subtitle={`${data.resume.totalResumes} resumes analyzed`}
        />

        <StatCard
          icon="🎤"
          title="Interview Performance"
          value={`${data.interviews.averageScore}%`}
          subtitle={`${data.interviews.completedInterviews} completed interviews`}
        />

        <StatCard
          icon="🏆"
          title="Interview Sessions"
          value={data.interviews.totalInterviews}
          subtitle="Total practice sessions"
        />

      </section>

      {/* Academic Performance */}
      <section className="analytics-panel">
        <div className="analytics-panel-heading">
          <div>
            <h2>Academic Performance 📊</h2>
            <p>Subject-wise marks percentage</p>
          </div>
        </div>

        {data.academics.subjects.length > 0 ? (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.academics.subjects}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="percentage"
                  name="Marks"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="analytics-empty">No academic records available.</p>
        )}
      </section>

      {/* Attendance and Skills */}
      <section className="analytics-two-column">

        <div className="analytics-panel">
          <h2>Attendance Overview 📅</h2>
          <p>Monthly attendance percentage</p>

          <div className="analytics-chart">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Attendance"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="analytics-empty">No attendance data available.</p>
            )}
          </div>

          <div className="attendance-summary">
            <span>Present: {data.attendance.present}</span>
            <span>Absent: {data.attendance.absent}</span>
            <span>Total: {data.attendance.totalClasses}</span>
          </div>
        </div>

        <div className="analytics-panel">
          <h2>Skill Proficiency 💡</h2>
          <p>Your current skill levels</p>

          <div className="analytics-chart">
            {skillData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={skillData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Skills"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="analytics-empty">No skill data available.</p>
            )}
          </div>
        </div>

      </section>

      {/* Study and Roadmap */}
      <section className="analytics-two-column">

        <div className="analytics-panel">
          <h2>Study Planner 📚</h2>
          <p>Your study task completion</p>

          <ProgressCard
            title="Study Progress"
            completed={data.studyPlanner.completedTasks}
            pending={data.studyPlanner.pendingTasks}
            percentage={data.studyPlanner.completionPercentage}
          />

          <p className="analytics-extra-info">
            Total planned study time: {data.studyPlanner.totalMinutes} minutes
          </p>

          {studyData.some(item => item.value > 0) && (
            <div className="analytics-chart small-chart">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={studyData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {studyData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="analytics-panel">
          <h2>Learning Roadmap 🗺️</h2>
          <p>Your career skill development progress</p>

          <ProgressCard
            title="Roadmap Progress"
            completed={data.roadmap.completedTasks}
            pending={data.roadmap.pendingTasks}
            percentage={data.roadmap.completionPercentage}
          />

          {roadmapData.some(item => item.value > 0) && (
            <div className="analytics-chart small-chart">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={roadmapData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {roadmapData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </section>

      {/* Resume History */}
      <section className="analytics-panel">
        <h2>Resume Analysis History 📄</h2>
        <p>Your recent resume ATS scores</p>

        {data.resume.history.length > 0 ? (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Resume</th>
                  <th>ATS Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.resume.history.map(item => (
                  <tr key={item.id}>
                    <td>{item.fileName}</td>
                    <td>
                      <span className="score-badge">
                        {item.atsScore}%
                      </span>
                    </td>
                    <td>
                      {new Date(
                        item.createdAt.replace(" ", "T")
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="analytics-empty">No resume history available.</p>
        )}
      </section>

      {/* Interview History */}
      <section className="analytics-panel">
        <h2>Mock Interview Performance 🎤</h2>
        <p>Your recent interview practice sessions</p>

        {data.interviews.history.length > 0 ? (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Career Role</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.interviews.history.map(item => (
                  <tr key={item.id}>
                    <td>{item.role}</td>
                    <td>{item.difficulty}</td>
                    <td>
                      <span className="score-badge">
                        {item.score}%
                      </span>
                    </td>
                    <td>
                      <span className={
                        item.status === "Completed"
                          ? "status-completed"
                          : "status-pending"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="analytics-empty">No interview history available.</p>
        )}
      </section>

      <footer className="analytics-footer">
        SmartSuccess · Student Success Analytics · Learn. Improve. Succeed. 🎓
      </footer>

    </div>
  );
}

export default Analytics;
