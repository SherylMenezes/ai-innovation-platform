import { useEffect, useState } from "react";
import "./ChallengeLevelBar.css";
import { getWorkspace } from "../api/challengesClient";
import { useAuth } from "../context/AuthContext";
import { pageForStage } from "../utils/progression";

// The four Levels of the open challenge, shown above every workflow page:
// which Level the student is on, which are cleared or still locked, and
// XP earned per Level. Re-fetches whenever refreshKey changes (App bumps
// it after every reward).
function ChallengeLevelBar({ challengeId, refreshKey, activePage, onNavigate, onLoaded }) {
  const { accessToken } = useAuth();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    if (!accessToken || !challengeId) return;
    let cancelled = false;
    getWorkspace(accessToken, challengeId)
      .then((data) => {
        if (cancelled) return;
        setWorkspace(data);
        onLoaded?.(data);
      })
      .catch(() => {
        // Non-fatal — the page below shows its own load error.
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, challengeId, refreshKey, onLoaded]);

  if (!workspace || workspace.challenge.id !== challengeId) return null;

  const { progress } = workspace;

  return (
    <div className="level-bar">
      <div className="level-bar-header">
        <span className="level-bar-title">{workspace.challenge.title}</span>
        <span className="level-bar-summary">
          {progress.is_completed
            ? `All ${progress.total_levels} levels cleared`
            : `Level ${progress.current_level} of ${progress.total_levels} · ${progress.current_level_name}`}
          <span className="level-bar-xp">
            {progress.xp_earned} / {progress.xp_available} XP
          </span>
        </span>
      </div>

      <ol className="level-bar-steps">
        {progress.levels.map((level) => {
          const page = progress.is_completed ? "summary" : pageForStage(level.stage);
          const isActive = activePage === pageForStage(level.stage);
          return (
            <li key={level.number}>
              <button
                type="button"
                className={`level-step level-step-${level.status}${isActive ? " level-step-active" : ""}`}
                disabled={level.status === "locked"}
                onClick={() => onNavigate(page)}
                title={level.status === "locked" ? `Clear Level ${level.number - 1} to unlock` : level.name}
              >
                <span className="level-step-number">
                  {level.status === "completed" ? "✓" : level.status === "locked" ? "🔒" : level.number}
                </span>
                <span className="level-step-text">
                  <span className="level-step-label">Level {level.number}</span>
                  <span className="level-step-name">{level.name}</span>
                  <span className="level-step-xp">
                    {level.xp_earned} / {level.xp_available} XP
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ChallengeLevelBar;
