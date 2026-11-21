
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { db } = require("../config/db");

// GET /api/analytics
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Run all analytics queries together
    const [
  [[academic]],
  [subjectPerformance],
  [[attendance]],
  [attendanceTrend],
  [[study]],
  [[skills]],
  [skillLevels],
  [[roadmap]],
  [[resume]],
  [resumeHistory],
  [[interviews]],
  [interviewHistory]
] = await Promise.all([

      // 1. Academic performance
      db.execute(
        `SELECT
          COUNT(*) AS total_records,
          ROUND(AVG((marks / NULLIF(max_marks, 0)) * 100), 2) AS average_marks
         FROM academic_records
         WHERE user_id = ?`,
        [userId]
      ),

      // Subject-wise academic performance
      db.execute(
        `SELECT
          subject_name,
          ROUND(AVG((marks / NULLIF(max_marks, 0)) * 100), 2) AS percentage
         FROM academic_records
         WHERE user_id = ?
         GROUP BY subject_name
         ORDER BY subject_name`,
        [userId]
      ),

      // 2. Attendance statistics
      db.execute(
        `SELECT
          COUNT(*) AS total_classes,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent,
          ROUND(
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)
            * 100.0 / NULLIF(COUNT(*), 0), 2
          ) AS attendance_percentage
         FROM attendance
         WHERE user_id = ?`,
        [userId]
      ),

      // Monthly attendance trend
      db.execute(
        `SELECT
          DATE_FORMAT(attendance_date, '%Y-%m') AS month,
          COUNT(*) AS total_classes,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
          ROUND(
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)
            * 100.0 / NULLIF(COUNT(*), 0), 2
          ) AS percentage
         FROM attendance
         WHERE user_id = ?
         GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
         ORDER BY month`,
        [userId]
      ),

      // 3. Study planner
      db.execute(
        `SELECT
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
          COALESCE(SUM(duration_minutes), 0) AS total_minutes
         FROM study_plan_tasks
         WHERE user_id = ?`,
        [userId]
      ),

      // 4. Student skills
      db.execute(
        `SELECT COUNT(*) AS total_skills
         FROM student_skills
         WHERE user_id = ?`,
        [userId]
      ),

      // Skill proficiency distribution
      db.execute(
        `SELECT
          proficiency_level,
          COUNT(*) AS total
         FROM student_skills
         WHERE user_id = ?
         GROUP BY proficiency_level
         ORDER BY proficiency_level`,
        [userId]
      ),

      // 5. Learning roadmap
      db.execute(
        `SELECT
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks
         FROM skill_learning_roadmap
         WHERE user_id = ?`,
        [userId]
      ),

      // 6. Resume analytics
      db.execute(
        `SELECT
          COUNT(*) AS total_resumes,
          ROUND(AVG(ats_score), 2) AS average_ats_score
         FROM resume_analysis
         WHERE user_id = ?`,
        [userId]
      ),

      // Resume history
      db.execute(
        `SELECT
          id,
          file_name,
          ats_score,
          created_at
         FROM resume_analysis
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      ),

      // 7. Interview analytics
      db.execute(
        `SELECT
          COUNT(*) AS total_interviews,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_interviews,
          ROUND(AVG(
            CASE WHEN status = 'Completed' THEN total_score END
          ), 2) AS average_score
         FROM interview_sessions
         WHERE user_id = ?`,
        [userId]
      ),

      // Interview history
      db.execute(
        `SELECT
          interview_sessions.id,
          career_roles.role_name,
          interview_sessions.difficulty,
          interview_sessions.total_questions,
          interview_sessions.total_score,
          interview_sessions.status,
          interview_sessions.started_at
         FROM interview_sessions
         JOIN career_roles
           ON interview_sessions.role_id = career_roles.id
         WHERE interview_sessions.user_id = ?
         ORDER BY interview_sessions.started_at DESC
         LIMIT 5`,
        [userId]
      )
    ]);

    // Helper for safe numeric values
    const number = (value) => Number(value || 0);

    res.status(200).json({
      success: true,

      academics: {
        totalRecords: number(academic.total_records),
        averageMarks: number(academic.average_marks),
        subjects: subjectPerformance.map((item) => ({
          subject: item.subject_name,
          percentage: number(item.percentage)
        }))
      },

      attendance: {
        totalClasses: number(attendance.total_classes),
        present: number(attendance.present),
        absent: number(attendance.absent),
        percentage: number(attendance.attendance_percentage),
        monthlyTrend: attendanceTrend.map((item) => ({
          month: item.month,
          totalClasses: number(item.total_classes),
          present: number(item.present),
          percentage: number(item.percentage)
        }))
      },

      studyPlanner: {
        totalTasks: number(study.total_tasks),
        completedTasks: number(study.completed_tasks),
        pendingTasks: number(study.pending_tasks),
        totalMinutes: number(study.total_minutes),
        completionPercentage:
          number(study.total_tasks) > 0
            ? Number(
                (number(study.completed_tasks) /
                  number(study.total_tasks) * 100).toFixed(2)
              )
            : 0
      },

      skills: {
        totalSkills: number(skills.total_skills),
        proficiencyDistribution: skillLevels.map((item) => ({
          level: number(item.proficiency_level),
          count: number(item.total)
        }))
      },

      roadmap: {
        totalTasks: number(roadmap.total_tasks),
        completedTasks: number(roadmap.completed_tasks),
        pendingTasks: number(roadmap.pending_tasks),
        completionPercentage:
          number(roadmap.total_tasks) > 0
            ? Number(
                (number(roadmap.completed_tasks) /
                  number(roadmap.total_tasks) * 100).toFixed(2)
              )
            : 0
      },

      resume: {
        totalResumes: number(resume.total_resumes),
        averageAtsScore: number(resume.average_ats_score),
        history: resumeHistory.map((item) => ({
          id: item.id,
          fileName: item.file_name,
          atsScore: number(item.ats_score),
          createdAt: item.created_at
        }))
      },

      interviews: {
        totalInterviews: number(interviews.total_interviews),
        completedInterviews: number(interviews.completed_interviews),
        averageScore: number(interviews.average_score),
        history: interviewHistory.map((item) => ({
          id: item.id,
          role: item.role_name,
          difficulty: item.difficulty,
          totalQuestions: number(item.total_questions),
          score: number(item.total_score),
          status: item.status,
          startedAt: item.started_at
        }))
      }
    });

  } catch (error) {
    console.error("Analytics API Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student analytics."
    });
  }
});

module.exports = router;
