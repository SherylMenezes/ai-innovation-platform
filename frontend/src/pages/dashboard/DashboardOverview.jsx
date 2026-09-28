import { useEffect, useState } from "react";
import "./DashboardOverview.css";
import { getDashboardOverview } from "../../api/dashboardClient";
import { getEnrolledChallenges } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { BADGES, badgeIcon } from "../../utils/progression";
import { readCache, writeCache } from "../../utils/cache";

function DashboardOverview({ onOpenChallenge }) {
  const { accessToken, user } = useAuth();
  const cacheKey = `dashboard.${user?.id}`;
  const [overview, setOverview] = useState(() => readCache(cacheKey)?.overview || null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => !readCache(cacheKey)?.overview);
  const [projects, setProjects] = useState(() => readCache(cacheKey)?.projects || []);

  const rawBadges = overview?.badges || [];

  const defaultBadgeDefs = [
    {
      slug: "challenge-completer",
      name: "Challenge Completer",
      description: "Submitted and completed a full project challenge.",
      icon: "🎯",
    },
    {
      slug: "high-achiever",
      name: "High Achiever",
      description: "Scored 16/20 or higher on an AI-evaluated submission.",
      icon: "⚡",
    },
    {
      slug: "perfectionist",
      name: "Perfectionist",
      description: "Scored 19/20 or higher on an AI-evaluated submission.",
      icon: "💎",
    },
  ];

  const userBadges = defaultBadgeDefs.map((def) => {
    const matchingBadge = rawBadges.find((b) => (b.slug || b) === def.slug);
    const unlocked = Boolean(
      matchingBadge &&
      (typeof matchingBadge === "object" ? matchingBadge.unlocked : true)
    );

    return {
      ...def,
      icon: badgeIcon ? badgeIcon(def.slug) : def.icon,
      unlocked,
    };
  });

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
      .catch(() => {
        // Non-fatal
      });
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

  return (
    <div className="dash-panel">
      <div className="dash-stat-row">
        {/* Cell 1: Level */}
        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🎖️</span>
          <span className="dash-stat-value">Level {currentLevelNum}</span>
          <span className="dash-stat-label">{currentLevelTitle}</span>
        </div>

        {/* Cell 2: Active Projects */}
        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🚀</span>
          <span className="dash-stat-value">{overview?.active_projects ?? 0}</span>
          <span className="dash-stat-label">Active Projects</span>
        </div>

        {/* Cell 3: Completed Projects */}
        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🎉</span>
          <span className="dash-stat-value">{overview?.completed_projects ?? 0}</span>
          <span className="dash-stat-label">Completed Projects</span>
        </div>
      </div>

      <div className="dash-xp-card">
        <h4>
          Level {currentLevelNum} · {currentLevelTitle}
          {overview?.unread_notifications > 0 && (
            <span className="dash-notif-banner" style={{ marginLeft: 10 }}>
              {overview.unread_notifications} new notification
              {overview.unread_notifications === 1 ? "" : "s"}
            </span>
          )}
        </h4>
        <div className="dash-xp-header">
          <span>Welcome back, {user?.name || "there"}</span>
          <span>
            {xpInto} / {xpForNext} XP to Level {currentLevelNum + 1}
          </span>
        </div>
        <div className="dash-xp-track">
          <div className="dash-xp-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="dash-xp-total">{totalXp} XP earned in total</p>
      </div>

      <div className="badges-card">
        <div className="badges-header">
          <div>
            <h3 className="badges-title">Achievements & Badges</h3>
            <p className="badges-subtitle">Unlock milestones by completing challenge phases and tasks</p>
          </div>
          <span className="badges-count-chip">
            {userBadges.filter((b) => b.unlocked).length} / {userBadges.length} Unlocked
          </span>
        </div>

        <div className="badges-grid">
          {userBadges.map((badge) => {
            const isUnlocked = Boolean(badge.unlocked);
            return (
              <div
                key={badge.slug || badge.name}
                className={`badge-item-card ${isUnlocked ? "unlocked" : "locked"}`}
              >
                <div className="badge-icon-shield">
                  <span className="badge-icon-symbol">
                    {isUnlocked ? badge.icon || "🏅" : "🔒"}
                  </span>
                </div>

                <div className="badge-info">
                  <span className="badge-name">{badge.name}</span>
                  <span className="badge-description">
                    {badge.description || "Complete phases to unlock"}
                  </span>
                </div>

                <div className="badge-status-tag">
                  {isUnlocked ? "Unlocked" : "Locked"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-quick-links">
        <h4>Your Projects</h4>
        {projects.length === 0 ? (
          <p className="dash-empty">
            Browse the Challenges tab to start your first project.
          </p>
        ) : (
          <div className="dash-project-list">
            {projects.map((item) => (
              <ProjectCard key={item.challenge.id} item={item} onOpenChallenge={onOpenChallenge} />
            ))}
          </div>
        )}
      </div>

      {error && <p className="dash-error">{error}</p>}
    </div>
  );
}

function ProjectCard({ item, onOpenChallenge }) {
  const { progress } = item;

  return (
    <button
      type="button"
      className="dash-project-card"
      onClick={() =>
        onOpenChallenge?.(item.challenge.id, {
          status: item.status,
          currentStage: item.current_stage,
        })
      }
    >
      <span className="dash-project-main">
        <span className="dash-project-title">{item.challenge.title}</span>
        <span className="dash-project-level">
          {progress.is_completed
            ? `All ${progress.total_levels} phases cleared`
            : `Phase ${progress.current_level} of ${progress.total_levels} · ${progress.current_level_name}`}
        </span>
      </span>

      <span className="dash-project-side">
        <span
          className="dash-level-segments"
          aria-label={`${progress.levels_completed} of ${progress.total_levels} phases cleared`}
        >
          {progress.levels.map((phase) => (
            <span
              key={phase.number}
              className={`dash-level-segment dash-level-segment-${phase.status}`}
              title={`Phase ${phase.number} · ${phase.name} (${phase.status})`}
            />
          ))}
        </span>
        <span className={`dash-project-status dash-project-status-${item.status}`}>
          {progress.is_completed
            ? "Completed"
            : `${progress.xp_earned} / ${progress.xp_available} XP`}
        </span>
      </span>
    </button>
  );
}

export default DashboardOverview;