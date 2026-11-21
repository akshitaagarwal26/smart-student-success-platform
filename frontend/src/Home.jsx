
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const features = [
    {
      icon: "📚",
      title: "Academic Performance",
      description:
        "Track your CGPA, semester marks, subject performance and academic progress.",
    },
    {
      icon: "📅",
      title: "Attendance Management",
      description:
        "Monitor attendance records and stay updated with your attendance percentage.",
    },
    {
      icon: "✨",
      title: "AI Student Insights",
      description:
        "Discover your strengths, identify weak subjects and get personalized suggestions.",
    },
    {
      icon: "🎯",
      title: "Goals & Tasks",
      description:
        "Set academic goals, manage daily tasks and track your learning progress.",
    },
    {
      icon: "📄",
      title: "Resume Analyzer",
      description:
        "Improve your resume with AI-powered feedback and suggestions.",
    },
    {
      icon: "💼",
      title: "Career Preparation",
      description:
        "Discover suitable jobs, analyze skill gaps and prepare for placements.",
    },
    {
      icon: "🧠",
      title: "Skill Development",
      description:
        "Identify missing technical skills and build a personalized learning path.",
    },
    {
      icon: "🎤",
      title: "AI Mock Interview",
      description:
        "Practice technical and HR interviews to improve your confidence.",
    },
  ];

  return (
    <div className="home-page">

      {/* Navigation */}
      <header className="home-navbar">
        <Link to="/" className="home-logo">
          Smart<span>Success</span>
        </Link>

        <nav className="home-nav">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>

          <Link to="/dashboard" className="home-dashboard-link">
            Dashboard
          </Link>

          <Link to="/login" className="home-login-link">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="home-hero" id="home">
        <div className="home-hero-content">
          <p className="home-eyebrow">
            AI-POWERED STUDENT SUCCESS PLATFORM
          </p>

          <h1>
            Build Your Potential.
            <br />
            <span>Achieve Your Dreams.</span>
          </h1>

          <p className="home-description">
            Smart Student Success Platform helps students track academic
            performance, improve skills, manage learning goals and prepare
            for their dream careers — all in one place.
          </p>

          <div className="home-hero-buttons">
            <Link to="/register" className="home-primary-btn">
              Get Started →
            </Link>

            <a href="#features" className="home-secondary-btn">
              Explore Features
            </a>
          </div>

          <div className="home-trust">
            <span>✓ Academic Tracking</span>
            <span>✓ AI Insights</span>
            <span>✓ Career Growth</span>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="home-preview">
          <div className="preview-top">
            <div>
              <span className="preview-label">STUDENT OVERVIEW</span>
              <h3>Your Progress 🚀</h3>
            </div>
            <div className="preview-avatar">🎓</div>
          </div>

          <div className="preview-main-stat">
            <span>Current CGPA</span>
            <h2>8.2 <small>/ 10</small></h2>
            <p>Keep learning and improving!</p>
          </div>

          <div className="preview-progress">
            <div>
              <span>Academic Progress</span>
              <strong>78%</strong>
            </div>
            <div className="preview-track">
              <div className="preview-fill academic-fill"></div>
            </div>
          </div>

          <div className="preview-progress">
            <div>
              <span>Attendance</span>
              <strong>85%</strong>
            </div>
            <div className="preview-track">
              <div className="preview-fill attendance-fill"></div>
            </div>
          </div>

          <div className="preview-bottom">
            <div>
              <span>🧠</span>
              <strong>8</strong>
              <small>Skills</small>
            </div>
            <div>
              <span>✅</span>
              <strong>12</strong>
              <small>Tasks</small>
            </div>
            <div>
              <span>🎯</span>
              <strong>68%</strong>
              <small>Readiness</small>
            </div>
          </div>

          <div className="preview-insight">
            ✨ Keep practicing DSA to improve your technical skills.
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features" id="features">
        <div className="home-section-heading">
          <p>WHAT WE OFFER</p>
          <h2>
            Everything You Need
            <br />
            to Succeed as a Student
          </h2>
          <span>
            One intelligent platform for academics, skills and career growth.
          </span>
        </div>

        <div className="home-feature-grid">
          {features.map((feature) => (
            <div className="home-feature-card" key={feature.title}>
              <div className="home-feature-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="home-about" id="about">
        <div className="home-about-visual">
          <div className="about-circle">🎓</div>
          <div className="about-floating-card">
            <span>✨</span>
            <div>
              <strong>Learn. Improve. Succeed.</strong>
              <p>Your journey starts here.</p>
            </div>
          </div>
        </div>

        <div className="home-about-content">
          <p className="home-eyebrow">ABOUT SMARTSUCCESS</p>

          <h2>
            Your Personal
            <br />
            Student Success Partner
          </h2>

          <p className="home-about-description">
            Smart Student Success Platform is designed to help students
            understand their academic performance, identify improvement
            areas, develop essential skills and become career-ready.
          </p>

          <div className="home-about-points">
            <p>✓ Personalized academic guidance</p>
            <p>✓ Smart attendance and marks tracking</p>
            <p>✓ AI-powered student recommendations</p>
            <p>✓ Skills and career development</p>
            <p>✓ Placement preparation support</p>
          </div>

          <Link to="/register" className="home-primary-btn">
            Start Your Journey →
          </Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="home-cta">
        <p>YOUR FUTURE STARTS TODAY</p>
        <h2>Ready to Become Your Best Version?</h2>
        <span>
          Track your progress, improve your skills and achieve your goals.
        </span>

        <Link to="/register" className="home-cta-btn">
          Get Started Now →
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div>
          <Link to="/" className="home-logo">
            Smart<span>Success</span>
          </Link>

          <p>
            Your intelligent companion for academic excellence and career growth.
          </p>
        </div>

        <div className="home-footer-links">
          <Link to="/">Home</Link>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login">Login</Link>
        </div>

        <p className="home-copyright">
          © 2026 Smart Student Success Platform. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default Home;
