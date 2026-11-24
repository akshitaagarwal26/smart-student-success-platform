
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Auth.css";
import "./Academics.css";

function Academics() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("7");
  const [marks, setMarks] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("token");

  const fetchRecords = async () => {
    try {
      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/academics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("student");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load records.");
      }

      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchRecords();
  }, []);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setSaving(true);

      const response = await fetch(
        "https://smart-student-success-platform.onrender.com/api/academics",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject_name: subject,
            semester: Number(semester),
            marks: Number(marks),
            max_marks: Number(maxMarks),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("student");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to save record.");
      }

      setMessage("Academic record added successfully!");
      setSubject("");
      setMarks("");
      setMaxMarks("100");

      await fetchRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `https://smart-student-success-platform.onrender.com/api/academics/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("student");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete record.");
      }

      setMessage("Academic record deleted successfully!");
      await fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const average = records.length
    ? records.reduce(
        (sum, record) =>
          sum + (Number(record.marks) / Number(record.max_marks)) * 100,
        0
      ) / records.length
    : 0;

  return (
    <div className="academics-page">
      <header className="academics-header">
        <div>
          <p className="small-title">SMART STUDENT SUCCESS PLATFORM</p>
          <h1>Academic Management 📚</h1>
          <p>Track your subjects, marks and semester performance.</p>
        </div>

        <button onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </header>

      <section className="academic-summary">
        <div className="summary-card">
          <span>📚 Total Subjects</span>
          <h2>{records.length}</h2>
        </div>

        <div className="summary-card">
          <span>📊 Average Percentage</span>
          <h2>{average.toFixed(2)}%</h2>
        </div>

        <div className="summary-card">
          <span>🎓 Academic Records</span>
          <h2>{records.length}</h2>
        </div>
      </section>

      <section className="academic-form-card">
        <h2>Add Academic Record ✍️</h2>

        <form onSubmit={handleAddRecord}>
          <label>Subject Name</label>
          <input
            type="text"
            placeholder="Enter subject name"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <label>Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>

          <label>Obtained Marks</label>
          <input
            type="number"
            placeholder="Enter obtained marks"
            min="0"
            step="0.01"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            required
          />

          <label>Maximum Marks</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            required
          />

          {error && <p className="academic-error">{error}</p>}
          {message && <p className="academic-success">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "+ Add Academic Record"}
          </button>
        </form>
      </section>

      <section className="academic-records">
        <h2>Your Academic Records 📋</h2>

        {loading ? (
          <p>Loading academic records...</p>
        ) : records.length === 0 ? (
          <p>No academic records found. Add your first subject above.</p>
        ) : (
          <div className="academic-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => {
                  const percentage =
                    (Number(record.marks) / Number(record.max_marks)) * 100;

                  return (
                    <tr key={record.id}>
                      <td>{record.subject_name}</td>
                      <td>{record.semester}</td>
                      <td>
                        {record.marks} / {record.max_marks}
                      </td>
                      <td>{percentage.toFixed(2)}%</td>
                      <td>
                        <button
                          className="delete-record"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Academics;
