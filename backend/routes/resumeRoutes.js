
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const router = express.Router();
const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Safely parse JSON arrays from MySQL
const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

// Detect resume sections
const detectSections = (text = "") => {
  const patterns = [
    { name: "Education", pattern: /\beducation\b/i },
    {
      name: "Experience",
      pattern: /\b(experience|internship|employment)\b/i,
    },
    { name: "Projects", pattern: /\bprojects?\b/i },
    { name: "Skills", pattern: /\bskills?\b/i },
    {
      name: "Certifications",
      pattern: /\b(certifications?|certificates?)\b/i,
    },
  ];

  return patterns
    .filter((section) => section.pattern.test(text))
    .map((section) => section.name);
};

// Skill matching with aliases
const skillMatchesResume = (skillName, text) => {
  const normalizedText = text.toLowerCase();

  const aliases = {
    "data structures and algorithms": () =>
      /data structures/i.test(text) || /\bdsa\b/i.test(text),

    "rest apis": () =>
      /rest\s*apis?/i.test(text) || /restful\s*apis?/i.test(text),

    "node.js": () =>
      /\bnode\.?js\b/i.test(text),

    "express.js": () =>
      /\bexpress\.?js\b/i.test(text),

    "scikit-learn": () =>
      /scikit[\s-]?learn/i.test(text),
  };

  const skill = skillName.toLowerCase();

  if (aliases[skill]) {
    return aliases[skill]();
  }

  // Git and GitHub are matched independently
  return normalizedText.includes(skill);
};

