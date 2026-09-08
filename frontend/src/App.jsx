import { useState } from "react";
import "./App.css";
import ProblemCanvas from "./pages/canvas/ProblemCanvas";
import IdeationBoard from "./pages/ideation/IdeationBoard";

function App() {
  const [page, setPage] = useState("canvas");

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
      </nav>

      {page === "canvas" && <ProblemCanvas />}
      {page === "ideation" && <IdeationBoard />}

    </div>
  );
}

export default App;
