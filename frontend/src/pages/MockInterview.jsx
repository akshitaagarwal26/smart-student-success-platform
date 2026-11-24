
import React, { useEffect, useState } from "react";
import "./MockInterview.css";

const API_URL = "https://smart-student-success-platform.onrender.com/api/interviews";

const ROLES = [
    { id: 1, name: "Software Developer" },
    { id: 2, name: "AI / ML Engineer" },
    { id: 3, name: "Data Analyst" },
    { id: 4, name: "Full-Stack Developer" }
];

function MockInterview() {
    const token = sessionStorage.getItem("token");

    const [roleId, setRoleId] = useState("1");
    const [difficulty, setDifficulty] = useState("Easy");
    const [questionCount, setQuestionCount] = useState(5);

    const [sessionId, setSessionId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [evaluations, setEvaluations] = useState({});

    const [history, setHistory] = useState([]);
    const [report, setReport] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [screen, setScreen] = useState("setup");

    // Interview timer
    useEffect(() => {
        if (screen !== "interview") return;

        const timer = setInterval(() => {
            setElapsedSeconds(previous => previous + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [screen]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    // Fetch interview history
    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/history`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("History error:", err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchHistory();
        }
    }, []);

    // Start interview
    const startInterview = async () => {
        if (!token) {
            setError("Please log in before starting an interview.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    roleId: Number(roleId),
                    difficulty,
                    totalQuestions: Number(questionCount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to start interview");
            }

            setSessionId(data.sessionId);
            setQuestions(data.questions || []);
            setCurrentIndex(0);
            setAnswer("");
            setEvaluations({});
            setFeedback(null);
            setReport(null);
            setElapsedSeconds(0);
            setScreen("interview");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = questions[currentIndex];

    // Submit current answer
    const submitAnswer = async () => {
        if (!answer.trim()) {
            setError("Please enter your answer before submitting.");
            return;
        }

        if (!currentQuestion) return;

        try {
            setLoading(true);
            setError("");
            setFeedback(null);

            const response = await fetch(`${API_URL}/answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    questionId: currentQuestion.id,
                    answer: answer.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Answer submission failed");
            }

            const evaluation = {
                score: Number(data.score),
                feedback: data.feedback,
                matchedKeywords: data.matchedKeywords || [],
                missingKeywords: data.missingKeywords || []
            };

            setEvaluations(previous => ({
                ...previous,
                [currentQuestion.id]: evaluation
            }));

            setFeedback(evaluation);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Move to next question
    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(previous => previous + 1);
            setAnswer("");
            setFeedback(null);
            setError("");
        }
    };

    // Move to previous question
    const previousQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(previous => previous - 1);

            const previous = questions[currentIndex - 1];
            const previousEvaluation = evaluations[previous.id];

            setAnswer("");
            setFeedback(previousEvaluation || null);
            setError("");
        }
    };

    // Complete interview and fetch report
    const completeInterview = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/complete/${sessionId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to complete interview");
            }

            const reportResponse = await fetch(
                `${API_URL}/report/${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const reportData = await reportResponse.json();

            if (!reportResponse.ok) {
                throw new Error("Interview completed, but report could not load.");
            }

            setReport(reportData);
            setScreen("result");
            await fetchHistory();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Open previous interview report
    const openReport = async (id) => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/report/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load report");
            }

            setReport(data);
            setScreen("result");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startNewInterview = () => {
        setSessionId(null);
        setQuestions([]);
        setCurrentIndex(0);
        setAnswer("");
        setEvaluations({});
        setFeedback(null);
        setReport(null);
        setElapsedSeconds(0);
        setError("");
        setScreen("setup");
        fetchHistory();
    };

    // Calculate progress
    const answeredCount = Object.keys(evaluations).length;
    const progress = questions.length
        ? (answeredCount / questions.length) * 100
        : 0;

    // Authentication check
    if (!token) {
        return (
            <div className="mock-page">
                <div className="mock-error">
                    Please log in to access Mock Interview.
                </div>
            </div>
        );
    }

    return (
        <div className="mock-page">

            {/* PAGE HEADER */}
            <div className="mock-header">
                <div>
                    <h1>AI Mock Interview</h1>
                    <p>
                        Practice technical interviews and improve your
                        career readiness.
                    </p>
                </div>

                <div className="mock-header-icon">🎯</div>
            </div>

            {error && (
                <div className="mock-error">
                    {error}
                </div>
            )}

            {/* SETUP SCREEN */}
            {screen === "setup" && (
                <>
                    <div className="mock-setup-card">

                        <h2>Start Your Interview</h2>

                        <p className="mock-subtitle">
                            Customize your interview experience.
                        </p>

                        <div className="mock-form">

                            <div className="mock-form-group">
                                <label>Choose Career Role</label>

                                <select
                                    value={roleId}
                                    onChange={e => setRoleId(e.target.value)}
                                >
                                    {ROLES.map(role => (
                                        <option
                                            key={role.id}
                                            value={role.id}
                                        >
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mock-form-group">
                                <label>Difficulty Level</label>

                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="mock-form-group">
                                <label>Number of Questions</label>

                                <select
                                    value={questionCount}
                                    onChange={e => setQuestionCount(Number(e.target.value))}
                                >
                                    <option value={1}>1 Question</option>
                                    <option value={2}>2 Questions</option>
                                    <option value={3}>3 Questions</option>
                                    <option value={5}>5 Questions</option>
                                    <option value={10}>10 Questions</option>
                                </select>
                            </div>

                        </div>

                        <button
                            className="mock-primary-button"
                            onClick={startInterview}
                            disabled={loading}
                        >
                            {loading ? "Starting..." : "Start Interview →"}
                        </button>

                        <p className="mock-note">
                            Evaluation uses keyword matching in this version.
                        </p>

                    </div>

                    {/* INTERVIEW HISTORY */}
                    <div className="mock-history-card">

                        <div className="mock-section-heading">
                            <h2>Previous Interviews</h2>
                            <span>{history.length} Sessions</span>
                        </div>

                        {history.length === 0 ? (
                            <p className="mock-empty">
                                No interview history yet. Start your first interview!
                            </p>
                        ) : (

                            <div className="mock-history-list">

                                {history.map(item => (
                                    <div
                                        className="mock-history-item"
                                        key={item.id}
                                    >
                                        <div>
                                            <h3>{item.role_name}</h3>

                                            <p>
                                                {item.difficulty} ·{" "}
                                                {item.total_questions} questions
                                            </p>

                                            <span className={
                                                item.status === "Completed"
                                                    ? "mock-status completed"
                                                    : "mock-status pending"
                                            }>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="mock-history-right">
                                            <strong>
                                                {item.status === "Completed"
                                                    ? `${Number(item.total_score).toFixed(0)}%`
                                                    : "In Progress"}
                                            </strong>

                                            <button
                                                onClick={() => openReport(item.id)}
                                                disabled={item.status !== "Completed"}
                                            >
                                                View Report
                                            </button>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        )}

                    </div>
                </>
            )}

            {/* INTERVIEW SCREEN */}
            {screen === "interview" && currentQuestion && (
                <div className="mock-interview-card">

                    <div className="mock-interview-top">

                        <div>
                            <span className="mock-topic">
                                {currentQuestion.topic}
                            </span>

                            <span className={`mock-difficulty ${difficulty.toLowerCase()}`}>
                                {difficulty}
                            </span>
                        </div>

                        <div className="mock-timer">
                            ⏱ {formatTime(elapsedSeconds)}
                        </div>

                    </div>

                    <div className="mock-progress-heading">
                        <span>
                            Question {currentIndex + 1} of {questions.length}
                        </span>

                        <span>
                            {Math.round(progress)}% evaluated
                        </span>
                    </div>

                    <div className="mock-progress-bar">
                        <div
                            className="mock-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="mock-question-area">

                        <h2>{currentQuestion.question}</h2>

                        <textarea
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            placeholder="Write your answer here..."
                            rows={7}
                            disabled={Boolean(evaluations[currentQuestion.id])}
                        />

                        <div className="mock-answer-footer">
                            <span>
                                {answer.trim().split(/\s+/).filter(Boolean).length} words
                            </span>

                            <span>
                                Answer honestly and explain your concepts.
                            </span>
                        </div>

                    </div>

                    {/* Evaluation feedback */}
                    {feedback && (
                        <div className="mock-feedback">

                            <h3>
                                Answer Evaluation: {feedback.score}/100
                            </h3>

                            <p>{feedback.feedback}</p>

                            <div>
                                <strong>Matched Keywords</strong>

                                <div className="mock-keyword-list">
                                    {feedback.matchedKeywords.length > 0
                                        ? feedback.matchedKeywords.map(keyword => (
                                            <span className="mock-keyword matched" key={keyword}>
                                                ✓ {keyword}
                                            </span>
                                        ))
                                        : <span>No keywords matched.</span>}
                                </div>
                            </div>

                            <div>
                                <strong>Missing Keywords</strong>

                                <div className="mock-keyword-list">
                                    {feedback.missingKeywords.length > 0
                                        ? feedback.missingKeywords.map(keyword => (
                                            <span className="mock-keyword missing" key={keyword}>
                                                + {keyword}
                                            </span>
                                        ))
                                        : <span>None</span>}
                                </div>
                            </div>

                        </div>
                    )}

                    <div className="mock-navigation">

                        <button
                            className="mock-secondary-button"
                            onClick={previousQuestion}
                            disabled={currentIndex === 0 || loading}
                        >
                            ← Previous
                        </button>

                        {!evaluations[currentQuestion.id] ? (
                            <button
                                className="mock-primary-button"
                                onClick={submitAnswer}
                                disabled={loading || !answer.trim()}
                            >
                                {loading ? "Evaluating..." : "Submit Answer"}
                            </button>
                        ) : currentIndex < questions.length - 1 ? (
                            <button
                                className="mock-primary-button"
                                onClick={nextQuestion}
                                disabled={loading}
                            >
                                Next Question →
                            </button>
                        ) : (
                            <button
                                className="mock-primary-button"
                                onClick={completeInterview}
                                disabled={loading}
                            >
                                {loading ? "Completing..." : "Finish Interview"}
                            </button>
                        )}

                    </div>

                    <p className="mock-note">
                        Your answers are evaluated using expected keyword matching.
                        This is not a full AI assessment.
                    </p>

                </div>
            )}

            {/* RESULT SCREEN */}
            {screen === "result" && report && (
                <div className="mock-result-card">

                    <div className="mock-result-heading">
                        <div className="mock-result-icon">🏆</div>

                        <h2>Interview Completed!</h2>

                        <p>Your performance report is ready.</p>
                    </div>

                    <div className="mock-score-circle">
                        <strong>
                            {Number(report.session.total_score).toFixed(0)}%
                        </strong>
                        <span>Overall Score</span>
                    </div>

                    <div className="mock-result-stats">

                        <div>
                            <strong>{report.session.role_name}</strong>
                            <span>Career Role</span>
                        </div>

                        <div>
                            <strong>{report.answers.length}/{report.session.total_questions}</strong>
                            <span>Answered</span>
                        </div>

                        <div>
                            <strong>{report.session.difficulty}</strong>
                            <span>Difficulty</span>
                        </div>

                    </div>

                    <h3 className="mock-report-title">
                        Question-wise Performance
                    </h3>

                    <div className="mock-report-list">

                        {report.answers.map((item, index) => (
                            <div
                                className="mock-report-item"
                                key={item.question_id}
                            >
                                <div className="mock-report-question">
                                    <span>Question {index + 1}</span>

                                    <strong>
                                        {Number(item.score).toFixed(0)}%
                                    </strong>
                                </div>

                                <h4>{item.question}</h4>

                                <p className="mock-report-topic">
                                    Topic: {item.topic}
                                </p>

                                <p className="mock-report-answer">
                                    {item.answer}
                                </p>

                                <p className="mock-report-feedback">
                                    {item.feedback}
                                </p>
                            </div>
                        ))}

                    </div>

                    <button
                        className="mock-primary-button"
                        onClick={startNewInterview}
                    >
                        Start New Interview →
                    </button>

                </div>
            )}

        </div>
    );
}

export default MockInterview;
