
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Fetch career roles and skill catalog
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [roles] = await db.query(
      "SELECT * FROM career_roles ORDER BY role_name"
    );

    const [skills] = await db.query(
      `SELECT
        s.id,
        s.skill_name,
        s.category,
        ss.proficiency_level
       FROM skill_catalog s
       LEFT JOIN student_skills ss
         ON s.id = ss.skill_id AND ss.user_id = ?
       ORDER BY s.category, s.skill_name`,
      [req.user.id]
    );

    res.json({
      success: true,
      roles,
      skills
    });
  } catch (error) {
    console.error("Skill gap fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skill data"
    });
  }
});

// PUT: Save or update student's proficiency level
router.put("/skills/:skillId", authMiddleware, async (req, res) => {
  try {
    const skillId = Number(req.params.skillId);
    const { proficiency_level } = req.body;

    if (
      !Number.isInteger(skillId) ||
      skillId <= 0 ||
      !Number.isInteger(proficiency_level) ||
      proficiency_level < 1 ||
      proficiency_level > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Skill ID and proficiency level must be valid. Level must be 1–5."
      });
    }

    const [result] = await db.query(
      `INSERT INTO student_skills
        (user_id, skill_id, proficiency_level)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
        proficiency_level = VALUES(proficiency_level)`,
      [req.user.id, skillId, proficiency_level]
    );

    res.json({
      success: true,
      message: "Skill level saved successfully"
    });
  } catch (error) {
    console.error("Skill update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save skill level"
    });
  }
});

// GET: Analyze skill gaps for a selected career role
router.get("/analysis/:roleId", authMiddleware, async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);

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

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Career role not found"
      });
    }

    const [skills] = await db.query(
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
       ORDER BY s.skill_name`,
      [req.user.id, roleId]
    );

    const analyzedSkills = skills.map((skill) => {
      const current = skill.current_level || 0;
      const required = skill.required_level;

      return {
        ...skill,
        current_level: skill.current_level,
        gap: Math.max(0, required - current),
        status:
          current === 0
            ? "Not Assessed"
            : current >= required
            ? "Ready"
            : "Needs Improvement"
      };
    });

    const totalScore = analyzedSkills.reduce((sum, skill) => {
      const current = skill.current_level || 0;
      return sum + Math.min(current / skill.required_level, 1);
    }, 0);

    const readiness = analyzedSkills.length
      ? Math.round((totalScore / analyzedSkills.length) * 100)
      : 0;

    res.json({
      success: true,
      role: roles[0],
      readiness,
      totalSkills: analyzedSkills.length,
      skills: analyzedSkills
    });
  } catch (error) {
    console.error("Skill analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze skill gaps"
    });
  }
});

module.exports = router;
