
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Fetch attendance for logged-in student
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [records] = await db.query(
      `SELECT * FROM attendance
       WHERE user_id = ?
       ORDER BY attendance_date DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      records
    });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

// POST: Add attendance record
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject_name, attendance_date, status } = req.body;

    if (!subject_name || !attendance_date || !status) {
      return res.status(400).json({
        message: "Please provide subject, date and status"
      });
    }

    if (!["present", "absent"].includes(status)) {
      return res.status(400).json({
        message: "Status must be present or absent"
      });
    }

    const [result] = await db.query(
      `INSERT INTO attendance
       (user_id, subject_name, attendance_date, status)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, subject_name, attendance_date, status]
    );

    res.status(201).json({
      success: true,
      message: "Attendance added successfully!",
      recordId: result.insertId
    });
  } catch (error) {
    console.error("Add attendance error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Attendance already exists for this subject and date"
      });
    }

    res.status(500).json({ message: "Failed to add attendance" });
  }
});

// DELETE: Delete attendance record
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM attendance
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully!"
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({ message: "Failed to delete attendance" });
  }
});

module.exports = router;
