
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Generate or fetch the student's 7-day study plan
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check whether the student already has a study plan
    const [existingTasks] = await db.query(
      "SELECT * FROM study_plan_tasks WHERE user_id = ? ORDER BY day_number, id",
      [userId]
    );

    if (existingTasks.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Study plan fetched successfully!",
        tasks: existingTasks
      });
    }

    // Fetch academic records
    const [academicRecords] = await db.query(
      `SELECT subject_name, marks, max_marks
       FROM academic_records
       WHERE user_id = ?`,
      [userId]
    );

    // Fetch attendance records
    const [attendanceRecords] = await db.query(
      `SELECT subject_name, status
       FROM attendance
       WHERE user_id = ?`,
      [userId]
    );

    // Calculate academic performance
    const academicMap = {};

    academicRecords.forEach((record) => {
      const subject = record.subject_name;

      if (!academicMap[subject]) {
        academicMap[subject] = {
          totalMarks: 0,
          maxMarks: 0
        };
      }

      academicMap[subject].totalMarks += Number(record.marks);
      academicMap[subject].maxMarks += Number(record.max_marks);
    });

    // Calculate attendance performance
    const attendanceMap = {};

    attendanceRecords.forEach((record) => {
      const subject = record.subject_name;

      if (!attendanceMap[subject]) {
        attendanceMap[subject] = {
          total: 0,
          present: 0
        };
      }

      attendanceMap[subject].total += 1;

      if (record.status === "present") {
        attendanceMap[subject].present += 1;
      }
    });

    // Combine subject performance
    const allSubjects = new Set([
      ...Object.keys(academicMap),
      ...Object.keys(attendanceMap)
    ]);

    const priorities = Array.from(allSubjects).map((subject) => {
      const academic = academicMap[subject];
      const attendance = attendanceMap[subject];

      const academicPercentage = academic
        ? (academic.totalMarks / academic.maxMarks) * 100
        : null;

      const attendancePercentage = attendance
        ? (attendance.present / attendance.total) * 100
        : null;

      let priority = 1;

      if (academicPercentage !== null && academicPercentage < 60) {
        priority += 2;
      } else if (academicPercentage !== null && academicPercentage < 75) {
        priority += 1;
      }

      if (attendancePercentage !== null && attendancePercentage < 75) {
        priority += 2;
      }

      return {
        subject,
        academicPercentage,
        attendancePercentage,
        priority
      };
    });

    // Highest priority first
    priorities.sort((a, b) => b.priority - a.priority);

    // Generate seven days of study activities
    const taskTemplates = [
      "Revise important concepts",
      "Practice questions and problems",
      "Study difficult topics",
      "Solve previous questions",
      "Revise notes and key formulas",
      "Take a practice test",
      "Review weekly progress"
    ];

    const newTasks = [];

    if (priorities.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Add academic or attendance records to generate a study plan.",
        tasks: []
      });
    }

    for (let day = 1; day <= 7; day++) {
      const subject = priorities[(day - 1) % priorities.length];

      let duration = subject.priority >= 4 ? 90 : 60;

      const task = {
        user_id: userId,
        day_number: day,
        subject_name: subject.subject,
        task_title: taskTemplates[day - 1],
        description: `Focus on ${subject.subject}. ${
          subject.academicPercentage !== null
            ? `Academic score: ${subject.academicPercentage.toFixed(2)}%. `
            : ""
        }${
          subject.attendancePercentage !== null
            ? `Attendance: ${subject.attendancePercentage.toFixed(2)}%.`
            : ""
        }`,
        duration_minutes: duration
      };

      newTasks.push(task);
    }

    // Save generated tasks in MySQL
    for (const task of newTasks) {
      await db.query(
        `INSERT INTO study_plan_tasks
         (user_id, day_number, subject_name, task_title, description, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          task.user_id,
          task.day_number,
          task.subject_name,
          task.task_title,
          task.description,
          task.duration_minutes
        ]
      );
    }

    // Fetch saved tasks
    const [savedTasks] = await db.query(
      "SELECT * FROM study_plan_tasks WHERE user_id = ? ORDER BY day_number, id",
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Your 7-day study plan has been generated!",
      tasks: savedTasks
    });

  } catch (error) {
    console.error("Study plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate study plan."
    });
  }
});

// PUT: Update task completion status
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status."
      });
    }

    const [result] = await db.query(
      `UPDATE study_plan_tasks
       SET status = ?
       WHERE id = ? AND user_id = ?`,
      [status, taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully!"
    });

  } catch (error) {
    console.error("Task update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task."
    });
  }
});

module.exports = router;
