
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ResumeAnalyzer.css";

const roles = [
  { id: "1", name: "Software Developer" },
  { id: "2", name: "AI / ML Engineer" },
  { id: "3", name: "Data Analyst" },
  { id: "4", name: "Full-Stack Developer" },
];

function parseArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/resume/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setHistory(data.analyses || []);
      }
    } catch (err) {
      console.error("History error:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedRole) {
      setError("Please select your target career role.");
      return;
    }

    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("roleId", selectedRole);

      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/resume/analyze",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Resume analysis failed.");
      }

      setAnalysis(data.analysis);
      setFile(null);

      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open a saved analysis from history
  const handleViewHistory = (item) => {
    setError("");

    const foundSkills = parseArray(item.role_skills_found);
    const missingSkills = parseArray(item.role_missing_skills);

    const totalRoleSkills =
      foundSkills.length + missingSkills.length;

    const roleMatchPercentage =
      totalRoleSkills > 0
        ? Math.round((foundSkills.length / totalRoleSkills) * 100)
        : null;

    setAnalysis({
      id: item.id,
      fileName: item.file_name,
      atsScore: item.ats_score,
      skillsFound: parseArray(item.skills_found),
      missingSkills: parseArray(item.missing_skills),
      sectionsFound: parseArray(item.sections_found),
      suggestions: parseArray(item.suggestions),
      targetRoleId: item.target_role_id,
      targetRoleName:
        roles.find((role) => role.id === String(item.target_role_id))
          ?.name || null,
      roleSkillsFound: foundSkills,
      roleMissingSkills: missingSkills,
      roleSuggestions: parseArray(item.role_suggestions),
      roleMatchPercentage,
    });

    if (item.target_role_id) {
      setSelectedRole(String(item.target_role_id));
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="resume-page">
      <header className="resume-header">
        <div>
          <Link to="/dashboard" className="resume-back">
            ← Back to Dashboard
          </Link>

          <h1>AI Resume Analyzer 📄</h1>

          <p>
            Analyze your resume, identify skill gaps and improve
            your ATS compatibility.
          </p>
        </div>
      </header>

      {/* Upload section */}
      <section className="resume-upload-card">
        <div className="resume-upload-icon">📄</div>

        <h2>Upload Your Resume</h2>

        <p>Upload your resume in PDF format (Maximum 5 MB).</p>

        <label htmlFor="targetRole">
          Select Your Target Career Role
        </label>

        <select
          id="targetRole"
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setError("");
            setAnalysis(null);
          }}
        >
          <option value="">-- Select Career Role --</option>

          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError("");
            setAnalysis(null);
          }}
        />

        {file && (
          <p className="selected-file">
            Selected: {file.name}
          </p>
        )}

        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing Resume..." : "Analyze My Resume →"}
        </button>

        {error && <p className="resume-error">{error}</p>}
      </section>

      {/* Analysis report */}
      {analysis && (
        <section className="resume-results">
          <h2>Resume Analysis Report</h2>

          <div className="resume-score-card">
            <div className="score-circle">
              <strong>{Number(analysis.atsScore).toFixed(2)}%</strong>
              <span>ATS Estimate</span>
            </div>

            <div>
              <h3>{analysis.fileName}</h3>
              <p>Your resume analysis report.</p>
              <small>
                This is a rule-based estimate, not an official ATS score.
              </small>
            </div>
          </div>

          {/* Role-specific report */}
          {analysis.targetRoleId && (
            <div className="resume-result-card role-analysis-card">
              <h3>🎯 Career Role Analysis</h3>

              <h4>{analysis.targetRoleName || "Selected Career Role"}</h4>

              <div className="role-match-score">
                <strong>
                  {analysis.roleMatchPercentage ?? 0}%
                </strong>
                <span>Role Skill Match</span>
              </div>

              <p>
                This percentage measures how many configured role
                skills were detected in your resume.
              </p>

              <h4>✅ Role Skills Found</h4>

              <div className="skill-tags">
                {analysis.roleSkillsFound?.length > 0 ? (
                  analysis.roleSkillsFound.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <p>No matching role skills detected.</p>
                )}
              </div>

              <h4>⚠️ Missing Role Skills</h4>

              <div className="skill-tags missing-tags">
                {analysis.roleMissingSkills?.length > 0 ? (
                  analysis.roleMissingSkills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <p>No missing configured role skills.</p>
                )}
              </div>

              <h4>💡 Role-Specific Suggestions</h4>

              {analysis.roleSuggestions?.length > 0 ? (
                <ul>
                  {analysis.roleSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p>No role-specific suggestions available.</p>
              )}
            </div>
          )}

          <div className="resume-result-grid">
            <div className="resume-result-card">
              <h3>✅ Skills Found</h3>

              <div className="skill-tags">
                {analysis.skillsFound?.length > 0 ? (
                  analysis.skillsFound.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <p>No matching skills detected.</p>
                )}
              </div>
            </div>

            <div className="resume-result-card">
              <h3>⚠️ Missing Skills</h3>

              <div className="skill-tags missing-tags">
                {analysis.missingSkills?.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <small>
                These are general keywords, not mandatory skills
                for every job.
              </small>
            </div>

            <div className="resume-result-card">
              <h3>📋 Resume Sections Found</h3>

              <div className="skill-tags">
                {analysis.sectionsFound?.length > 0 ? (
                  analysis.sectionsFound.map((section) => (
                    <span key={section}>{section}</span>
                  ))
                ) : (
                  <p>No section details available.</p>
                )}
              </div>
            </div>

            <div className="resume-result-card">
              <h3>💡 Improvement Suggestions</h3>

              {analysis.suggestions?.length > 0 ? (
                <ul>
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p>No suggestions available.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Previous analyses */}
      <section className="resume-history">
        <h2>Previous Resume Analyses</h2>

        {history.length === 0 ? (
          <p>No previous resume analyses found.</p>
        ) : (
          history.map((item) => (
            <button
              type="button"
              className="history-item"
              key={item.id}
              onClick={() => handleViewHistory(item)}
            >
              <div>
                <strong>{item.file_name}</strong>
                <small>
                  {new Date(item.created_at).toLocaleDateString()}
                </small>
              </div>

              <span>{item.ats_score}% →</span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}

export default ResumeAnalyzer;
