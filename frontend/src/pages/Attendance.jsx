
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";
import "./Attendance.css";

function Attendance() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("present");
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem("token");

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/attendance",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("student");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch attendance"
        );
      }

      setRecords(data.records || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Check login and load attendance
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchAttendance();
  }, []);

  // Add attendance
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !date) {
      setError("Please enter subject name and date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            subject_name: subject.trim(),
            attendance_date: date,
            status
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add attendance"
        );
      }

      setSubject("");
      setStatus("present");

      await fetchAttendance();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete attendance
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this attendance record?"
      )
    ) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `https://smart-student-success-platform.onrender.com/api/attendance/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete attendance"
        );
      }

      await fetchAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate attendance separately for each subject
  const subjectAttendance = Object.values(
    records.reduce((groups, record) => {
      const subjectName = record.subject_name;

      if (!groups[subjectName]) {
        groups[subjectName] = {
          subject: subjectName,
          totalClasses: 0,
          present: 0,
          absent: 0
        };
      }

      groups[subjectName].totalClasses += 1;

      if (record.status === "present") {
        groups[subjectName].present += 1;
      } else if (record.status === "absent") {
        groups[subjectName].absent += 1;
      }

      return groups;
    }, {})
  );

  if (loading) {
    return (
      <div className="attendance-loading">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="attendance-page">

      {/* Header */}
      <header className="attendance-header">
        <h2>SMART STUDENT SUCCESS PLATFORM</h2>

        <h1>Attendance Management 📚</h1>

        <p>
          Track your classes and attendance performance.
        </p>

        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>
      </header>

      <main className="attendance-container">

        {/* Subject-wise Attendance Statistics */}
        <section className="attendance-subject-stats">

          <h2>Subject-wise Attendance 📊</h2>

          {subjectAttendance.length === 0 ? (
            <p>No attendance data available.</p>
          ) : (
            <div className="subject-attendance-grid">

              {subjectAttendance.map((item) => {
                const percentage =
                  item.totalClasses === 0
                    ? 0
                    : (item.present / item.totalClasses) * 100;

                return (
                  <div
                    className="subject-attendance-card"
                    key={item.subject}
                  >

                    <h3>{item.subject}</h3>

                    <div className="subject-attendance-percentage">
                      {percentage.toFixed(2)}%
                    </div>

                    <div className="subject-attendance-progress">
                      <div
                        style={{
                          width: `${percentage}%`
                        }}
                      ></div>
                    </div>

                    <p>
                      Total Classes: {item.totalClasses}
                    </p>

                    <p>
                      Present: {item.present}
                    </p>

                    <p>
                      Absent: {item.absent}
                    </p>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* Error Message */}
        {error && (
          <p className="attendance-error">
            {error}
          </p>
        )}

        {/* Add Attendance Form */}
        <section className="attendance-form-card">

          <h2>Mark Attendance ✍️</h2>

          <form onSubmit={handleSubmit}>

            <label>Subject Name</label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject name"
              required
            />

            <label>Attendance Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <label>Attendance Status</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "+ Add Attendance"}
            </button>

          </form>

        </section>

        {/* Attendance Records Table */}
        <section className="attendance-records-card">

          <h2>Your Attendance Records 📋</h2>

          {records.length === 0 ? (
            <p>
              No attendance records found.
              Add your first record!
            </p>
          ) : (

            <div className="attendance-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {records.map((record) => (

                    <tr key={record.id}>

                      <td>{record.subject_name}</td>

                      <td>
                        {String(record.attendance_date)
                          .slice(0, 10)
                          .split("-")
                          .reverse()
                          .join("/")}
                      </td>

                      <td>
                        <span
                          className={`attendance-status ${record.status}`}
                        >
                          {record.status.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <button
                          className="attendance-delete"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </button>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Attendance;
