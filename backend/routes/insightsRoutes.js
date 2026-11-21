
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Generate personalized student insights
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Academic records
    const [academicRecords] = await db.query(
      `SELECT subject_name, semester, marks, max_marks
       FROM academic_records
       WHERE user_id = ?
       ORDER BY semester ASC`,
      [userId]
    );

    // 2. Attendance records
    const [attendanceRecords] = await db.query(
      `SELECT subject_name, status
       FROM attendance
       WHERE user_id = ?`,
      [userId]
    );

    // 3. Additional student data
    const [
      [skillRecords],
      [studyRecords],
      [roadmapRecords],
      [resumeRecords],
      [interviewRecords]
    ] = await Promise.all([

      db.query(
        `SELECT skill_id, proficiency_level
         FROM student_skills
         WHERE user_id = ?`,
        [userId]
      ),

      db.query(
        `SELECT
          COUNT(*) AS total,
          SUM(status = 'completed') AS completed,
          SUM(status = 'pending') AS pending
         FROM study_plan_tasks
         WHERE user_id = ?`,
        [userId]
      ),

      db.query(
        `SELECT
          COUNT(*) AS total,
          SUM(status = 'completed') AS completed,
          SUM(status = 'pending') AS pending
         FROM skill_learning_roadmap
         WHERE user_id = ?`,
        [userId]
      ),

      db.query(
        `SELECT
          COUNT(*) AS total,
          ROUND(AVG(ats_score), 2) AS average_score
         FROM resume_analysis
         WHERE user_id = ?`,
        [userId]
      ),

      db.query(
        `SELECT
          COUNT(*) AS total,
          SUM(status = 'Completed') AS completed,
          ROUND(AVG(
            CASE WHEN status = 'Completed' THEN total_score END
          ), 2) AS average_score
         FROM interview_sessions
         WHERE user_id = ?`,
        [userId]
      )
    ]);

    const number = (value) => Number(value || 0);

    // 4. Academic analysis
    const academicMap = {};

    academicRecords.forEach((record) => {
      const name = record.subject_name;

      if (!academicMap[name]) {
        academicMap[name] = {
          subject: name,
          totalMarks: 0,
          maximumMarks: 0,
          semesters: []
        };
      }

      academicMap[name].totalMarks += number(record.marks);
      academicMap[name].maximumMarks += number(record.max_marks);

      if (!academicMap[name].semesters.includes(record.semester)) {
        academicMap[name].semesters.push(record.semester);
      }
    });

    Object.values(academicMap).forEach((item) => {
      item.percentage = item.maximumMarks > 0
        ? Number(
            ((item.totalMarks / item.maximumMarks) * 100).toFixed(2)
          )
        : 0;
    });

    // 5. Attendance analysis
    const attendanceMap = {};

    attendanceRecords.forEach((record) => {
      const name = record.subject_name;

      if (!attendanceMap[name]) {
        attendanceMap[name] = {
          subject: name,
          totalClasses: 0,
          present: 0,
          absent: 0
        };
      }

      attendanceMap[name].totalClasses++;

      if (record.status === "present") {
        attendanceMap[name].present++;
      } else {
        attendanceMap[name].absent++;
      }
    });

    Object.values(attendanceMap).forEach((item) => {
      item.percentage = item.totalClasses > 0
        ? Number(
            ((item.present / item.totalClasses) * 100).toFixed(2)
          )
        : 0;
    });

    // 6. Overall academic and attendance statistics
    const totalObtained = academicRecords.reduce(
      (sum, record) => sum + number(record.marks),
      0
    );

    const totalMaximum = academicRecords.reduce(
      (sum, record) => sum + number(record.max_marks),
      0
    );

    const overallAverage = totalMaximum > 0
      ? Number(((totalObtained / totalMaximum) * 100).toFixed(2))
      : 0;

    const totalClasses = attendanceRecords.length;

    const totalPresent = attendanceRecords.filter(
      (record) => record.status === "present"
    ).length;

    const overallAttendance = totalClasses > 0
      ? Number(((totalPresent / totalClasses) * 100).toFixed(2))
      : 0;

    // 7. Identify weak subjects and attendance risks
    const weakSubjects = Object.values(academicMap)
      .filter((item) => item.percentage < 60)
      .map((item) => ({
        subject: item.subject,
        percentage: item.percentage
      }));

    const attendanceRisks = Object.values(attendanceMap)
      .filter((item) => item.percentage < 75)
      .map((item) => ({
        subject: item.subject,
        attendance: item.percentage
      }));

    // 8. Skill analysis
    const totalSkills = skillRecords.length;

    const beginnerSkills = skillRecords.filter(
      (item) => number(item.proficiency_level) <= 2
    );

    const advancedSkills = skillRecords.filter(
      (item) => number(item.proficiency_level) >= 4
    );

    // 9. Study planner and roadmap analysis
    const study = studyRecords[0] || {};
    const roadmap = roadmapRecords[0] || {};
    const resume = resumeRecords[0] || {};
    const interviews = interviewRecords[0] || {};

    const studyTotal = number(study.total);
    const studyCompleted = number(study.completed);

    const roadmapTotal = number(roadmap.total);
    const roadmapCompleted = number(roadmap.completed);

    const studyPercentage = studyTotal > 0
      ? Number((studyCompleted / studyTotal * 100).toFixed(2))
      : 0;

    const roadmapPercentage = roadmapTotal > 0
      ? Number((roadmapCompleted / roadmapTotal * 100).toFixed(2))
      : 0;

    // 10. Personalized recommendations
    const recommendations = [];

    if (academicRecords.length === 0) {
      recommendations.push(
        "Add your academic marks to receive performance analysis."
      );
    } else if (overallAverage < 60) {
      recommendations.push(
        "Your academic performance needs improvement. Follow a consistent study schedule."
      );
    } else if (overallAverage >= 80) {
      recommendations.push(
        "Excellent academic performance! Continue your consistent preparation."
      );
    } else {
      recommendations.push(
        "Maintain a regular study routine to improve your academic performance."
      );
    }

    weakSubjects.forEach((item) => {
      recommendations.push(
        `Focus more on ${item.subject}. Your current score is ${item.percentage}%.`
      );
    });

    if (totalClasses === 0) {
      recommendations.push(
        "Start recording attendance to receive attendance analysis."
      );
    } else if (overallAttendance < 75) {
      recommendations.push(
        "Your overall attendance is below 75%. Attend more classes to improve it."
      );
    } else {
      recommendations.push(
        "Your overall attendance is satisfactory. Maintain consistency."
      );
    }

    attendanceRisks.forEach((item) => {
      recommendations.push(
        `Improve attendance in ${item.subject}. Current attendance is ${item.attendance}%.`
      );
    });

    if (totalSkills === 0) {
      recommendations.push(
        "Add your skills to receive personalized skill development suggestions."
      );
    } else if (beginnerSkills.length > 0) {
      recommendations.push(
        `Practice your ${beginnerSkills.length} beginner-level skills to improve proficiency.`
      );
    } else {
      recommendations.push(
        "Good progress on skill development. Continue learning advanced concepts."
      );
    }

    if (studyTotal > 0 && studyPercentage < 50) {
      recommendations.push(
        "Your study task completion is below 50%. Try completing one pending task each day."
      );
    }

    if (roadmapTotal > 0 && roadmapPercentage < 50) {
      recommendations.push(
        "Your learning roadmap is less than 50% complete. Prioritize your pending learning tasks."
      );
    }

    if (number(resume.total) === 0) {
      recommendations.push(
        "Upload your resume to receive ATS analysis and improvement suggestions."
      );
    } else if (number(resume.average_score) < 70) {
      recommendations.push(
        "Your average resume ATS score is below 70%. Improve your resume's skills and project descriptions."
      );
    }

    if (number(interviews.completed) === 0) {
      recommendations.push(
        "Complete a mock interview to evaluate your interview preparation."
      );
    } else if (number(interviews.average_score) < 60) {
      recommendations.push(
        "Practice more technical interview questions to improve your interview performance."
      );
    }

    // 11. Prepare subject-wise report
    const subjectNames = new Set([
      ...Object.keys(academicMap),
      ...Object.keys(attendanceMap)
    ]);

    const subjects = Array.from(subjectNames).map((name) => ({
      subject: name,
      academic: academicMap[name] || null,
      attendance: attendanceMap[name] || null
    }));

    // 12. Prepare enhanced insights
    const ruleBasedInsights = {
      overallAverage,
      overallAttendance,
      totalSubjects: subjectNames.size,
      totalClasses,
      weakSubjects,
      attendanceRisks,
      recommendations,

      skills: {
        total: totalSkills,
        beginner: beginnerSkills.length,
        advanced: advancedSkills.length
      },

      studyPlanner: {
        total: studyTotal,
        completed: studyCompleted,
        pending: number(study.pending),
        completionPercentage: studyPercentage
      },

      roadmap: {
        total: roadmapTotal,
        completed: roadmapCompleted,
        pending: number(roadmap.pending),
        completionPercentage: roadmapPercentage
      },

      resume: {
        total: number(resume.total),
        averageScore: number(resume.average_score)
      },

      interviews: {
        total: number(interviews.total),
        completed: number(interviews.completed),
        averageScore: number(interviews.average_score)
      }
    };

    // 13. Return report
    res.status(200).json({
      success: true,
      message: "Personalized student insights generated successfully!",
      aiStatus: "enhanced-rule-based",
      insights: ruleBasedInsights,
      subjects
    });

  } catch (error) {
    console.error("Student insights error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate student insights."
    });
  }
});

module.exports = router;
