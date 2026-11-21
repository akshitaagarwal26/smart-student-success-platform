
const express = require("express");
const router = express.Router();

const { db } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET all jobs with personalized skill match
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [jobs] = await db.query(
            `SELECT
                jl.id,
                jl.job_title,
                jl.company_name,
                jl.location,
                jl.employment_type,
                jl.experience_level,
                jl.description,
                jl.apply_url,
                COUNT(DISTINCT jsr.skill_id) AS total_required
             FROM job_listings jl
             LEFT JOIN job_skill_requirements jsr
                ON jl.id = jsr.job_id
             WHERE jl.is_active = TRUE
             GROUP BY jl.id
             ORDER BY jl.created_at DESC`
        );

        const [studentSkills] = await db.query(
            `SELECT skill_id
             FROM student_skills
             WHERE user_id = ?`,
            [userId]
        );

        const studentSkillIds = new Set(
            studentSkills.map(skill => Number(skill.skill_id))
        );

        const [requirements] = await db.query(
            `SELECT
                jsr.job_id,
                sc.id AS skill_id,
                sc.skill_name
             FROM job_skill_requirements jsr
             JOIN skill_catalog sc
                ON jsr.skill_id = sc.id`
        );

        const [savedJobs] = await db.query(
            `SELECT job_id
             FROM saved_jobs
             WHERE user_id = ?`,
            [userId]
        );

        const savedJobIds = new Set(
            savedJobs.map(job => Number(job.job_id))
        );

        const result = jobs.map(job => {
            const jobRequirements = requirements.filter(
                skill => Number(skill.job_id) === Number(job.id)
            );

            const matchingSkills = jobRequirements.filter(
                skill => studentSkillIds.has(Number(skill.skill_id))
            );

            const missingSkills = jobRequirements.filter(
                skill => !studentSkillIds.has(Number(skill.skill_id))
            );

            const totalRequired = jobRequirements.length;

            const matchPercentage = totalRequired === 0
                ? 0
                : Math.round(
                    (matchingSkills.length / totalRequired) * 100
                );

            return {
                ...job,
                total_required: totalRequired,
                matched_count: matchingSkills.length,
                match_percentage: matchPercentage,
                matching_skills: matchingSkills.map(skill => skill.skill_name),
                missing_skills: missingSkills.map(skill => skill.skill_name),
                is_saved: savedJobIds.has(Number(job.id))
            };
        });

        result.sort(
            (a, b) => b.match_percentage - a.match_percentage
        );

        res.json({
            success: true,
            jobs: result
        });

    } catch (error) {
        console.error("Job recommendation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch job recommendations"
        });
    }
});


// SAVE a job
router.post("/save/:jobId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = Number(req.params.jobId);

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const [jobs] = await db.query(
            `SELECT id FROM job_listings
             WHERE id = ? AND is_active = TRUE`,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        await db.query(
            `INSERT IGNORE INTO saved_jobs (user_id, job_id)
             VALUES (?, ?)`,
            [userId, jobId]
        );

        res.json({
            success: true,
            message: "Job saved successfully"
        });

    } catch (error) {
        console.error("Save job error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save job"
        });
    }
});


// GET saved jobs
router.get("/saved", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [jobs] = await db.query(
            `SELECT
                jl.id,
                jl.job_title,
                jl.company_name,
                jl.location,
                jl.employment_type,
                jl.experience_level,
                jl.description,
                jl.apply_url,
                sj.saved_at
             FROM saved_jobs sj
             JOIN job_listings jl ON sj.job_id = jl.id
             WHERE sj.user_id = ?
             ORDER BY sj.saved_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            jobs
        });

    } catch (error) {
        console.error("Get saved jobs error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch saved jobs"
        });
    }
});


// REMOVE a saved job
router.delete("/save/:jobId", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = Number(req.params.jobId);

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const [result] = await db.query(
            `DELETE FROM saved_jobs
             WHERE user_id = ? AND job_id = ?`,
            [userId, jobId]
        );

        res.json({
            success: true,
            message: result.affectedRows > 0
                ? "Job removed from saved jobs"
                : "Job was not saved"
        });

    } catch (error) {
        console.error("Remove saved job error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove saved job"
        });
    }
});

module.exports = router;
