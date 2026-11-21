
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Fetch or generate personalized learning roadmap
router.get("/:roleId", authMiddleware, async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const userId = req.user.id;

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid career role ID"
      });
    }

    const [roles] = await db.query(
      "SELECT id, role_name FROM career_roles WHERE id = ?",
      [roleId]
    );

    if (!roles.length) {
      return res.status(404).json({
        success: false,
        message: "Career role not found"
      });
    }

    // Check whether a roadmap already exists
    const [existingTasks] = await db.query(
      `SELECT
        lr.id,
        lr.task_title,
        lr.description,
        lr.duration_minutes,
        lr.status,
        s.skill_name
       FROM skill_learning_roadmap lr
       JOIN skill_catalog s ON lr.skill_id = s.id
       WHERE lr.user_id = ? AND lr.role_id = ?
       ORDER BY lr.id`,
      [userId, roleId]
    );

    if (existingTasks.length > 0) {
      return res.json({
        success: true,
        role: roles[0],
        tasks: existingTasks
      });
    }

    // Find skills that need improvement
    const [gaps] = await db.query(
      `SELECT
        s.id AS skill_id,
        s.skill_name,
        rs.required_level,
        ss.proficiency_level AS current_level
       FROM role_skill_requirements rs
       JOIN skill_catalog s ON rs.skill_id = s.id
       LEFT JOIN student_skills ss
         ON ss.skill_id = s.id AND ss.user_id = ?
       WHERE rs.role_id = ?
       AND (
         ss.proficiency_level IS NULL
         OR ss.proficiency_level < rs.required_level
       )
       ORDER BY
         (rs.required_level - COALESCE(ss.proficiency_level, 0)) DESC`,
      [userId, roleId]
    );

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const skill of gaps) {
        const current = skill.current_level || 0;

        let taskTitle;
        let description;

        if (current === 0) {
          taskTitle = `Learn ${skill.skill_name} Fundamentals`;
          description = `Start with the basics of ${skill.skill_name}. Study core concepts and complete beginner exercises.`;
        } else {
          taskTitle = `Improve ${skill.skill_name}`;
          description = `Your current level is ${current}. Practice projects and exercises to reach level ${skill.required_level}.`;
        }

        await connection.query(
          `INSERT INTO skill_learning_roadmap
           (user_id, role_id, skill_id, task_title, description, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            roleId,
            skill.skill_id,
            taskTitle,
            description,
            60
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [tasks] = await db.query(
      `SELECT
        lr.id,
        lr.task_title,
        lr.description,
        lr.duration_minutes,
        lr.status,
        s.skill_name
       FROM skill_learning_roadmap lr
       JOIN skill_catalog s ON lr.skill_id = s.id
       WHERE lr.user_id = ? AND lr.role_id = ?
       ORDER BY lr.id`,
      [userId, roleId]
    );

    res.json({
      success: true,
      role: roles[0],
      tasks
    });

  } catch (error) {
    console.error("Learning roadmap error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate learning roadmap"
    });
  }
});

// PUT: Update roadmap task status
router.put("/task/:taskId", authMiddleware, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { status } = req.body;

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0 ||
      !["pending", "completed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID or status"
      });
    }

    const [result] = await db.query(
      `UPDATE skill_learning_roadmap
       SET status = ?
       WHERE id = ? AND user_id = ?`,
      [status, taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Learning task updated successfully"
    });

  } catch (error) {
    console.error("Roadmap update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update learning task"
    });
  }
});

module.exports = router;
