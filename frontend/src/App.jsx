import { useState } from "react";
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

import { AuthProvider, useAuth } from "./context/AuthContext";

const WORKFLOW_TABS = new Set(["canvas", "ideation", "evaluation", "submit"]);

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [challengeId, setChallengeId] = useState(null);

  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Selecting a challenge from the Dashboard or Catalog routes straight
  // into its saved stage (or the read-only summary once it's completed)
  // instead of dumping the student on a blank tab with nothing loaded.
  const openChallenge = (id, { status, currentStage } = {}) => {
    setChallengeId(id);
    if (status === "completed") {
      setPage("summary");
    } else {
      setPage(currentStage || "canvas");
    }
  };

  const goToTab = (tab) => {
    if (WORKFLOW_TABS.has(tab) && !challengeId) {
      setPage("challenges");
      return;
    }
    setPage(tab);
  };

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

        <button
          type="button"
          className={page === "canvas" ? "active-tab" : ""}
          onClick={() => goToTab("canvas")}
        >
          Problem Canvas
        </button>

        <button
          type="button"
          className={page === "ideation" ? "active-tab" : ""}
          onClick={() => goToTab("ideation")}
        >
          Ideation Board
        </button>

        <button
          type="button"
          className={page === "evaluation" ? "active-tab" : ""}
          onClick={() => goToTab("evaluation")}
        >
          Idea Evaluation
        </button>

        <button
          type="button"
          className={page === "submit" ? "active-tab" : ""}
          onClick={() => goToTab("submit")}
        >
          Submit
        </button>

        <button
          type="button"
          className={page === "progress" ? "active-tab" : ""}
          onClick={() => setPage("progress")}
        >
          My Progress
        </button>

        <div className="app-nav-spacer" />

        <span className="app-current-user">
          {user?.name}
        </span>

        <button
          type="button"
          onClick={logout}
        >
          Log out
        </button>

      </nav>

      {page === "dashboard" && <DashboardOverview onOpenChallenge={openChallenge} />}

      {page === "challenges" && <ChallengeCatalog onOpenChallenge={openChallenge} />}

      {page === "canvas" && (
        challengeId
          ? <ProblemCanvas challengeId={challengeId} onStageAdvance={setPage} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "ideation" && (
        challengeId
          ? <IdeationBoard challengeId={challengeId} onStageAdvance={setPage} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "evaluation" && (
        challengeId
          ? <IdeaEvaluation challengeId={challengeId} onStageAdvance={setPage} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "submit" && (
        challengeId
          ? <SubmissionUpload challengeId={challengeId} onCompleted={() => setPage("summary")} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "summary" && (
        challengeId
          ? <ProjectSummary challengeId={challengeId} />
          : <WorkflowEmptyState onBrowse={() => setPage("challenges")} />
      )}

      {page === "progress" && <GamificationPanel />}

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
