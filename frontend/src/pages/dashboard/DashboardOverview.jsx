import { useEffect, useState } from "react";
import "./DashboardOverview.css";
import { getDashboardOverview } from "../../api/dashboardClient";
import { getEnrolledChallenges } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { readCache, writeCache } from "../../utils/cache";

const PHASE_NAMES = [
  "Problem Canvas",
  "Ideate",
  "Idea Evaluation",
  "Submit Project"
];

function DashboardOverview({ onOpenChallenge }) {
  const { accessToken, user } = useAuth();
  const cacheKey = `dashboard.${user?.id}`;
  const [overview, setOverview] = useState(() => readCache(cacheKey)?.overview || null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => !readCache(cacheKey)?.overview);
  const [projects, setProjects] = useState(() => readCache(cacheKey)?.projects || []);
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    if (!accessToken) return;
    setError("");
    getDashboardOverview(accessToken)
      .then((data) => {
        setOverview(data);
        writeCache(cacheKey, { ...readCache(cacheKey), overview: data });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));

    getEnrolledChallenges(accessToken)
      .then((data) => {
        setProjects(data.items || []);
        writeCache(cacheKey, { ...readCache(cacheKey), projects: data.items || [] });
      })
      .catch(() => {});
  }, [accessToken, cacheKey]);

  if (isLoading) {
    return <div className="dash-panel dash-loading">Loading your dashboard...</div>;
  }

  if (error && !overview) {
    return (
      <div className="dash-panel">
        <p className="dash-error">{error}</p>
      </div>
    );
  }

  const levelData = overview?.level || overview?.rank || {
    level: 1,
    title: "Explorer",
    xp_into_level: 0,
    xp_for_next_level: 100,
    progress_percent: 0,
    total_xp: 0,
  };

  const currentLevelNum = levelData.level || levelData.rank || 1;
  const currentLevelTitle = levelData.title || "Explorer";
  const xpInto = levelData.xp_into_level ?? levelData.xp_into_rank ?? 0;
  const xpForNext = levelData.xp_for_next_level ?? levelData.xp_for_next_rank ?? 100;
  const progressPercent = levelData.progress_percent ?? 0;
  const totalXp = levelData.total_xp ?? overview?.xp ?? 0;

  const activeProjectsCount = overview?.active_projects ?? 0;
  const completedProjectsCount = overview?.completed_projects ?? 0;
  const totalEnrolled = projects?.length ?? (activeProjectsCount + completedProjectsCount);

  const filteredProjects = projects.filter((item) => {
    if (projectFilter === "active") return item.status !== "completed";
    if (projectFilter === "completed") return item.status === "completed";
    return true;
  });

  return (
    <div className="dash-panel">
      {/* 3 Metric Stat Cards - Dynamic State Classes */}
      <div className="dash-stat-row">
        <div className={`dash-stat-card card-level level-${(currentLevelNum % 5) || 1}`}>
          <span className="dash-stat-icon">🎖️</span>
          <span className="dash-stat-value">Level {currentLevelNum}</span>
          <span className="dash-stat-label">{currentLevelTitle}</span>
        </div>

        <div className={`dash-stat-card card-completed ${completedProjectsCount > 0 ? "has-completed" : "zero-count"}`}>
          <span className="dash-stat-icon">🎉</span>
          <div className="dash-stat-fraction">
            <span className="fraction-current">{completedProjectsCount}</span>
            <span className="fraction-divider">/</span>
            <span className="fraction-total">{totalEnrolled}</span>
          </div>
          <span className="dash-stat-label">
            Completed {completedProjectsCount === 1 ? "Project" : "Projects"}
          </span>
        </div>

        <div className={`dash-stat-card card-active ${activeProjectsCount > 0 ? "has-active" : "zero-count"}`}>
          <span className="dash-stat-icon">🚀</span>
          <div className="dash-stat-fraction">
            <span className="fraction-current">{activeProjectsCount}</span>
            <span className="fraction-divider">/</span>
            <span className="fraction-total">{totalEnrolled}</span>
          </div>
          <span className="dash-stat-label">
            Active {activeProjectsCount === 1 ? "Project" : "Projects"}
          </span>
        </div>
      </div>

      {/* Row 2: Level XP Banner With Restored Subrow Styles */}
      <div className="dash-xp-card">
        <h4 className="dash-xp-title">
          Level {currentLevelNum} · {currentLevelTitle}
          {overview?.unread_notifications > 0 && (
            <span className="dash-notif-banner">
              {overview.unread_notifications} new notification{overview.unread_notifications === 1 ? "" : "s"}
            </span>
          )}
        </h4>

        <div className="dash-xp-header">
          <div className="dash-xp-sub">
          <span>Welcome back, {user?.name || "there"}</span></div>
          <div className="dash-xp-sub">
          <span>{xpInto} / {xpForNext} XP to Level {currentLevelNum + 1}</span></div>
        </div>

        <div className="dash-xp-track">
          <div className="dash-xp-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="dash-xp-sub">{totalXp} XP earned in total</p>
      </div>

      {/* Row 3: Expanded Projects Section */}
      <div className="dash-projects-section">
        <div className="dash-section-header">
          <div>
            <h3 className="dash-section-title">Your Projects</h3>
            <p className="dash-section-subtitle">Track your progress and continue working through challenge phases</p>
          </div>

          <div className="dash-filter-chips">
            <button
              type="button"
              className={`dash-filter-btn ${projectFilter === "all" ? "active" : ""}`}
              onClick={() => setProjectFilter("all")}
            >
              All ({projects.length})
            </button>
            <button
              type="button"
              className={`dash-filter-btn ${projectFilter === "active" ? "active" : ""}`}
              onClick={() => setProjectFilter("active")}
            >
              In Progress ({projects.filter((p) => p.status !== "completed").length})
            </button>
            <button
              type="button"
              className={`dash-filter-btn ${projectFilter === "completed" ? "active" : ""}`}
              onClick={() => setProjectFilter("completed")}
            >
              Completed ({projects.filter((p) => p.status === "completed").length})
            </button>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="dash-empty-card">
            <span style={{ fontSize: "36px" }}>💡</span>
            <h4>No projects in this view</h4>
            <p>Visit the Challenges catalog to start solving new problems.</p>
          </div>
        ) : (
          <div className="dash-project-grid">
            {filteredProjects.map((item) => (
              <DetailedProjectCard
                key={item.challenge.id}
                item={item}
                onOpenChallenge={onOpenChallenge}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="dash-error">{error}</p>}
    </div>
  );
}

function DetailedProjectCard({ item, onOpenChallenge }) {
  const { challenge, progress, status, current_stage } = item;
  const isCompleted = status === "completed";
  const currentPhaseNum = progress.current_level || 1;
  const totalPhases = progress.total_levels || 4;
  const xpPercent = Math.min(100, Math.round((progress.xp_earned / (progress.xp_available || 1)) * 100));

  return (
    <div className={`detailed-project-card ${isCompleted ? "completed" : ""}`}>
      <div className="project-card-top">
        <div className="project-tag-row">
          <span className="project-category-badge">{challenge.category || "Challenge"}</span>
          <span className={`project-status-badge ${status}`}>
            {isCompleted ? "✓ Completed" : `Phase ${currentPhaseNum} of ${totalPhases}`}
          </span>
        </div>
        <h4 className="project-card-title">{challenge.title}</h4>
        {challenge.summary && <p className="project-card-summary">{challenge.summary}</p>}
      </div>

      <div className="project-stepper">
        <div className="stepper-label-row">
          <span className="stepper-title">Progression</span>
          <span className="stepper-current-phase">
            {isCompleted ? "All Phases Completed" : `Current: Phase ${currentPhaseNum} · ${progress.current_level_name || PHASE_NAMES[currentPhaseNum - 1]}`}
          </span>
        </div>

        <div className="stepper-track">
          {progress.levels.map((phase) => (
            <div
              key={phase.number}
              className={`stepper-node stepper-node-${phase.status}`}
              title={`Phase ${phase.number}: ${phase.name} (${phase.status})`}
            >
              <div className="stepper-node-circle">
                {phase.status === "completed" ? "✓" : phase.status === "locked" ? "🔒" : phase.number}
              </div>
              <span className="stepper-node-text">{phase.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="project-card-bottom">
        <div className="project-xp-info">
          <div className="project-xp-header">
            <span>Earned XP</span>
            <span className="project-xp-count">{progress.xp_earned} / {progress.xp_available} XP</span>
          </div>
          <div className="project-xp-track">
            <div className="project-xp-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        <button
          type="button"
          className="btn-continue-project"
          onClick={() => onOpenChallenge?.(challenge.id, { status, currentStage: current_stage })}
        >
          {isCompleted ? "View Summary" : `Continue Phase ${currentPhaseNum} →`}
        </button>
      </div>
    </div>
  );
}

export default DashboardOverview;