
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// START INTERVIEW
router.post("/start", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { roleId, difficulty = "Easy", totalQuestions = 5 } = req.body;

        const validDifficulties = ["Easy", "Medium", "Hard"];

        if (!Number.isInteger(Number(roleId)) || Number(roleId) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid role ID is required"
            });
        }

        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid difficulty level"
            });
        }

        const questionCount = Math.min(
            Math.max(Number(totalQuestions) || 5, 1),
            20
        );

        const [roles] = await db.query(
            "SELECT id FROM career_roles WHERE id = ?",
            [roleId]
        );

        if (roles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Career role not found"
            });
        }

        const [questions] = await db.query(
            `SELECT id, question, difficulty, topic
             FROM interview_questions
             WHERE role_id = ? AND difficulty = ?
             ORDER BY RAND()
             LIMIT ?`,
            [roleId, difficulty, questionCount]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No questions available for this role and difficulty"
            });
        }

        const [session] = await db.query(
            `INSERT INTO interview_sessions
             (user_id, role_id, difficulty, total_questions, status)
             VALUES (?, ?, ?, ?, 'In Progress')`,
            [userId, roleId, difficulty, questions.length]
        );

        res.status(201).json({
            success: true,
            message: "Interview started successfully",
            sessionId: session.insertId,
            totalQuestions: questions.length,
            questions
        });

    } catch (error) {
        console.error("Start interview error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to start interview"
        });
    }
});


// SUBMIT ANSWER
router.post("/answer", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, questionId, answer } = req.body;

        if (
            !Number.isInteger(Number(sessionId)) ||
            Number(sessionId) <= 0 ||
            !Number.isInteger(Number(questionId)) ||
            Number(questionId) <= 0 ||
            typeof answer !== "string" ||
            !answer.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid session, question and answer are required"
            });
        }

        const [sessions] = await db.query(
            `SELECT id, role_id, difficulty
             FROM interview_sessions
             WHERE id = ? AND user_id = ? AND status = 'In Progress'`,
            [sessionId, userId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Active interview session not found"
            });
        }

        const [questions] = await db.query(
            `SELECT id, expected_keywords
             FROM interview_questions
             WHERE id = ? AND role_id = ? AND difficulty = ?`,
            [
                questionId,
                sessions[0].role_id,
                sessions[0].difficulty
            ]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Question not found for this interview"
            });
        }

        const [existing] = await db.query(
            `SELECT id FROM interview_answers
             WHERE session_id = ? AND question_id = ?`,
            [sessionId, questionId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This question has already been answered"
            });
        }

        let keywords = questions[0].expected_keywords;

        if (typeof keywords === "string") {
            keywords = JSON.parse(keywords);
        }

        if (!Array.isArray(keywords)) {
            keywords = [];
        }

        const normalizedAnswer = answer.toLowerCase();

        const matchedKeywords = keywords.filter(keyword =>
            normalizedAnswer.includes(String(keyword).toLowerCase())
        );

        const score = keywords.length === 0
            ? 0
            : Math.round(
                (matchedKeywords.length / keywords.length) * 100
            );

        let feedback;

        if (score >= 75) {
            feedback = "Good answer! You covered most of the expected concepts.";
        } else if (score >= 40) {
            feedback = "Decent attempt. Improve your answer by including more important concepts.";
        } else {
            feedback = "Your answer needs improvement. Review the topic and explain the key concepts.";
        }

        const missingKeywords = keywords.filter(
            keyword => !matchedKeywords.includes(keyword)
        );

        await db.query(
            `INSERT INTO interview_answers
             (session_id, question_id, answer, score, feedback)
             VALUES (?, ?, ?, ?, ?)`,
            [sessionId, questionId, answer.trim(), score, feedback]
        );

        res.json({
            success: true,
            score,
            feedback,
            matchedKeywords,
            missingKeywords
        });

    } catch (error) {
        console.error("Submit answer error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to evaluate answer"
        });
    }
});


// COMPLETE INTERVIEW
router.post("/complete/:sessionId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = Number(req.params.sessionId);

        if (!Number.isInteger(sessionId) || sessionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID"
            });
        }

        const [sessions] = await db.query(
            `SELECT id, total_questions
             FROM interview_sessions
             WHERE id = ? AND user_id = ? AND status = 'In Progress'`,
            [sessionId, userId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Active interview session not found"
            });
        }

        const [answers] = await db.query(
            `SELECT score FROM interview_answers
             WHERE session_id = ?`,
            [sessionId]
        );

        if (answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Submit at least one answer before completing"
            });
        }

        const totalScore = answers.reduce(
            (sum, item) => sum + Number(item.score),
            0
        ) / sessions[0].total_questions;

        const finalScore = Number(totalScore.toFixed(2));

        await db.query(
            `UPDATE interview_sessions
             SET total_score = ?,
                 status = 'Completed',
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [finalScore, sessionId, userId]
        );

        res.json({
            success: true,
            message: "Interview completed successfully",
            totalQuestions: sessions[0].total_questions,
            answeredQuestions: answers.length,
            totalScore: finalScore,
            status: "Completed"
        });

    } catch (error) {
        console.error("Complete interview error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to complete interview"
        });
    }
});


// INTERVIEW HISTORY
router.get("/history", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [history] = await db.query(
            `SELECT
                s.id,
                cr.role_name,
                s.difficulty,
                s.total_questions,
                s.total_score,
                s.status,
                s.started_at,
                s.completed_at
             FROM interview_sessions s
             JOIN career_roles cr ON s.role_id = cr.id
             WHERE s.user_id = ?
             ORDER BY s.started_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error("Interview history error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch interview history"
        });
    }
});


// INTERVIEW REPORT
router.get("/report/:sessionId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = Number(req.params.sessionId);

        const [sessions] = await db.query(
            `SELECT
                s.id,
                s.role_id,
                cr.role_name,
                s.difficulty,
                s.total_questions,
                s.total_score,
                s.status,
                s.started_at,
                s.completed_at
             FROM interview_sessions s
             JOIN career_roles cr ON s.role_id = cr.id
             WHERE s.id = ? AND s.user_id = ?`,
            [sessionId, userId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found"
            });
        }

        const [answers] = await db.query(
            `SELECT
                a.question_id,
                q.question,
                q.topic,
                a.answer,
                a.score,
                a.feedback
             FROM interview_answers a
             JOIN interview_questions q ON a.question_id = q.id
             WHERE a.session_id = ?
             ORDER BY a.id`,
            [sessionId]
        );

        res.json({
            success: true,
            session: sessions[0],
            answers
        });

    } catch (error) {
        console.error("Interview report error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate interview report"
        });
    }
});

module.exports = router;
