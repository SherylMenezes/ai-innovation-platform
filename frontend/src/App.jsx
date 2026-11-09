import StudentPanel from './pages/student/StudentPanel';
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import InstitutePanel from "./pages/institute/InstitutePanel";
import CompanyPanel from "./pages/company/CompanyPanel";
import ChallengeCatalog from "./pages/challenges/ChallengeCatalog";
import ProblemCanvas from "./pages/canvas/ProblemCanvas";
import IdeatePage from "./pages/ideation/IdeatePage";
import IdeaEvaluation from "./pages/evaluation/IdeaEvaluation";
import SubmissionUpload from "./pages/submission/SubmissionUpload";
import ProjectSummary from "./pages/project/ProjectSummary";
import GamificationPanel from "./pages/gamification/GamificationPanel";
import AuthPage from "./pages/auth/AuthPage";
import RoleAuthPage from "./pages/auth/RoleAuthPage";
import ChallengePhaseBar from "./components/ChallengePhaseBar";
import RewardToast from "./components/RewardToast";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getUserStats } from "./api/gamificationClient";
import { CHALLENGE_PHASES, badgeIcon, pageForStage, unlockedLevelForStage } from "./utils/progression";
import LandingPage from "./pages/landing/LandingPage";
// [AI MENTOR] mounted once below so it's available on every page
import AiMentorDrawer from "./pages/ideation/AiMentorDrawer";
import { getLevelTitle } from "./utils/levelTitles";

const WORKFLOW_TABS = new Set(["canvas", "ideation", "evaluation", "submission"]);
const TOAST_DURATION_MS = 4000;

// Roles that get their own full-screen panel instead of the student workspace.
// The backend doesn't create these roles yet; this takes effect once it does.
const INSTITUTION_ROLES = new Set(["institution", "institution_admin"]);
const COMPANY_ROLES = new Set(["company", "company_admin"]);

// [AI MENTOR] Stage names the mentor's coaching rules (llm_service.py) are
// keyed on. Only used outside a challenge — inside one, the backend reads
// the real stage from the saved workspace.
const MENTOR_STAGE_LABELS = {
  canvas: "Problem Framing",
  ideation: "Ideation",
  evaluation: "Evaluation",
  submission: "Submission",
  summary: "Project Summary",
};


