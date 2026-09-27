import { useEffect, useState } from "react";
import "./DashboardOverview.css";
import { getDashboardOverview } from "../../api/dashboardClient";
import { getEnrolledChallenges } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { BADGES, badgeIcon } from "../../utils/progression";
import { readCache, writeCache } from "../../utils/cache";

function DashboardOverview({ onOpenChallenge }) {
  const { accessToken, user } = useAuth();
  // Last-seen dashboard renders instantly; the requests below refresh it.
  const cacheKey = `dashboard.${user?.id}`;
  const [overview, setOverview] = useState(() => readCache(cacheKey)?.overview || null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => !readCache(cacheKey)?.overview);
  const [projects, setProjects] = useState(() => readCache(cacheKey)?.projects || []);
  const userBadges = overview?.badges || stats?.badges || [];

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
        setProjects(data.items);
        writeCache(cacheKey, { ...readCache(cacheKey), projects: data.items });
      })
      .catch(() => {
        // Non-fatal — the projects section keeps whatever it last showed.
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

  return (
    <div className="dash-panel">
      <div className="dash-stat-row">
        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🚀</span>
          <span className="dash-stat-value">{overview?.active_projects ?? 0}</span>
          <span className="dash-stat-label">Active Projects</span>
        </div>

        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🎉</span>
          <span className="dash-stat-value">{overview?.completed_projects ?? 0}</span>
          <span className="dash-stat-label">Completed Projects</span>
        </div>

        <div className="dash-stat-card">
          <span style={{ fontSize: "24px", marginBottom: "4px" }}>🔔</span>
          <span className="dash-stat-value">{overview?.unread_notifications ?? 0}</span>
          <span className="dash-stat-label">Unread Notifications</span>
        </div>
      </div>

      <div className="dash-xp-card">
        <h4>
          Rank {overview.rank.rank} · {overview.rank.title}
          {overview.unread_notifications > 0 && (
            <span className="dash-notif-banner" style={{ marginLeft: 10 }}>
              {overview.unread_notifications} new notification{overview.unread_notifications === 1 ? "" : "s"}
            </span>
          )}
        </h4>
        <div className="dash-xp-header">
          <span>Welcome back, {user?.name || "there"}</span>
          <span>
            {overview.rank.xp_into_rank} / {overview.rank.xp_for_next_rank} XP to Rank {overview.rank.rank + 1}
          </span>
        </div>
        <div className="dash-xp-track">
          <div className="dash-xp-fill" style={{ width: `${overview.rank.progress_percent}%` }} />
        </div>
        <p className="dash-xp-total">{overview.rank.total_xp} XP earned in total</p>
      </div>

      <div className="badges-card">
        <div className="badges-header">
          <div>
            <h3 className="badges-title">Achievements & Badges</h3>
            <p className="badges-subtitle">Unlock milestones by completing challenge levels and tasks</p>
          </div>
          <span className="badges-count-chip">
            {userBadges.filter(b => b.unlocked).length} / {userBadges.length} Unlocked
          </span>
        </div>

        <div className="badges-grid">
          {userBadges.map((badge) => {
            const isUnlocked = badge.unlocked; // or check if badge exists in user's unlocked list
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
                  <span className="badge-description">{badge.description || "Complete challenges to unlock"}</span>
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

// One enrolled challenge: which Level the student is on, a segment per
// Level (cleared / current / locked), and XP earned so far.
function ProjectCard({ item, onOpenChallenge }) {
  const { progress } = item;

  return (
    <button
      type="button"
      className="dash-project-card"
      onClick={() => onOpenChallenge?.(item.challenge.id, { status: item.status, currentStage: item.current_stage })}
    >
      <span className="dash-project-main">
        <span className="dash-project-title">{item.challenge.title}</span>
        <span className="dash-project-level">
          {progress.is_completed
            ? `All ${progress.total_levels} levels cleared`
            : `Level ${progress.current_level} of ${progress.total_levels} · ${progress.current_level_name}`}
        </span>
      </span>

      <span className="dash-project-side">
        <span className="dash-level-segments" aria-label={`${progress.levels_completed} of ${progress.total_levels} levels cleared`}>
          {progress.levels.map((level) => (
            <span
              key={level.number}
              className={`dash-level-segment dash-level-segment-${level.status}`}
              title={`Level ${level.number} · ${level.name} (${level.status})`}
            />
          ))}
        </span>
        <span className={`dash-project-status dash-project-status-${item.status}`}>
          {progress.is_completed ? "Completed" : `${progress.xp_earned} / ${progress.xp_available} XP`}
        </span>
      </span>
    </button>
  );
}

export default DashboardOverview;
