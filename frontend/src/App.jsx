import { useState } from "react";
import "./App.css";

import ProblemCanvas from "./pages/canvas/ProblemCanvas";
import IdeationBoard from "./pages/ideation/IdeationBoard";
import IdeaEvaluation from "./pages/evaluation/IdeaEvaluation";
import GamificationPanel from "./pages/gamification/GamificationPanel";
import AuthPage from "./pages/auth/AuthPage";

import { AuthProvider, useAuth } from "./context/AuthContext";

function AppShell() {
  const [page, setPage] = useState("canvas");

  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app-shell">

      <nav className="app-page-tabs">

        <button
          type="button"
          className={page === "canvas" ? "active-tab" : ""}
          onClick={() => setPage("canvas")}
        >
          Problem Canvas
        </button>

        <button
          type="button"
          className={page === "ideation" ? "active-tab" : ""}
          onClick={() => setPage("ideation")}
        >
          Ideation Board
        </button>

        <button
          type="button"
          className={page === "evaluation" ? "active-tab" : ""}
          onClick={() => setPage("evaluation")}
        >
          Idea Evaluation
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

      {page === "canvas" && <ProblemCanvas />}

      {page === "ideation" && <IdeationBoard />}

      {page === "evaluation" && <IdeaEvaluation />}

      {page === "progress" && <GamificationPanel />}

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