
import { useEffect, useState } from "react";
import "./SkillGap.css";
import { Link } from "react-router-dom";

const API = "https://smart-student-success-platform.onrender.com/api/skill-gap";

function SkillGap() {
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load skills");
      }

      setRoles(data.roles);
      setSkills(data.skills);

      if (data.roles.length > 0) {
        setSelectedRole(String(data.roles[0].id));
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSkill(skillId, level) {
    setSaving(skillId);
    setMessage("");

    try {
      const response = await fetch(`${API}/skills/${skillId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proficiency_level: Number(level),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save skill");
      }

      setSkills((previous) =>
        previous.map((skill) =>
          skill.id === skillId
            ? { ...skill, proficiency_level: Number(level) }
            : skill
        )
      );

      setMessage("Skill level saved successfully!");
      await loadAnalysis(selectedRole);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(null);
    }
  }

  async function loadAnalysis(roleId) {
    if (!roleId) return;

    try {
      const response = await fetch(`${API}/analysis/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Analysis failed");
      }

      setAnalysis(data);
    } catch (error) {
      setMessage(error.message);
      setAnalysis(null);
    }
  }

  useEffect(() => {
    if (selectedRole) {
      loadAnalysis(selectedRole);
    }
  }, [selectedRole]);

  const groupedSkills = skills.reduce((groups, skill) => {
    const category = skill.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(skill);
    return groups;
  }, {});

  if (loading) {
    return <div className="skill-page">Loading skill analysis...</div>;
  }

  return (
    <div className="skill-page">
      <div className="skill-header">
        <div>
          <p className="skill-eyebrow">CAREER DEVELOPMENT</p>
          <h1>Skill Gap Analysis</h1>
          <p>
            Assess your skills and discover what you need to learn
            for your target career.
          </p>
        </div>
      </div>

      {message && (
        <div className="skill-message">{message}</div>
      )}

      <section className="skill-role-section">
        <label htmlFor="career-role">Choose your target career</label>

        <select
          id="career-role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </section>

      {analysis && (
        <section className="skill-summary">
          <div className="skill-summary-card">
            <span>Career Readiness</span>
            <strong>{analysis.readiness}%</strong>
          </div>

          <div className="skill-summary-card">
            <span>Required Skills</span>
            <strong>{analysis.totalSkills}</strong>
          </div>

          <div className="skill-summary-card">
            <span>Skills Ready</span>
            <strong>
              {analysis.skills.filter(
                (skill) => skill.status === "Ready"
              ).length}
            </strong>
          </div>
        </section>
      )}

      <section className="skill-assessment">
        <h2>Assess Your Skills</h2>
        <p className="skill-help">
          Select your current proficiency level for each skill.
          Your assessment is saved automatically.
        </p>

        <div className="skill-level-guide">
          <span>1 - Beginner</span>
          <span>2 - Basic</span>
          <span>3 - Intermediate</span>
          <span>4 - Advanced</span>
          <span>5 - Expert</span>
        </div>

        {Object.entries(groupedSkills).map(([category, items]) => (
          <div className="skill-category" key={category}>
            <h3>{category}</h3>

            {items.map((skill) => (
              <div className="skill-row" key={skill.id}>
                <span>{skill.skill_name}</span>

                <select
                  value={skill.proficiency_level ?? ""}
                  disabled={saving === skill.id}
                  onChange={(e) =>
                    saveSkill(skill.id, e.target.value)
                  }
                >
                  <option value="" disabled>
                    Select level
                  </option>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </section>

      {analysis && (
        <section className="skill-analysis-section">
          <h2>{analysis.role.role_name} - Skill Gap Report</h2>
          <Link
  to={`/learning-roadmap?roleId=${selectedRole}`}
  className="learning-roadmap-link"
>
  📚 Generate My Learning Roadmap →
</Link>

          <div className="skill-progress-track">
            <div
              className="skill-progress-fill"
              style={{ width: `${analysis.readiness}%` }}
            />
          </div>

          <p className="skill-help">
            Readiness is calculated by comparing your assessed
            proficiency with each required skill level.
          </p>

          <div className="skill-gap-list">
            {analysis.skills.map((skill) => (
              <div className="skill-gap-card" key={skill.skill_id}>
                <div>
                  <strong>{skill.skill_name}</strong>
                  <p>
                    Your level: {skill.current_level ?? "Not assessed"}
                    {" | "}
                    Required: {skill.required_level}
                  </p>
                </div>

                <span
                  className={`skill-status ${skill.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {skill.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SkillGap;
