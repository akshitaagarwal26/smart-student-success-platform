
import React, { useEffect, useState } from "react";
import "./JobRecommendations.css";

const API_URL = "https://smart-student-success-platform.onrender.com/api/jobs";

function JobRecommendations() {
    const [jobs, setJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("All");
    const [type, setType] = useState("All");
    const [showSaved, setShowSaved] = useState(false);

    const token = sessionStorage.getItem("token");

    // Fetch all job recommendations
    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load job recommendations"
                );
            }

            setJobs(data.jobs || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch saved jobs
    const fetchSavedJobs = async () => {
        try {
            const response = await fetch(`${API_URL}/saved`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load saved jobs");
            }

            setSavedJobs(data.jobs || []);

        } catch (err) {
            console.error("Saved jobs error:", err);
        }
    };

    // Load data when page opens
    useEffect(() => {
        if (!token) {
            setError("Please log in to view job recommendations.");
            setLoading(false);
            return;
        }

        fetchJobs();
        fetchSavedJobs();
    }, []);

    // Save or remove a job
    const toggleSaveJob = async (job) => {
        try {
            const method = job.is_saved || showSaved ? "DELETE" : "POST";

            const response = await fetch(
                `${API_URL}/save/${job.id}`,
                {
                    method,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update saved job"
                );
            }

            await fetchJobs();
            await fetchSavedJobs();

        } catch (err) {
            alert(err.message);
        }
    };

    // Search and filter jobs
    const filteredJobs = jobs.filter((job) => {
        const matchesSearch =
            job.job_title.toLowerCase().includes(search.toLowerCase()) ||
            job.company_name.toLowerCase().includes(search.toLowerCase());

        const matchesLocation =
            location === "All" || job.location === location;

        const matchesType =
            type === "All" || job.employment_type === type;

        return matchesSearch && matchesLocation && matchesType;
    });

    const displayedJobs = showSaved ? savedJobs : filteredJobs;

    // Loading screen
    if (loading) {
        return (
            <div className="jobs-loading">
                Loading job recommendations...
            </div>
        );
    }

    return (
        <div className="job-page">

            {/* Page Header */}
            <div className="job-header">
                <div>
                    <h1>Job Recommendations</h1>
                    <p>
                        Discover opportunities that match your skills
                        and career goals.
                    </p>
                </div>

                <div className="job-header-icon">💼</div>
            </div>

            {/* Statistics */}
            <div className="job-stats">

                <div className="job-stat-card">
                    <span>Total Jobs</span>
                    <h2>{jobs.length}</h2>
                </div>

                <div className="job-stat-card">
                    <span>Perfect Matches</span>
                    <h2>
                        {
                            jobs.filter(
                                job => job.match_percentage === 100
                            ).length
                        }
                    </h2>
                </div>

                <div className="job-stat-card">
                    <span>Saved Jobs</span>
                    <h2>{savedJobs.length}</h2>
                </div>

            </div>

            {/* Search and Filters */}
            <div className="job-toolbar">

                <input
                    type="text"
                    placeholder="Search job title or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                >
                    <option value="All">All Locations</option>

                    {[...new Set(jobs.map(job => job.location))]
                        .filter(Boolean)
                        .map(loc => (
                            <option key={loc} value={loc}>
                                {loc}
                            </option>
                        ))}
                </select>

                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="All">All Job Types</option>

                    {[...new Set(jobs.map(job => job.employment_type))]
                        .filter(Boolean)
                        .map(jobType => (
                            <option key={jobType} value={jobType}>
                                {jobType}
                            </option>
                        ))}
                </select>

            </div>

            {/* Tabs */}
            <div className="job-tabs">

                <button
                    className={!showSaved ? "active" : ""}
                    onClick={() => setShowSaved(false)}
                >
                    All Recommendations
                </button>

                <button
                    className={showSaved ? "active" : ""}
                    onClick={() => setShowSaved(true)}
                >
                    Saved Jobs ({savedJobs.length})
                </button>

            </div>

            {/* Error */}
            {error && (
                <div className="job-error">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!error && displayedJobs.length === 0 && (
                <div className="job-empty">
                    No jobs found. Try changing your search or filters.
                </div>
            )}

            {/* Job Cards */}
            <div className="job-grid">

                {displayedJobs.map((job) => (

                    <div className="job-card" key={job.id}>

                        {/* Job Title */}
                        <div className="job-card-top">

                            <div>
                                <h3>{job.job_title}</h3>

                                <p className="company-name">
                                    {job.company_name}
                                </p>
                            </div>

                            {!showSaved && (
                                <span className="match-badge">
                                    {job.match_percentage}% Match
                                </span>
                            )}

                        </div>

                        {/* Job Details */}
                        <div className="job-details">

                            <span>📍 {job.location}</span>

                            <span>💼 {job.employment_type}</span>

                            <span>🎓 {job.experience_level}</span>

                        </div>

                        {/* Description */}
                        <p className="job-description">
                            {job.description}
                        </p>

                        {/* Matching Skills */}
                        {!showSaved && (
                            <>

                                <div className="match-progress">
                                    <div
                                        className="match-progress-fill"
                                        style={{
                                            width: `${job.match_percentage}%`
                                        }}
                                    />
                                </div>

                                <p className="skill-summary">
                                    {job.matched_count} of{" "}
                                    {job.total_required} required skills matched
                                </p>

                                <div className="skill-section">

                                    <h4>Matching Skills</h4>

                                    <div className="skill-tags">

                                        {job.matching_skills.map(skill => (
                                            <span
                                                className="matched-tag"
                                                key={skill}
                                            >
                                                ✓ {skill}
                                            </span>
                                        ))}

                                    </div>

                                </div>

                                {/* Missing Skills */}
                                {job.missing_skills.length > 0 && (
                                    <div className="skill-section">

                                        <h4>Skills to Improve</h4>

                                        <div className="skill-tags">

                                            {job.missing_skills.map(skill => (
                                                <span
                                                    className="missing-tag"
                                                    key={skill}
                                                >
                                                    + {skill}
                                                </span>
                                            ))}

                                        </div>

                                    </div>
                                )}

                            </>
                        )}

                        {/* Job Actions */}
                        <div className="job-actions">

                            {/* Real application link only */}
                            {job.apply_url &&
                            !job.apply_url.includes("example.com") ? (

                                <a
                                    href={job.apply_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="apply-button"
                                >
                                    Apply Now ↗
                                </a>

                            ) : (

                                <button
                                    className="apply-button unavailable-button"
                                    disabled
                                    title="A verified application link is not available yet"
                                >
                                    Application Link Unavailable
                                </button>

                            )}

                            {/* Save / Remove Job */}
                            <button
                                className="save-button"
                                onClick={() => toggleSaveJob(job)}
                            >
                                {job.is_saved || showSaved
                                    ? "♥ Remove"
                                    : "♡ Save Job"}
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default JobRecommendations;
