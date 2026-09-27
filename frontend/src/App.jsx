import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ChallengeCatalog from "./pages/challenges/ChallengeCatalog";
import ProblemCanvas from "./pages/canvas/ProblemCanvas";
import IdeationBoard from "./pages/ideation/IdeationBoard";
import IdeaEvaluation from "./pages/evaluation/IdeaEvaluation";
import SubmissionUpload from "./pages/submission/SubmissionUpload";
import ProjectSummary from "./pages/project/ProjectSummary";
import GamificationPanel from "./pages/gamification/GamificationPanel";
import AuthPage from "./pages/auth/AuthPage";
import ChallengeLevelBar from "./components/ChallengeLevelBar";
import RewardToast from "./components/RewardToast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { getUserStats } from "./api/gamificationClient";
import { CHALLENGE_LEVELS, badgeIcon, pageForStage, unlockedLevelForStage } from "./utils/progression";

const WORKFLOW_TABS = new Set(["canvas", "ideation", "evaluation", "submit"]);
const TOAST_DURATION_MS = 4500;

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [challengeId, setChallengeId] = useState(null);
  // Enrollment.current_stage of the open challenge — decides which Level
  // tabs are unlocked.
  const [challengeStage, setChallengeStage] = useState(null);
  const [rank, setRank] = useState(null);
  const [progressKey, setProgressKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  const rankRef = useRef(null);
  const toastSeq = useRef(0);

  const { user, isAuthenticated, isLoading, logout, accessToken } = useAuth();

  const pushToast = useCallback((toast) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Refreshes the nav's Rank chip, and announces a rank-up when the
  // refreshed Rank is higher than the one we last saw.
  const refreshRank = useCallback(async () => {
    if (!accessToken) return;
    try {
      const stats = await getUserStats(accessToken);
      const previous = rankRef.current;
      if (previous && stats.rank.rank > previous.rank) {
        pushToast({ tone: "rank", title: `Rank up! You're now Rank ${stats.rank.rank}`, detail: stats.rank.title });
      }
      rankRef.current = stats.rank;
      setRank(stats.rank);
    } catch {
      // Non-fatal — the chip just keeps its last value.
    }
  }, [accessToken, pushToast]);

  useEffect(() => {
    if (!accessToken) return;
    getUserStats(accessToken)
      .then((stats) => {
        rankRef.current = stats.rank;
        setRank(stats.rank);
      })
      .catch(() => {
        // Non-fatal — the chip just stays hidden until the next refresh.
      });
  }, [accessToken]);

  // Pages call this with whatever reward info their API call returned:
  // { xp_awarded, label, cleared_level, badges }.
  const handleReward = useCallback(
    (reward = {}) => {
      const xp = reward.xp_awarded || 0;
      if (reward.cleared_level) {
        pushToast({
          tone: "level",
          title: `Level ${reward.cleared_level.number} cleared!`,
          detail: `${reward.cleared_level.name} complete${xp > 0 ? ` · +${xp} XP` : ""}`,
        });
      } else if (xp > 0) {
        pushToast({ tone: "xp", title: `+${xp} XP`, detail: reward.label });
      }
      (reward.badges || []).forEach((badge) => {
        pushToast({ tone: "badge", title: `${badgeIcon(badge.slug)} Badge unlocked`, detail: badge.name });
      });
      setProgressKey((key) => key + 1);
      refreshRank();
    },
    [pushToast, refreshRank]
  );

  const handleWorkspaceLoaded = useCallback((data) => {
    setChallengeStage(data.status === "completed" ? "completed" : data.current_stage);
  }, []);

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Selecting a challenge from the Dashboard or Catalog routes straight
  // into its saved Level (or the read-only summary once it's completed)
  // instead of dumping the student on a blank tab with nothing loaded.
  const openChallenge = (id, { status, currentStage } = {}) => {
    const stage = status === "completed" ? "completed" : currentStage || "canvas";
    setChallengeId(id);
    setChallengeStage(stage);
    setPage(pageForStage(stage));
  };

  const handleStageAdvance = (stage) => {
    setChallengeStage(stage);
    setPage(pageForStage(stage));
  };

  const goToTab = (tab) => {
    if (WORKFLOW_TABS.has(tab) && !challengeId) {
      setPage("challenges");
      return;
    }
    setPage(tab);
  };

  const unlockedLevel = challengeStage ? unlockedLevelForStage(challengeStage) : CHALLENGE_LEVELS.length;
  const showLevelBar = challengeId && (WORKFLOW_TABS.has(page) || page === "summary");

  return (
    <div className="app-shell">

      <nav className="app-page-tabs">

        <button
          type="button"
          className={page === "dashboard" ? "active-tab" : ""}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          className={page === "challenges" ? "active-tab" : ""}
          onClick={() => setPage("challenges")}
        >
          Challenges
        </button>

        {CHALLENGE_LEVELS.map((level) => {
          const isLocked = Boolean(challengeId) && level.number > unlockedLevel;
          return (
            <button
              key={level.page}
              type="button"
              className={`app-level-tab${page === level.page ? " active-tab" : ""}`}
              onClick={() => goToTab(level.page)}
              disabled={isLocked}
              title={isLocked ? `Clear Level ${level.number - 1} to unlock` : undefined}
            >
              <span className="app-level-tab-label">
                {isLocked ? "🔒 " : ""}Level {level.number}
              </span>
              {level.name}
            </button>
          );
        })}

        <button
          type="button"
          className={page === "progress" ? "active-tab" : ""}
          onClick={() => setPage("progress")}
        >
          My Progress
        </button>

        <div className="app-nav-spacer" />

        <button
          type="button"
          className="app-rank-chip"
          onClick={() => setPage("progress")}
          title={rank ? `${rank.xp_into_rank} / ${rank.xp_for_next_rank} XP to Rank ${rank.rank + 1}` : undefined}
        >
          <span className="app-current-user">{user?.name}</span>
          {rank && (
            <>
              <span className="app-rank-label">
                Rank {rank.rank} · {rank.title}
              </span>
              <span className="app-rank-track">
                <span className="app-rank-fill" style={{ width: `${rank.progress_percent}%` }} />
              </span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={logout}
        >
          Log out
        </button>

      </nav>

      {showLevelBar && (
        <ChallengeLevelBar
          challengeId={challengeId}
          refreshKey={progressKey}
          activePage={page}
          onNavigate={setPage}
          onLoaded={handleWorkspaceLoaded}
        />
      )}

      {page === "dashboard" && <DashboardOverview onOpenChallenge={openChallenge} />}

      {page === "challenges" && <ChallengeCatalog onOpenChallenge={openChallenge} />}

      {page === "canvas" && (
        challengeId
          ? <ProblemCanvas challengeId={challengeId} onStageAdvance={handleStageAdvance} onReward={handleReward} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "ideation" && (
        challengeId
          ? <IdeationBoard challengeId={challengeId} onStageAdvance={handleStageAdvance} onReward={handleReward} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "evaluation" && (
        challengeId
          ? <IdeaEvaluation challengeId={challengeId} onStageAdvance={handleStageAdvance} onReward={handleReward} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "submit" && (
        challengeId
          ? (
            <SubmissionUpload
              challengeId={challengeId}
              onReward={handleReward}
              onCompleted={() => handleStageAdvance("completed")}
            />
          )
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "summary" && (
        challengeId
          ? <ProjectSummary challengeId={challengeId} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "progress" && <GamificationPanel />}

      <RewardToast toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}

function WorkflowEmptyState({ onBrowse }) {
  return (
    <div className="workflow-empty-state">
      <p>Pick a challenge first — everything here is tied to the project you're working on.</p>
      <button type="button" onClick={onBrowse}>
        Browse Challenges
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