// PDF upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" &&
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// Analyze resume
router.post(
  "/analyze",
  authMiddleware,
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a PDF resume.",
        });
      }

      // Extract PDF text
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text.trim();

      if (!extractedText) {
        return res.status(400).json({
          message: "No readable text found in this PDF.",
        });
      }

      // General skill detection
      const skillList = [
        "C++",
        "Java",
        "Python",
        "JavaScript",
        "SQL",
        "HTML",
        "CSS",
        "React",
        "Node.js",
        "Express.js",
        "Data Structures",
        "DBMS",
        "Machine Learning",
        "Deep Learning",
        "Pandas",
        "NumPy",
        "Scikit-learn",
        "Git",
        "GitHub",
        "REST APIs",
        "Excel",
        "Communication",
        "Leadership",
        "Problem Solving",
      ];

      const skillsFound = skillList.filter((skill) =>
        skillMatchesResume(skill, extractedText)
      );

      const missingSkills = skillList.filter(
        (skill) => !skillsFound.includes(skill)
      );

      // Resume section detection
      const sectionsFound = detectSections(extractedText);

      // General ATS estimate
      let score = 0;

      score += Math.min(skillsFound.length * 3, 45);
      score += Math.min(sectionsFound.length * 7, 35);
      score += extractedText.length >= 1000 ? 10 : 5;
      score += /\b(email|gmail\.com)\b/i.test(extractedText) ? 5 : 0;
      score += /\b(phone|mobile)\b/i.test(extractedText) ? 5 : 0;

      score = Math.min(score, 100);

      // General suggestions
      const suggestions = [];

      if (!sectionsFound.includes("Education")) {
        suggestions.push("Add an Education section.");
      }

      if (!sectionsFound.includes("Projects")) {
        suggestions.push("Add relevant academic or personal projects.");
      }

      if (!sectionsFound.includes("Experience")) {
        suggestions.push(
          "Add internship or work experience if available."
        );
      }

      if (!sectionsFound.includes("Skills")) {
        suggestions.push("Add a clearly organized Skills section.");
      }

      if (skillsFound.length < 5) {
        suggestions.push(
          "Include relevant technical skills that match your target role."
        );
      }

      if (suggestions.length === 0) {
        suggestions.push(
          "Your resume has the basic sections. Improve project descriptions and measurable achievements."
        );
      }

      // Role-specific analysis
      let targetRoleId = null;
      let targetRoleName = null;
      let roleSkillsFound = [];
      let roleMissingSkills = [];
      let roleSuggestions = [];
      let roleMatchPercentage = null;

      if (req.body.roleId) {
        const roleId = Number(req.body.roleId);

        if (!Number.isInteger(roleId) || roleId <= 0) {
          return res.status(400).json({
            message: "Invalid career role selected.",
          });
        }

        // Get selected role
        const [roleRows] = await db.query(
          `SELECT id, role_name
           FROM career_roles
           WHERE id = ?`,
          [roleId]
        );

        if (roleRows.length === 0) {
          return res.status(404).json({
            message: "Selected career role was not found.",
          });
        }

        targetRoleId = roleRows[0].id;
        targetRoleName = roleRows[0].role_name;

        // Get required skills
        const [requiredSkills] = await db.query(
          `SELECT sc.skill_name
           FROM role_skill_requirements rsr
           JOIN skill_catalog sc
             ON rsr.skill_id = sc.id
           WHERE rsr.role_id = ?
           ORDER BY sc.skill_name`,
          [targetRoleId]
        );

        if (requiredSkills.length === 0) {
          return res.status(400).json({
            message: "No required skills are configured for this role.",
          });
        }

        // Match resume skills against role requirements
        roleSkillsFound = requiredSkills
          .map((row) => row.skill_name)
          .filter((skill) =>
            skillMatchesResume(skill, extractedText)
          );

        roleMissingSkills = requiredSkills
          .map((row) => row.skill_name)
          .filter((skill) => !roleSkillsFound.includes(skill));

        // Calculate role match percentage
        roleMatchPercentage = Math.round(
          (roleSkillsFound.length / requiredSkills.length) * 100
        );

        // Role-specific suggestions
        if (roleMissingSkills.length > 0) {
          roleSuggestions.push(
            `Add evidence of these ${targetRoleName} skills where applicable: ${roleMissingSkills.join(", ")}.`
          );
        } else {
          roleSuggestions.push(
            `Your resume mentions all configured required skills for ${targetRoleName}. Strengthen your project descriptions with practical examples.`
          );
        }
      }

      // Save complete analysis in MySQL
      const [result] = await db.query(
        `INSERT INTO resume_analysis
        (
          user_id,
          file_name,
          ats_score,
          extracted_text,
          skills_found,
          missing_skills,
          sections_found,
          suggestions,
          target_role_id,
          role_skills_found,
          role_missing_skills,
          role_suggestions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          req.file.originalname,
          score,
          extractedText,
          JSON.stringify(skillsFound),
          JSON.stringify(missingSkills),
          JSON.stringify(sectionsFound),
          JSON.stringify(suggestions),
          targetRoleId,
          JSON.stringify(roleSkillsFound),
          JSON.stringify(roleMissingSkills),
          JSON.stringify(roleSuggestions),
        ]
      );

      res.status(201).json({
        success: true,
        message: "Resume analyzed successfully.",
        analysis: {
          id: result.insertId,
          fileName: req.file.originalname,
          atsScore: score,
          skillsFound,
          missingSkills,
          sectionsFound,
          suggestions,
          targetRoleId,
          targetRoleName,
          roleSkillsFound,
          roleMissingSkills,
          roleSuggestions,
          roleMatchPercentage,
        },
      });
    } catch (error) {
      console.error("Resume analysis error:", error);

      res.status(500).json({
        message: "Failed to analyze resume.",
      });
    }
  }
);

// Previous resume analyses
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        file_name,
        ats_score,
        extracted_text,
        skills_found,
        missing_skills,
        sections_found,
        suggestions,
        target_role_id,
        role_skills_found,
        role_missing_skills,
        role_suggestions,
        created_at
       FROM resume_analysis
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,

      analyses: rows.map((row) => {
        const savedSections = parseJsonArray(row.sections_found);

        return {
          ...row,
          skills_found: parseJsonArray(row.skills_found),
          missing_skills: parseJsonArray(row.missing_skills),

          sections_found:
            savedSections.length > 0
              ? savedSections
              : detectSections(row.extracted_text),

          suggestions: parseJsonArray(row.suggestions),
          role_skills_found: parseJsonArray(row.role_skills_found),
          role_missing_skills: parseJsonArray(row.role_missing_skills),
          role_suggestions: parseJsonArray(row.role_suggestions),
        };
      }),
    });
  } catch (error) {
    console.error("Resume history error:", error);

    res.status(500).json({
      message: "Failed to fetch resume history.",
    });
  }
});

module.exports = router;
