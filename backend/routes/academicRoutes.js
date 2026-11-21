
const express = require("express");
const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Fetch logged-in student's academic records
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [records] = await db.query(
      `SELECT id, subject_name, semester, marks, max_marks
       FROM academic_records
       WHERE user_id = ?
       ORDER BY semester, subject_name`,
      [req.user.id]
    );

    res.json({
      success: true,
      records
    });

  } catch (error) {
    console.error("Fetch academics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch academic records."
    });
  }
});

// POST: Add a new academic record
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject_name, semester, marks, max_marks } = req.body;

    const subject = subject_name?.trim();
    const sem = Number(semester);
    const obtainedMarks = Number(marks);
    const totalMarks = Number(max_marks ?? 100);

    if (!subject || !Number.isInteger(sem) || sem < 1 || sem > 12) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid subject name and semester (1–12)."
      });
    }

    if (
      !Number.isFinite(obtainedMarks) ||
      !Number.isFinite(totalMarks) ||
      totalMarks <= 0 ||
      obtainedMarks < 0 ||
      obtainedMarks > totalMarks
    ) {
      return res.status(400).json({
        success: false,
        message: "Marks must be between 0 and the maximum marks."
      });
    }

    const [result] = await db.query(
      `INSERT INTO academic_records
       (user_id, subject_name, semester, marks, max_marks)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, subject, sem, obtainedMarks, totalMarks]
    );

    res.status(201).json({
      success: true,
      message: "Academic record added successfully!",
      recordId: result.insertId
    });

  } catch (error) {
    console.error("Add academic record error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add academic record."
    });
  }
});

// DELETE: Delete a student's own academic record
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recordId = Number(req.params.id);

    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid academic record ID."
      });
    }

    const [result] = await db.query(
      "DELETE FROM academic_records WHERE id = ? AND user_id = ?",
      [recordId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic record not found."
      });
    }

    res.json({
      success: true,
      message: "Academic record deleted successfully!"
    });

  } catch (error) {
    console.error("Delete academic record error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete academic record."
    });
  }
});

module.exports = router;
