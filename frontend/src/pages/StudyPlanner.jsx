
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyPlanner.css";

function StudyPlanner() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingTask, setUpdatingTask] = useState(null);

  // Fetch the saved study plan
  const fetchStudyPlan = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/study-plan",
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
        throw new Error(result.message || "Failed to load study plan.");
      }

      setTasks(result.tasks || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlan();
  }, []);

  // Update task status in MySQL
  const toggleTask = async (task) => {
    const token = sessionStorage.getItem("token");

    const newStatus =
      task.status === "completed" ? "pending" : "completed";

    try {
      setUpdatingTask(task.id);

      const response = await fetch(
        `https://smart-student-success-platform.onrender.com/api/study-plan/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update task.");
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === task.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingTask(null);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const totalTasks = tasks.length;

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const totalMinutes = tasks
    .filter((task) => task.status === "completed")
    .reduce(
      (total, task) => total + Number(task.duration_minutes || 0),
      0
    );

  if (loading) {
    return (
      <div className="study-planner-page">
        <h2>Loading your study plan...</h2>
      </div>
    );
  }

  return (
    <div className="study-planner-page">

      {/* Header */}
      <div className="study-planner-header">
        <div>
          <h1>Smart Study Planner 📚</h1>
          <p>
            Your personalized 7-day learning schedule.
            Learn consistently and achieve your goals.
          </p>
        </div>

        <span className="planner-badge">
          Rule-Based Planner
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="planner-error">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Progress Overview */}
      <section className="planner-overview">

        <div className="planner-stat-card">
          <span>Total Tasks</span>
          <h2>{totalTasks}</h2>
        </div>

        <div className="planner-stat-card">
          <span>Completed Tasks</span>
          <h2>{completedTasks}</h2>
        </div>

        <div className="planner-stat-card">
          <span>Progress</span>
          <h2>{progress}%</h2>
        </div>

        <div className="planner-stat-card">
          <span>Study Time Completed</span>
          <h2>{totalMinutes} min</h2>
        </div>

      </section>

      {/* Progress Bar */}
      <section className="planner-progress-card">
        <div className="planner-progress-heading">
          <h2>Weekly Progress</h2>
          <strong>{progress}%</strong>
        </div>

        <div className="planner-progress-track">
          <div
            className="planner-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p>
          {completedTasks} out of {totalTasks} study tasks completed.
        </p>
      </section>

      {/* Study Tasks */}
      <section className="planner-tasks-section">
        <h2>Your 7-Day Study Schedule</h2>

        {tasks.length === 0 ? (
          <div className="planner-empty">
            <h3>No study plan available</h3>
            <p>
              Add academic marks or attendance records to generate
              your personalized study plan.
            </p>
          </div>
        ) : (
          <div className="planner-task-grid">
            {tasks.map((task) => (
              <div
                className={`planner-task-card ${
                  task.status === "completed" ? "task-completed" : ""
                }`}
                key={task.id}
              >
                <div className="planner-task-top">
                  <span className="planner-day">
                    Day {task.day_number}
                  </span>

                  <span
                    className={`planner-task-status ${
                      task.status === "completed"
                        ? "status-completed"
                        : "status-pending"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <h3>{task.subject_name}</h3>

                <h4>{task.task_title}</h4>

                <p>{task.description}</p>

                <div className="planner-task-duration">
                  <span>⏱️ {task.duration_minutes} minutes</span>
                </div>

                <button
                  className={`planner-complete-button ${
                    task.status === "completed"
                      ? "completed-button"
                      : ""
                  }`}
                  onClick={() => toggleTask(task)}
                  disabled={updatingTask === task.id}
                >
                  {updatingTask === task.id
                    ? "Saving..."
                    : task.status === "completed"
                    ? "✓ Completed — Mark Pending"
                    : "Mark as Completed"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="planner-footer">
        Small daily improvements lead to remarkable results. 🎯
      </div>

    </div>
  );
}

export default StudyPlanner;
