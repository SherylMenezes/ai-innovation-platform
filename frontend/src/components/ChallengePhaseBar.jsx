import { useEffect, useState } from "react";
import "./ChallengePhaseBar.css";
import { getWorkspace } from "../api/challengesClient";
import { useAuth } from "../context/AuthContext";
import { pageForStage } from "../utils/progression";

// The four Phases of the open challenge, shown above every workflow page:
// which Phase the student is on, which are cleared or still locked, and
// XP earned per Phase. Re-fetches whenever refreshKey changes (App bumps
// it after every reward).
function ChallengePhaseBar({ challengeId, refreshKey, activePage, onNavigate, onLoaded }) {
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
    <div className="phase-bar">
      <div className="phase-bar-header">
        <span className="phase-bar-title">{workspace.challenge.title}</span>
        <span className="phase-bar-summary">
          {progress.is_completed
            ? `All ${progress.total_levels} phases cleared`
            : `Phase ${progress.current_level} of ${progress.total_levels} · ${progress.current_level_name}`}
          <span className="phase-bar-xp">
            {progress.xp_earned} / {progress.xp_available} XP
          </span>
        </span>
      </div>

      <ol className="phase-bar-steps">
        {progress.levels.map((phase) => {
          const page = progress.is_completed ? "summary" : pageForStage(phase.stage);
          const isActive = activePage === pageForStage(phase.stage);
          return (
            <li key={phase.number}>
              <button
                type="button"
                className={`phase-step phase-step-${phase.status}${isActive ? " phase-step-active" : ""}`}
                disabled={phase.status === "locked"}
                onClick={() => onNavigate(page)}
                title={phase.status === "locked" ? `Clear Phase ${phase.number - 1} to unlock` : phase.name}
              >
                <span className="phase-step-number">
                  {phase.status === "completed" ? "✓" : phase.status === "locked" ? "🔒" : phase.number}
                </span>
                <span className="phase-step-text">
                  <span className="phase-step-label">Phase {phase.number}</span>
                  <span className="phase-step-name">{phase.name}</span>
                  <span className="phase-step-xp">
                    {phase.xp_earned} / {phase.xp_available} XP
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

export { ChallengePhaseBar as ChallengeLevelBar };
export default ChallengePhaseBar;