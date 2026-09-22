import { useEffect, useState } from "react";
import "./DashboardOverview.css";
import { getDashboardOverview } from "../../api/dashboardClient";
import { getEnrolledChallenges } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";

function DashboardOverview({ onOpenChallenge }) {
  const { accessToken, user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    getDashboardOverview(accessToken)
      .then(setOverview)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));

    getEnrolledChallenges(accessToken)
      .then((data) => setProjects(data.items))
      .catch(() => {
        // Non-fatal — the projects section just stays empty.
      });
  }, [accessToken]);

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
          <span className="dash-stat-value">{overview.active_projects}</span>
          <span className="dash-stat-label">Active projects</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{overview.completed_projects}</span>
          <span className="dash-stat-label">Completed projects</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{overview.unread_notifications}</span>
          <span className="dash-stat-label">Unread notifications</span>
        </div>
      </div>

      <div className="dash-xp-card">
        <h4>
          Level {overview.xp.level}
          {overview.unread_notifications > 0 && (
            <span className="dash-notif-banner" style={{ marginLeft: 10 }}>
              {overview.unread_notifications} new notification{overview.unread_notifications === 1 ? "" : "s"}
            </span>
          )}
        </h4>
        <div className="dash-xp-header">
          <span>Welcome back, {user?.name || "there"}</span>
          <span>
            {overview.xp.current_xp} / {overview.xp.next_level_xp} XP
          </span>
        </div>
        <div className="dash-xp-track">
          <div className="dash-xp-fill" style={{ width: `${overview.xp.progress_percent}%` }} />
        </div>
      </div>

      <div className="dash-badges">
        <h4>Badges</h4>
        {overview.badges.length === 0 ? (
          <p className="dash-empty">No badges available yet.</p>
        ) : (
          <div className="dash-badge-list">
            {overview.badges.map((b) => (
              <span
                key={b.name}
                className={`dash-badge ${b.earned ? "dash-badge-earned" : "dash-badge-locked"}`}
                title={b.description}
              >
                {b.earned ? "🏅" : "🔒"} {b.name}
              </span>
            ))}
          </div>
        )}
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
              <button
                key={item.challenge.id}
                type="button"
                className="dash-project-card"
                onClick={() =>
                  onOpenChallenge?.(item.challenge.id, { status: item.status, currentStage: item.current_stage })
                }
              >
                <span className="dash-project-title">{item.challenge.title}</span>
                <span className={`dash-project-status dash-project-status-${item.status}`}>
                  {item.status === "completed" ? "Completed" : `In progress — ${item.current_stage}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="dash-error">{error}</p>}
    </div>
  );
}

export default DashboardOverview;
