
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./LearningRoadmap.css";

const API = "https://smart-student-success-platform.onrender.com/api";

function LearningRoadmap() {
  const [searchParams] = useSearchParams();

  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState(
    searchParams.get("roleId") || ""
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch(`${API}/skill-gap`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load roles");
        }

        setRoles(data.roles);

        const requestedRole = searchParams.get("roleId");
        const initialRole =
          requestedRole &&
          data.roles.some((role) => String(role.id) === requestedRole)
            ? requestedRole
            : String(data.roles[0]?.id || "");

        setRoleId(initialRole);
      } catch (err) {
        setError(err.message);
      }
    }

    loadRoles();
  }, []);

  useEffect(() => {
    if (roleId) {
      loadRoadmap(roleId);
    }
  }, [roleId]);

  async function loadRoadmap(id) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/learning-roadmap/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load roadmap");
      }

      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task) {
    const newStatus =
      task.status === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(
        `${API}/learning-roadmap/task/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update task");
      }

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const totalMinutes = tasks.reduce(
    (sum, task) => sum + task.duration_minutes,
    0
  );

  return (
    <div className="roadmap-page">
      <header className="roadmap-header">
        <p className="roadmap-eyebrow">CAREER DEVELOPMENT</p>
        <h1>Personalized Learning Roadmap</h1>
        <p>
          Follow your personalized learning tasks and track your
          progress toward your career goals.
        </p>
      </header>

      <section className="roadmap-selector">
        <label htmlFor="roadmap-role">Select Career Path</label>

        <select
          id="roadmap-role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </section>

      {error && <div className="roadmap-error">{error}</div>}

      {loading ? (
        <p>Loading your learning roadmap...</p>
      ) : (
        <>
          <section className="roadmap-stats">
            <div className="roadmap-stat">
              <span>Total Tasks</span>
              <strong>{tasks.length}</strong>
            </div>

            <div className="roadmap-stat">
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>

            <div className="roadmap-stat">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>

            <div className="roadmap-stat">
              <span>Total Study Time</span>
              <strong>{Math.round(totalMinutes / 60)} hrs</strong>
            </div>
          </section>

          <section className="roadmap-progress-card">
            <div className="roadmap-progress-heading">
              <h2>Your Learning Progress</h2>
              <strong>{progress}%</strong>
            </div>

            <div className="roadmap-progress-track">
              <div
                className="roadmap-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="roadmap-task-section">
            <h2>Your Learning Tasks</h2>

            {tasks.length === 0 ? (
              <p>
                No skill gaps found for this career path. Great work!
              </p>
            ) : (
              tasks.map((task) => (
                <article
                  className={`roadmap-task ${
                    task.status === "completed" ? "completed" : ""
                  }`}
                  key={task.id}
                >
                  <div className="roadmap-task-content">
                    <span className="roadmap-skill-name">
                      {task.skill_name}
                    </span>

                    <h3>{task.task_title}</h3>
                    <p>{task.description}</p>

                    <span className="roadmap-duration">
                      {task.duration_minutes} minutes
                    </span>
                  </div>

                  <button
                    className={
                      task.status === "completed"
                        ? "roadmap-completed-button"
                        : "roadmap-pending-button"
                    }
                    onClick={() => toggleTask(task)}
                  >
                    {task.status === "completed"
                      ? "✓ Completed"
                      : "Mark Complete"}
                  </button>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default LearningRoadmap;
