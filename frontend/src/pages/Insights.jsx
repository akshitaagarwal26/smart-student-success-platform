
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import "./Insights.css";

function Insights() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "https://smart-student-success-platform.onrender.com/api/insights",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("student");
          navigate("/login");
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load insights."
          );
        }

        setData(result);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [navigate]);

  if (loading) {
    return (
      <div className="insights-page">
        Loading student insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-page">
        <h2>Unable to load insights</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { insights, subjects = [] } = data;

  // Safe defaults for enhanced analytics
  const skills = insights.skills || {};
  const study = insights.studyPlanner || {};
  const roadmap = insights.roadmap || {};
  const resume = insights.resume || {};
  const interviews = insights.interviews || {};

  // Academic chart data
  const academicChartData = subjects
    .filter((item) => item.academic)
    .map((item) => ({
      subject: item.subject,
      percentage: item.academic.percentage,
    }));

  // Attendance chart data
  const attendanceChartData = subjects
    .filter((item) => item.attendance)
    .map((item) => ({
      subject: item.subject,
      percentage: item.attendance.percentage,
    }));

  const getPercentageClass = (percentage) => {
    if (percentage >= 75) return "good";
    if (percentage >= 60) return "average";
    return "low";
  };

  const safePercentage = (value) => {
    return Math.min(100, Math.max(0, Number(value) || 0));
  };

  return (
    <div className="insights-page">

      {/* Header */}
      <div className="insights-header">
        <div>
          <h1>AI Student Insights</h1>
          <p>
            Understand your academic performance and learning progress.
          </p>
        </div>

        <span className="insights-status">
          Enhanced Rule-Based Insights
        </span>
      </div>

      {/* Performance Charts */}
      <section className="insights-section">
        <h2>Performance Analytics 📊</h2>

        <div className="insights-chart-grid">

          {/* Academic Chart */}
          <div className="insights-chart-card">
            <h3>Academic Performance</h3>

            {academicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={academicChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    angle={-15}
                    textAnchor="end"
                    height={65}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Bar
                    dataKey="percentage"
                    name="Academic Score"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No academic data available.</p>
            )}
          </div>

          {/* Attendance Chart */}
          <div className="insights-chart-card">
            <h3>Attendance Analysis</h3>

            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    angle={-15}
                    textAnchor="end"
                    height={65}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Bar
                    dataKey="percentage"
                    name="Attendance"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No attendance data available.</p>
            )}
          </div>

        </div>
      </section>

      {/* Overall Performance */}
      <section className="insights-section">
        <h2>Overall Performance 🎯</h2>

        <div className="insights-stats-grid">
          <div className="insight-stat-card">
            <span>Academic Average</span>
            <h2>{insights.overallAverage ?? 0}%</h2>
          </div>

          <div className="insight-stat-card">
            <span>Overall Attendance</span>
            <h2>{insights.overallAttendance ?? 0}%</h2>
          </div>

          <div className="insight-stat-card">
            <span>Total Subjects</span>
            <h2>{insights.totalSubjects ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Total Classes</span>
            <h2>{insights.totalClasses ?? 0}</h2>
          </div>
        </div>
      </section>

      {/* Subject Analysis */}
      <section className="insights-section">
        <h2>Subject-wise Analysis 📚</h2>

        {subjects.length === 0 ? (
          <p>No subject records available yet.</p>
        ) : (
          <div className="insight-subject-grid">
            {subjects.map((subject, index) => {
              const academicPercentage =
                subject.academic?.percentage;

              const attendancePercentage =
                subject.attendance?.percentage;

              return (
                <div
                  className="insight-subject-card"
                  key={index}
                >
                  <h3>{subject.subject}</h3>

                  <div className="insight-progress-item">
                    <div className="insight-progress-heading">
                      <span>Academic Performance</span>
                      <strong>
                        {academicPercentage != null
                          ? `${academicPercentage}%`
                          : "No data"}
                      </strong>
                    </div>

                    {academicPercentage != null && (
                      <div className="insight-progress-track">
                        <div
                          className={`insight-progress-fill ${getPercentageClass(
                            academicPercentage
                          )}`}
                          style={{
                            width: `${safePercentage(
                              academicPercentage
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="insight-progress-item">
                    <div className="insight-progress-heading">
                      <span>Attendance</span>
                      <strong>
                        {attendancePercentage != null
                          ? `${attendancePercentage}%`
                          : "No data"}
                      </strong>
                    </div>

                    {attendancePercentage != null && (
                      <div className="insight-progress-track">
                        <div
                          className={`insight-progress-fill ${getPercentageClass(
                            attendancePercentage
                          )}`}
                          style={{
                            width: `${safePercentage(
                              attendancePercentage
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Skill Development */}
      <section className="insights-section">
        <h2>Skill Development Analysis 💻</h2>

        <div className="insights-stats-grid">
          <div className="insight-stat-card">
            <span>Total Skills</span>
            <h2>{skills.total ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Beginner Skills</span>
            <h2>{skills.beginner ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Advanced Skills</span>
            <h2>{skills.advanced ?? 0}</h2>
          </div>
        </div>

        <p className="insight-description">
          {(skills.beginner ?? 0) > 0
            ? `You have ${skills.beginner} beginner-level skills. Practice regularly to improve your proficiency.`
            : "Great progress! Continue developing your technical skills."}
        </p>
      </section>

      {/* Study Planner */}
      <section className="insights-section">
        <h2>Study Planner Progress 📚</h2>

        <div className="insights-stats-grid">
          <div className="insight-stat-card">
            <span>Completion</span>
            <h2>{study.completionPercentage ?? 0}%</h2>
          </div>

          <div className="insight-stat-card">
            <span>Completed Tasks</span>
            <h2>{study.completed ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Pending Tasks</span>
            <h2>{study.pending ?? 0}</h2>
          </div>
        </div>

        <div className="insight-progress-track">
          <div
            className="insight-progress-fill average"
            style={{
              width: `${safePercentage(
                study.completionPercentage
              )}%`,
            }}
          />
        </div>
      </section>

      {/* Learning Roadmap */}
      <section className="insights-section">
        <h2>Learning Roadmap Progress 🗺️</h2>

        <div className="insights-stats-grid">
          <div className="insight-stat-card">
            <span>Completion</span>
            <h2>{roadmap.completionPercentage ?? 0}%</h2>
          </div>

          <div className="insight-stat-card">
            <span>Completed Tasks</span>
            <h2>{roadmap.completed ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Pending Tasks</span>
            <h2>{roadmap.pending ?? 0}</h2>
          </div>
        </div>

        <div className="insight-progress-track">
          <div
            className="insight-progress-fill good"
            style={{
              width: `${safePercentage(
                roadmap.completionPercentage
              )}%`,
            }}
          />
        </div>
      </section>

      {/* Career Preparation */}
      <section className="insights-section">
        <h2>Career Preparation Analysis 🚀</h2>

        <div className="insights-stats-grid">
          <div className="insight-stat-card">
            <span>Resumes Analyzed</span>
            <h2>{resume.total ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Average ATS Score</span>
            <h2>{resume.averageScore ?? 0}%</h2>
          </div>

          <div className="insight-stat-card">
            <span>Interview Sessions</span>
            <h2>{interviews.total ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Completed Interviews</span>
            <h2>{interviews.completed ?? 0}</h2>
          </div>

          <div className="insight-stat-card">
            <span>Interview Average</span>
            <h2>{interviews.averageScore ?? 0}%</h2>
          </div>
        </div>
      </section>

      {/* Areas to Improve */}
      <section className="insights-section">
        <h2>Areas to Improve ⚠️</h2>

        <div className="insight-alert-grid">

          <div className="insight-alert-card">
            <h3>Weak Academic Subjects</h3>

            {insights.weakSubjects?.length > 0 ? (
              insights.weakSubjects.map((subject, index) => (
                <p key={index}>• {subject}</p>
              ))
            ) : (
              <p>No weak subjects identified.</p>
            )}
          </div>

          <div className="insight-alert-card">
            <h3>Attendance Risks</h3>

            {insights.attendanceRisks?.length > 0 ? (
              insights.attendanceRisks.map((subject, index) => (
                <p key={index}>• {subject}</p>
              ))
            ) : (
              <p>No attendance risks identified.</p>
            )}
          </div>

        </div>
      </section>

      {/* Smart Recommendations */}
      <section className="insights-section">
        <h2>Smart Recommendations ✨</h2>

        <div className="recommendations-card">
          {insights.recommendations?.length > 0 ? (
            insights.recommendations.map(
              (recommendation, index) => (
                <div
                  className="recommendation-item"
                  key={index}
                >
                  <span>💡</span>
                  <p>{recommendation}</p>
                </div>
              )
            )
          ) : (
            <p>No recommendations available right now.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <p className="insights-footer">
        These personalized insights are generated using your
        academic, attendance, skills, study planner, learning
        roadmap, resume, and interview records through enhanced
        rule-based analysis.
      </p>

    </div>
  );
}

export default Insights;