function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [challengeId, setChallengeId] = useState(null);
  const [challengeStage, setChallengeStage] = useState(null);
  const [level, setLevel] = useState(null);
  const [progressKey, setProgressKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  // Logged-out screens: null = landing page, { role, mode } = that role's login / sign-up page.
  const [authView, setAuthView] = useState(null);
  // TEMP: the role pages are UI only, so submitting one opens the existing
  // AuthPage, which still does the real login. Remove once RoleAuthPage calls the API.
  const [showLegacyAuth, setShowLegacyAuth] = useState(false);
  const canSeeInstitute = true; // TEMP: preview institute panel


  const levelRef = useRef(null);
  const toastSeq = useRef(0);

  const { user, isAuthenticated, isLoading, logout, accessToken } = useAuth();

  // Clear the logged-out screens once someone signs in, so logging out returns to the landing page.
  useEffect(() => {
    if (isAuthenticated) {
      setAuthView(null);
      setShowLegacyAuth(false);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    setPage("dashboard");
    setChallengeId(null);
    setChallengeStage(null);
    logout();
  };

  const pushToast = useCallback((toast) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshLevel = useCallback(async () => {
    if (!accessToken) return;
    try {
      const stats = await getUserStats(accessToken);
      const userLevelData = stats.level || stats.rank;
      const currentLevelNum = Number(userLevelData?.level || userLevelData?.rank || 1);
      const currentLevelTitle = userLevelData?.title || getLevelTitle(currentLevelNum);

      const previous = levelRef.current;
      const prevLevelNum = Number(previous?.level || previous?.rank || 1);
      if (previous && currentLevelNum > prevLevelNum) {
        pushToast({
          tone: "level",
          title: `Level up! You're now Level ${currentLevelNum}`,
          detail: currentLevelTitle,
        });
      }
      levelRef.current = userLevelData;
      setLevel(userLevelData);
    } catch {
      // Non-fatal
    }
  }, [accessToken, pushToast]);

  useEffect(() => {
    if (!accessToken) return;
    getUserStats(accessToken)
      .then((stats) => {
        const userLevelData = stats.level || stats.rank;
        levelRef.current = userLevelData;
        setLevel(userLevelData);
      })
      .catch(() => {});
  }, [accessToken]);

  const handleReward = useCallback(
    (reward = {}) => {
      const xp = reward.xp_awarded || 0;
      const clearedPhase = reward.cleared_phase || reward.cleared_level;
      if (clearedPhase) {
        pushToast({
          tone: "phase",
          title: `Phase ${clearedPhase.number} cleared!`,
          detail: `${clearedPhase.name} complete${xp > 0 ? ` · +${xp} XP` : ""}`,
        });
      } else if (xp > 0) {
        pushToast({ tone: "xp", title: `+${xp} XP`, detail: reward.label });
      }
      (reward.badges || []).forEach((badge) => {
        pushToast({ tone: "badge", title: `${badgeIcon(badge.slug)} Badge unlocked`, detail: badge.name });
      });
      setProgressKey((key) => key + 1);
      refreshLevel();
    },
    [pushToast, refreshLevel]
  );

  const handleWorkspaceLoaded = useCallback((data) => {
    setChallengeStage(data.status === "completed" ? "completed" : data.current_stage);
  }, []);

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

  // TEMP: open the institute panel with sample data, no login needed (/?institute)
  if (new URLSearchParams(window.location.search).has("institute")) {
    return <InstitutePanel />;
  }

  // TEMP: open the company panel with sample data, no login needed (/?company)
  if (new URLSearchParams(window.location.search).has("company")) {
    return <CompanyPanel />;
  }

  // TEMP: open the student panel with sample data, no login needed (/?student)
  if (new URLSearchParams(window.location.search).has("student")) {
    return <StudentPanel />;
  }

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  // Unauthenticated view: landing page -> role picker -> that role's login / sign-up page
  if (!isAuthenticated) {
    if (showLegacyAuth) {
      return <AuthPage onBack={() => setShowLegacyAuth(false)} />;
    }
    if (authView) {
      return (
        <RoleAuthPage
          key={`${authView.role}-${authView.mode}`}
          role={authView.role}
          mode={authView.mode}
          onModeChange={(mode) => setAuthView((v) => ({ ...v, mode }))}
          onChangeRole={() => setAuthView(null)}
          onBack={() => setAuthView(null)}
          onSubmit={() => setShowLegacyAuth(true)}
        />
      );
    }
    return <LandingPage onSelectRole={(role, mode) => setAuthView({ role, mode })} />;
  }

  // Institution and company accounts land on their own panel.
  if (INSTITUTION_ROLES.has(user?.role)) {
    return <InstitutePanel />;
  }
  if (COMPANY_ROLES.has(user?.role)) {
    return <CompanyPanel />;
  }

  // Authenticated workspace shell
  const totalPhases = (CHALLENGE_PHASES || []).length || 4;
  const unlockedPhase = challengeStage ? unlockedLevelForStage(challengeStage) : totalPhases;
  const showPhaseBar = challengeId && (WORKFLOW_TABS.has(page) || page === "summary");

  const mentorWorkspaceId = showPhaseBar ? String(challengeId) : "default";

  const userLevelNum = Number(level?.level || level?.rank || user?.level || user?.rank || 1);
  // Call getLevelTitle directly so your map always controls the title:
  const userLevelTitle = getLevelTitle(userLevelNum);
  const xpIntoLevel = level?.xp_into_level ?? level?.xp_into_rank ?? 0;
  const xpForNextLevel = level?.xp_for_next_level ?? level?.xp_for_next_rank ?? 100;

  return (
    <div className="app-shell">
      <nav className="app-page-tabs">
        <button
          type="button"
          className={page === "dashboard" ? "active-tab" : ""}
          onClick={() => goToTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={page === "challenges" ? "active-tab" : ""}
          onClick={() => goToTab("challenges")}
        >
          Challenges
        </button>
        <button
          type="button"
          className={`app-phase-tab ${page === "canvas" ? "active-tab" : ""}`}
          onClick={() => goToTab("canvas")}
        >
          <span className="app-phase-tab-label">PHASE 1</span>
          Problem Canvas
        </button>
        <button
          type="button"
          className={`app-phase-tab ${page === "ideation" ? "active-tab" : ""}`}
          disabled={unlockedPhase < 2}
          onClick={() => goToTab("ideation")}
        >
          <span className="app-phase-tab-label">PHASE 2</span>
          Ideate
        </button>
        <button
          type="button"
          className={`app-phase-tab ${page === "evaluation" ? "active-tab" : ""}`}
          disabled={unlockedPhase < 3}
          onClick={() => goToTab("evaluation")}
        >
          <span className="app-phase-tab-label">PHASE 3</span>
          Idea Evaluation
        </button>
        <button
          type="button"
          className={`app-phase-tab ${page === "submission" ? "active-tab" : ""}`}
          disabled={unlockedPhase < 4}
          onClick={() => goToTab("submission")}
        >
          <span className="app-phase-tab-label">PHASE 4</span>
          Submit Project
        </button>
        <button
          type="button"
          className={page === "progress" ? "active-tab" : ""}
          onClick={() => goToTab("progress")}
        >
          My Progress
        </button>
        {canSeeInstitute && (
          <button
            type="button"
            className={page === "institute" ? "active-tab" : ""}
            onClick={() => goToTab("institute")}
          >
            Institute Panel
          </button>
        )}

        <div className="app-nav-spacer" />

        {level && (
          <div className="app-level-chip">
            <span className="app-current-user">{user?.name}</span>
            <span className="app-level-label">
              Level {userLevelNum} · {userLevelTitle}
            </span>
            <div className="app-level-track">
              <span
                className="app-level-fill"
                style={{ width: `${Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))}%` }}
              />
            </div>
          </div>
        )}

        <button type="button" className="btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      {showPhaseBar && (
        <ChallengePhaseBar
          challengeId={challengeId}
          refreshKey={progressKey}
          activePage={page}
          onNavigate={goToTab}
          onLoaded={handleWorkspaceLoaded}
        />
      )}

      <main className="app-main-content">
        <ErrorBoundary key={`${page}-${challengeId}`} onReset={() => setPage("dashboard")}>
          {page === "dashboard" && <DashboardOverview onOpenChallenge={openChallenge} />}
          {page === "challenges" && <ChallengeCatalog onOpenChallenge={openChallenge} />}
          {page === "canvas" && (
            <ProblemCanvas
              challengeId={challengeId}
              onStageAdvance={handleStageAdvance}
              onReward={handleReward}
            />
          )}
          {page === "ideation" && (
            <IdeatePage
              challengeId={challengeId}
              onStageAdvance={handleStageAdvance}
              onReward={handleReward}
              onBack={() => goToTab("canvas")}
            />
          )}
          {page === "evaluation" && (
            <IdeaEvaluation
              challengeId={challengeId}
              onStageAdvance={handleStageAdvance}
              onReward={handleReward}
            />
          )}
          {page === "submission" && (
            <SubmissionUpload
              challengeId={challengeId}
              onReward={handleReward}
              onCompleted={() => handleStageAdvance("completed")}
            />
          )}
          {page === "summary" && <ProjectSummary challengeId={challengeId} />}
          {page === "progress" && <GamificationPanel key={progressKey} onReward={handleReward} />}
          {page === "institute" && <InstitutePanel />}
        </ErrorBoundary>
      </main>

      <AiMentorDrawer
        currentStage={MENTOR_STAGE_LABELS[page] || "Exploring the platform"}
        workspaceContext={{ page }}
        workspaceId={mentorWorkspaceId}
      />

      <RewardToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary onReset={() => window.location.reload()} resetLabel="Reload app">
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}