
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  // Check login and load student information
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const savedStudent = sessionStorage.getItem("student");

    if (!token || !savedStudent) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setStudent(JSON.parse(savedStudent));
    } catch (error) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("student");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          "https://smart-student-success-platform.onrender.com/api/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load dashboard data"
          );
        }

        setDashboardData(data);
        setDashboardError("");
      } catch (error) {
        console.error("Dashboard error:", error);
        setDashboardError(error.message);
      }
    };

    fetchDashboard();
  }, []);

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("student");
    navigate("/login", { replace: true });
  };

  // Loading states
  if (!student) {
    return (
      <div className="dashboard-loading">
        Loading student information...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-loading">
        {dashboardError || "Loading your dashboard..."}
        {dashboardError && (
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        )}
      </div>
    );
  }

  // Dashboard statistics
  const stats = [
    {
      icon: "📝",
      value: `${dashboardData.academics?.averageMarks ?? 0}%`,
      label: "Average Marks",
      color: "purple",
    },
    {
      icon: "📅",
      value: `${dashboardData.attendance?.attendancePercentage ?? 0}%`,
      label: "Attendance",
      color: "blue",
    },
    {
      icon: "🎯",
      value: `${dashboardData.career?.readiness ?? 0}%`,
      label: "Career Readiness",
      color: "orange",
    },
    {
      icon: "📚",
      value: `${dashboardData.studyPlan?.completedTasks ?? 0}/${dashboardData.studyPlan?.totalTasks ?? 0}`,
      label: "Study Tasks Completed",
      color: "green",
    },
  ];

  const subjects = dashboardData.subjects || [];

  const studyTotal = Number(
    dashboardData.studyPlan?.totalTasks || 0
  );

  const studyCompleted = Number(
    dashboardData.studyPlan?.completedTasks || 0
  );

  const roadmapTotal = Number(
    dashboardData.roadmap?.totalTasks || 0
  );

  const roadmapCompleted = Number(
    dashboardData.roadmap?.completedTasks || 0
  );

  const roadmapPercentage =
    roadmapTotal > 0
      ? Math.round((roadmapCompleted / roadmapTotal) * 100)
      : 0;

  // Career features
  const features = [
    {
      icon: "📄",
      title: "Resume Analyzer",
      description: "Improve your resume with AI-powered feedback.",
      link: "/resume-analyzer",
      button: "Analyze Resume",
    },
    {
      icon: "💼",
      title: "Job Recommendations",
      description: "Explore opportunities matching your career goals.",
      link: "#jobs",
      button: "Find Jobs",
    },
    {
      icon: "🎯",
      title: "Skill Gap Analysis",
      description: "Discover skills you need to develop next.",
      link: "/skill-gap",
      button: "Check Skills",
    },
    {
      icon: "🎤",
      title: "AI Mock Interview",
      description: "Practice technical and HR interview questions.",
      link: "#interview",
      button: "Start Interview",
    },
  ];

  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          Smart<span>Success</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav>
          <Link to="/dashboard" className="active">
            🏠 Dashboard
          </Link>

          <Link to="/academics">📚 Academics</Link>
          <Link to="/attendance">📅 Attendance</Link>
          <Link to="/study-planner">📅 Smart Study Planner</Link>
          <Link to="/insights">🤖 AI Student Insights</Link>
          <Link to="/skill-gap">🎯 Skill Gap Analysis</Link>
          <Link to="/analytics">
  <span>📊</span>
  Student Analytics
</Link>
          <Link to="/learning-roadmap">
            📚 Personalized Learning Roadmap
          </Link>

          <Link to="/resume-analyzer">
  📄 Resume Analyzer
</Link>

<Link to="/job-recommendations">
  💼 Job Recommendations
</Link>

<Link to="/mock-interview">
  🎤 Mock Interview
