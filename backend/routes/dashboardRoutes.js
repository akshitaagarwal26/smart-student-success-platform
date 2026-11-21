const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET dashboard data for the logged-in student
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      academicResult,
      subjectResult,
      attendanceResult,
      careerResult,
      studyResult,
      roadmapResult
    ] = await Promise.all([

      // Academic average
      db.query(
        `SELECT
          ROUND(
            COALESCE(AVG((marks / max_marks) * 100), 0), 2
          ) AS averageMarks,
          COUNT(*) AS totalRecords
         FROM academic_records
         WHERE user_id = ?`,
        [userId]
      ),

      // Subject-wise performance
      db.query(
        `SELECT
          subject_name AS name,
          ROUND(AVG((marks / max_marks) * 100), 2) AS score
         FROM academic_records
         WHERE user_id = ?
         GROUP BY subject_name
         ORDER BY subject_name`,
        [userId]
      ),

      // Attendance percentage
      db.query(
        `SELECT
          COUNT(*) AS totalClasses,
          COALESCE(SUM(status = 'present'), 0) AS presentClasses,
          ROUND(
            COALESCE(
              SUM(status = 'present') * 100 / NULLIF(COUNT(*), 0),
              0
            ), 2
          ) AS attendancePercentage
         FROM attendance
         WHERE user_id = ?`,
        [userId]
      ),

      // Best career-role readiness
      db.query(
        `SELECT
          cr.id AS roleId,
          cr.role_name AS roleName,
          ROUND(
            AVG(
              LEAST(
                COALESCE(ss.proficiency_level, 0) /
                NULLIF(rr.required_level, 0),
                1
              )
            ) * 100,
            2
          ) AS readiness
         FROM career_roles cr
         JOIN role_skill_requirements rr
           ON rr.role_id = cr.id
         LEFT JOIN student_skills ss
           ON ss.skill_id = rr.skill_id
           AND ss.user_id = ?
         GROUP BY cr.id, cr.role_name
         ORDER BY readiness DESC
         LIMIT 1`,
        [userId]
      ),

      // Study planner progress
      db.query(
        `SELECT
          COUNT(*) AS totalTasks,
          COALESCE(SUM(status = 'completed'), 0) AS completedTasks
         FROM study_plan_tasks
         WHERE user_id = ?`,
        [userId]
      ),

      // Learning roadmap progress
      db.query(
        `SELECT
          COUNT(*) AS totalTasks,
          COALESCE(SUM(status = 'completed'), 0) AS completedTasks
         FROM skill_learning_roadmap
         WHERE user_id = ?`,
        [userId]
      )
    ]);

    res.json({
      success: true,
      academics: academicResult[0][0],
      subjects: subjectResult[0],
      attendance: attendanceResult[0][0],
      career: careerResult[0][0] || {
        roleName: "Not assessed",
        readiness: 0
      },
      studyPlan: studyResult[0][0],
      roadmap: roadmapResult[0][0]
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({
      message: "Failed to load dashboard data"
    });
  }
});

module.exports = router;