</Link>
        </nav>

        <div className="sidebar-bottom">

          <p className="sidebar-label">YOUR ACCOUNT</p>

          <div className="student-profile">
            <span>👤</span>

            <div>
              <strong>{student.name}</strong>
              <small>{student.email}</small>
            </div>
          </div>

          <button
            type="button"
            className="logout"
            onClick={handleLogout}
          >
            ↩ Logout
          </button>

        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content" id="dashboard">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <p className="small-title">
              SMART STUDENT SUCCESS PLATFORM
            </p>

            <h1>Welcome back, {student.name}! 👋</h1>

            <p>
              Track your academics, build your skills, and prepare
              for your dream career.
            </p>
          </div>

          <div className="student-avatar" title="Student profile">
            🎓
          </div>

        </header>

        {/* Statistics */}
        <section
          className="student-stats"
          aria-label="Student statistics"
        >
          {stats.map((stat) => (
            <div
              className={`student-stat ${stat.color}`}
              key={stat.label}
            >
              <div className="stat-icon">{stat.icon}</div>
              <h2>{stat.value}</h2>
              <p>{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Academic Performance */}
        <section
          id="academics"
          className="dashboard-section"
        >

          <div className="section-heading">
            <div>
              <h2>Academic Performance 📊</h2>
              <p>Your actual subject-wise academic records.</p>
            </div>

            <Link to="/academics">View Academics →</Link>
          </div>

          <div className="academic-card">

            {subjects.length > 0 ? (
              subjects.map((subject) => {
                const score = Math.min(
                  100,
                  Math.max(0, Number(subject.score) || 0)
                );

                return (
                  <div
                    className="subject-row"
                    key={subject.name}
                  >
                    <div className="subject-info">
                      <span>{subject.name}</span>
                      <strong>{score}%</strong>
                    </div>

                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={subject.name}
                      aria-valuenow={score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p>
                No academic records found. Add your marks in the
                Academics module to see your performance.
              </p>
            )}

          </div>
        </section>

        {/* Attendance and Career Insights */}
        <div className="dashboard-columns">

          {/* Attendance */}
          <section
            id="attendance"
            className="dashboard-section"
          >
            <h2>Attendance Overview 📅</h2>

            <div className="academic-card attendance-card">

              <div className="attendance-circle">
                <div>
                  <strong>
                    {dashboardData.attendance?.attendancePercentage ?? 0}%
                  </strong>
                  <span>Attendance</span>
                </div>
              </div>

              <p>
                Present classes:{" "}
                {dashboardData.attendance?.presentClasses ?? 0}
              </p>

              <p>
                Total classes:{" "}
                {dashboardData.attendance?.totalClasses ?? 0}
              </p>

              <Link to="/attendance">
                Manage Attendance →
              </Link>

            </div>
          </section>

          {/* Career Insights */}
          <section
            id="insights"
            className="dashboard-section"
          >
            <h2>Career Insights ✨</h2>

            <div className="academic-card insight-card">

              <div className="insight-item">
                <span>🎯</span>

                <div>
                  <strong>Your Career Goal</strong>

                  <p>
                    {dashboardData.career?.roleName ||
                      "Not assessed yet"}
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <span>🚀</span>

                <div>
                  <strong>Career Readiness</strong>

                  <p>
                    Your current readiness score is{" "}
                    {dashboardData.career?.readiness ?? 0}%.
                    Continue improving your skills.
                  </p>
                </div>
              </div>

              <Link to="/skill-gap">
                Explore Skill Gaps →
              </Link>

            </div>
          </section>

        </div>

        {/* Study Planner */}
        <section
          id="tasks"
          className="dashboard-section"
        >

          <div className="section-heading">
            <div>
              <h2>My Study Planner 📚</h2>
              <p>Track your daily learning activities.</p>
            </div>

            <Link to="/study-planner">
              Open Study Planner →
            </Link>
          </div>

          <div className="academic-card">

            <h3>
              {studyCompleted} / {studyTotal} tasks completed
            </h3>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    studyTotal > 0
                      ? (studyCompleted / studyTotal) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <p>
              {studyTotal - studyCompleted} tasks remaining.
            </p>

          </div>
        </section>

        {/* Learning Roadmap */}
        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <h2>Personalized Learning Roadmap 🗺️</h2>
              <p>Monitor your career skill development progress.</p>
            </div>

            <Link to="/learning-roadmap">
              View Roadmap →
            </Link>
          </div>

          <div className="academic-card">

            <h3>
              {roadmapCompleted} / {roadmapTotal} tasks completed
            </h3>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${roadmapPercentage}%`,
                }}
              />
            </div>

            <p>
              {roadmapPercentage}% roadmap completed
            </p>

          </div>
        </section>

        {/* Career and Placement Features */}
        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <h2>Career & Placement Preparation 💼</h2>
              <p>
                Your career development tools in one place.
              </p>
            </div>
          </div>

          <div className="dashboard-cards">

            {features.map((feature) => (
              <div
                className="dashboard-card"
                key={feature.title}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                {feature.link.startsWith("/") ? (
                  <Link
                    className="feature-button"
                    to={feature.link}
                  >
                    {feature.button} →
                  </Link>
                ) : (
                  <a
                    className="feature-button"
                    href={feature.link}
                  >
                    {feature.button} →
                  </a>
                )}
              </div>
            ))}

          </div>
        </section>

        {/* Footer */}
        <footer className="dashboard-footer">
          <p>
            Smart Student Success Platform · Learn. Improve.
            Succeed. 🎓
          </p>
        </footer>

      </main>
    </div>
  );
}

export default Dashboard;
