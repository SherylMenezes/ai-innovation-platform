import { useEffect, useState } from "react";
import "../canvas/ProblemCanvas.css";
import { generateIdeas } from "../../api/aiClient";
import {
  getWorkspace,
  saveCanvasState,
  advanceStage,
} from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { stepLabel } from "../../utils/progression";
import AiMentorDrawer from "./AiMentorDrawer";

// Level 2 — explore solution directions for the How Might We statement.
// The user first works through SCAMPER or Mind Map.
// AI ideas are generated only after the user provides ideation input.

const scamperPrompts = [
  {
    letter: "S",
    title: "Substitute",
    question: "What could be replaced or substituted?",
    placeholder:
      "Think about replacing a process, material, user action, or feature...",
  },
  {
    letter: "C",
    title: "Combine",
    question: "What could be combined?",
    placeholder:
      "Could two ideas, services, features, or processes work together?",
  },
  {
    letter: "A",
    title: "Adapt",
    question: "What could be adapted from something that already exists?",
    placeholder:
      "Think about an existing approach that could be adapted...",
  },
  {
    letter: "M",
    title: "Modify",
    question: "What could be changed, improved, enlarged, or simplified?",
    placeholder: "How could the idea or process be modified?",
  },
  {
    letter: "P",
    title: "Put to Another Use",
    question: "Could something be used in a different way?",
    placeholder:
      "Could an existing resource, technology, or process serve another purpose?",
  },
  {
    letter: "E",
    title: "Eliminate",
    question: "What could be removed or simplified?",
    placeholder:
      "What unnecessary step, feature, or difficulty could be removed?",
  },
  {
    letter: "R",
    title: "Rearrange",
    question: "What could be reordered or done differently?",
    placeholder:
      "Could the sequence, responsibility, or process be rearranged?",
  },
];

function IdeatePage({ challengeId, onStageAdvance, onReward, onBack }) {
  const { accessToken } = useAuth();

  // Workspace load state
  const [challenge, setChallenge] = useState(null);
  const [savedCanvas, setSavedCanvas] = useState({});
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const [ideationMethod, setIdeationMethod] = useState("SCAMPER");

  const [scamperAnswers, setScamperAnswers] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [mindMapIdeas, setMindMapIdeas] = useState([
    "",
    "",
    "",
    "",
  ]);

  // Selected AI idea
  const [selectedIdea, setSelectedIdea] = useState(null);

  // The student's own idea, as an alternative to the AI suggestions.
  const [ownIdea, setOwnIdea] = useState({ title: "", description: "" });

  // AI-generated ideas
  const [aiIdeas, setAiIdeas] = useState([]);
  const [isAiIdeasLoading, setIsAiIdeasLoading] = useState(false);
  const [aiIdeasError, setAiIdeasError] = useState("");

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hmw = savedCanvas.hmw || "";

  // ---------------------------------------------------------
  // LOAD WORKSPACE
  // ---------------------------------------------------------

  useEffect(() => {
    if (!challengeId || !accessToken) return;

    setIsLoadingWorkspace(true);
    setWorkspaceError("");

    getWorkspace(accessToken, challengeId)
      .then((data) => {
        setChallenge(data.challenge);
        setIsLocked(data.status === "completed");

        const saved = data.canvas_state || {};

        setSavedCanvas(saved);

        if (saved.scamper_answers) {
          setScamperAnswers(saved.scamper_answers);
        }

        if (saved.mindmap_ideas) {
          setMindMapIdeas(saved.mindmap_ideas);
        }

        if (saved.selected_idea) {
          setSelectedIdea(saved.selected_idea);

          if (saved.selected_idea.source === "own") {
            setOwnIdea({
              title: saved.selected_idea.title || "",
              description: saved.selected_idea.description || "",
            });
          }
        }
      })
      .catch((err) => setWorkspaceError(err.message))
      .finally(() => setIsLoadingWorkspace(false));
  }, [challengeId, accessToken]);

  // ---------------------------------------------------------
  // CHECK WHETHER USER HAS PROVIDED IDEATION INPUT
  // ---------------------------------------------------------

  const hasIdeationInput =
    scamperAnswers.some((answer) => answer.trim().length > 0) ||
    mindMapIdeas.some((idea) => idea.trim().length > 0);

  // ---------------------------------------------------------
  // SCAMPER CHANGE
  // ---------------------------------------------------------

  const handleScamperChange = (index, value) => {
    const updatedAnswers = [...scamperAnswers];

    updatedAnswers[index] = value;

    setScamperAnswers(updatedAnswers);

    setError("");
  };

  // ---------------------------------------------------------
  // MIND MAP CHANGE
  // ---------------------------------------------------------

  const handleMindMapChange = (index, value) => {
    const updatedIdeas = [...mindMapIdeas];

    updatedIdeas[index] = value;

    setMindMapIdeas(updatedIdeas);

    setError("");
  };

  // ---------------------------------------------------------
  // OWN IDEA
  // ---------------------------------------------------------

  const isOwnIdeaSelected = selectedIdea?.source === "own";
  const canUseOwnIdea = ownIdea.title.trim() !== "" && ownIdea.description.trim() !== "";

  const handleOwnIdeaChange = (field, value) => {
    setOwnIdea((prev) => ({ ...prev, [field]: value }));

    // Editing a selected own idea deselects it, so what gets saved is
    // always exactly what the student confirmed with "Use my idea".
    if (isOwnIdeaSelected) setSelectedIdea(null);

    setError("");
  };

  const handleSelectOwnIdea = () => {
    if (!canUseOwnIdea) {
      setError("Give your idea a title and a short description first.");
      return;
    }

    setSelectedIdea({
      title: ownIdea.title.trim(),
      description: ownIdea.description.trim(),
      source: "own",
    });

    setError("");
  };

  // ---------------------------------------------------------
  // GENERATE AI IDEAS
  // ---------------------------------------------------------

  const handleGenerateMoreIdeas = async () => {
    if (!hmw.trim()) {
      setAiIdeasError(
        "No How Might We statement found. Complete the Problem Canvas first."
      );
      return;
    }

    if (!hasIdeationInput) {
      setAiIdeasError(
        "Complete at least one SCAMPER or Mind Map field before generating ideas."
      );
      return;
    }

    if (isAiIdeasLoading) return;

    setIsAiIdeasLoading(true);
    setAiIdeasError("");
    setError("");

    try {
      const ideationContext = [
        ...scamperAnswers.filter((answer) => answer.trim()),
        ...mindMapIdeas.filter((idea) => idea.trim()),
      ].join("\n");

      const prompt = `
How Might We:
${hmw}

Student ideation input:
${ideationContext}

Generate practical and innovative solution directions based on the student's ideation.
`;

      const result = await generateIdeas(prompt, 5);

      setAiIdeas(result.ideas || []);
    } catch (err) {
      setAiIdeasError(err.message);
    } finally {
      setIsAiIdeasLoading(false);
    }
  };

  // ---------------------------------------------------------
  // SAVE AND CONTINUE
  // ---------------------------------------------------------

  const handleFinishIdeation = async () => {
    if (!selectedIdea) {
      setError("Select an idea to carry forward before continuing.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const canvasState = {
        ...savedCanvas,
        scamper_answers: scamperAnswers,
        mindmap_ideas: mindMapIdeas,
        selected_idea: selectedIdea,
        // Every idea the student saw, so Idea Evaluation can rank the
        // chosen one against them and offer a switch.
        idea_options:
          aiIdeas.length > 0
            ? aiIdeas.map(({ title, description }) => ({ title, description }))
            : savedCanvas.idea_options || [],
      };

      const result = await saveCanvasState(
        accessToken,
        challengeId,
        canvasState,
        "ideation_complete"
      );

      setSavedCanvas(canvasState);

      onReward?.({
        ...result,
        label: stepLabel("ideation_complete"),
      });

      const advanced = await advanceStage(
        accessToken,
        challengeId,
        "ideation"
      );

      onReward?.(advanced);

      onStageAdvance?.(advanced.current_stage);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (isLoadingWorkspace) {
    return (
      <div className="workspace">
        <p className="canvas-loading">
          Loading your saved progress...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (workspaceError) {
    return (
      <div className="workspace">
        <p className="error-message">{workspaceError}</p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // LOCKED
  // ---------------------------------------------------------

  if (isLocked) {
    return (
      <div className="workspace">
        <p className="canvas-loading">
          This challenge is already completed — open it from the Dashboard or
          Challenges tab to view your submitted approach.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <div className="workspace">

      <header className="workspace-header">
        <p className="workspace-label">PROJECT WORKSPACE</p>

        {challenge && (
          <h1 className="workspace-challenge-title">
            {challenge.title}
          </h1>
        )}
      </header>

      <main className="canvas-content">

        {/* INTRO */}
        <section className="canvas-intro">
          <p className="section-label">CREATIVE IDEATION</p>

          <h2>
            Turn your challenge into possible solutions
          </h2>

          <p>
            Explore different approaches, generate ideas, and build on the
            directions that seem most promising.
          </p>
        </section>

        <section className="ideas-card">

          {/* STEP HEADER */}
          <div className="step-heading">
            <span className="step-number">02</span>

            <div>
              <h3>Ideate</h3>

              <p>
                Explore different approaches before deciding which solution
                direction to develop.
              </p>
            </div>
          </div>

          {/* HMW ERROR */}
          {!hmw.trim() && (
            <p className="error-message">
              No How Might We statement found — go back to Level 1
              (Problem Canvas) and complete the Reframe step first.
            </p>
          )}

          {/* HMW */}
          <div className="original-problem">
            <span>HOW MIGHT WE</span>

            <p>{hmw}</p>
          </div>

          {/* IDEATION METHODS */}
          <div className="ideation-tools">

            <div className="ideation-tools-heading">

              <p className="idea-placeholder-label">
                IDEATION METHOD
              </p>

              <h3>
                Choose a way to explore your challenge
              </h3>

              <p>
                Try different thinking methods to discover solution directions
                you may not have considered initially.
              </p>

            </div>

            {/* METHOD TABS */}
            <div className="method-tabs">

              <button
                className={
                  ideationMethod === "SCAMPER"
                    ? "method-active"
                    : ""
                }
                onClick={() => setIdeationMethod("SCAMPER")}
              >
                SCAMPER
              </button>

              <button
                className={
                  ideationMethod === "Mind Map"
                    ? "method-active"
                    : ""
                }
                onClick={() => setIdeationMethod("Mind Map")}
              >
                Mind Map
              </button>

            </div>

            {/* SCAMPER */}
            {ideationMethod === "SCAMPER" && (
              <div className="scamper-section">

                <div className="method-info">

                  <h4>SCAMPER</h4>

                  <p>
                    Look at your challenge from seven different angles.
                    You do not need to use every answer later — the goal
                    is to generate possibilities.
                  </p>

                </div>

                <div className="scamper-grid">

                  {scamperPrompts.map((prompt, index) => (

                    <div
                      className="scamper-card"
                      key={prompt.letter}
                    >

                      <div className="scamper-heading">

                        <span className="scamper-letter">
                          {prompt.letter}
                        </span>

                        <div>

                          <h4>
                            {prompt.title}
                          </h4>

                          <p>
                            {prompt.question}
                          </p>

                        </div>

                      </div>

                      <textarea
                        value={scamperAnswers[index]}
                        onChange={(e) =>
                          handleScamperChange(
                            index,
                            e.target.value
                          )
                        }
                        placeholder={prompt.placeholder}
                      />

                    </div>

                  ))}

                </div>

              </div>
            )}

            {/* MIND MAP */}
            {ideationMethod === "Mind Map" && (
              <div className="mindmap-section">

                <div className="method-info">

                  <h4>Mind Map</h4>

                  <p>
                    Start with your How Might We statement in the centre
                    and branch into different areas that could lead to
                    possible solutions.
                  </p>

                </div>

                <div className="mindmap-board">

                  <div className="mindmap-center">

                    <span>
                      CENTRAL CHALLENGE
                    </span>

                    <p>
                      {hmw}
                    </p>

                  </div>

                  <div className="mindmap-branches">

                    <div className="mindmap-branch">

                      <label htmlFor="mindmap-users">
                        Users & Needs
                      </label>

                      <textarea
                        id="mindmap-users"
                        value={mindMapIdeas[0]}
                        onChange={(e) =>
                          handleMindMapChange(
                            0,
                            e.target.value
                          )
                        }
                        placeholder="Who is affected and what do they need?"
                      />

                    </div>

                    <div className="mindmap-branch">

                      <label htmlFor="mindmap-tech">
                        Technology
                      </label>

                      <textarea
                        id="mindmap-tech"
                        value={mindMapIdeas[1]}
                        onChange={(e) =>
                          handleMindMapChange(
                            1,
                            e.target.value
                          )
                        }
                        placeholder="What technologies could help?"
                      />

                    </div>

                    <div className="mindmap-branch">

                      <label htmlFor="mindmap-process">
                        Process & System
                      </label>

                      <textarea
                        id="mindmap-process"
                        value={mindMapIdeas[2]}
                        onChange={(e) =>
                          handleMindMapChange(
                            2,
                            e.target.value
                          )
                        }
                        placeholder="What process or system could be improved?"
                      />

                    </div>

                    <div className="mindmap-branch">

                      <label htmlFor="mindmap-opportunities">
                        Opportunities
                      </label>

                      <textarea
                        id="mindmap-opportunities"
                        value={mindMapIdeas[3]}
                        onChange={(e) =>
                          handleMindMapChange(
                            3,
                            e.target.value
                          )
                        }
                        placeholder="What possible solution directions come to mind?"
                      />

                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* AI IDEAS */}
          <div className="ideas-section">

            <div className="ideas-heading">

              <p className="idea-placeholder-label">
                ✦ AI IDEA SUGGESTIONS
              </p>

              <h3>
                Explore possible solution directions
              </h3>

              <p>
                Generate AI-powered solution directions based on your
                SCAMPER or Mind Map input.
              </p>

            </div>

            {isAiIdeasLoading && (
              <p className="ai-idea-loading">
                Generating ideas with AI...
              </p>
            )}

            {aiIdeasError && (
              <p className="error-message">
                {aiIdeasError}
              </p>
            )}

            {/* NO MOCK DATA */}
            {aiIdeas.length > 0 && (
              <div className="idea-grid">

                {aiIdeas.map((idea, index) => (

                  <div
                    className={
                      !isOwnIdeaSelected && selectedIdea?.title === idea.title
                        ? "idea-card selected-idea"
                        : "idea-card"
                    }
                    key={idea.id || index}
                  >

                    <span className="idea-number">
                      IDEA {index + 1}
                    </span>

                    <h4>
                      {idea.title}
                    </h4>

                    <p>
                      {idea.description}
                    </p>

                    <button
                      className="explore-idea-button"
                      onClick={() => {
                        setSelectedIdea({
                          title: idea.title,
                          description: idea.description,
                        });

                        setError("");
                      }}
                    >
                      {!isOwnIdeaSelected && selectedIdea?.title === idea.title
                        ? "✓ Selected"
                        : "Explore this idea →"}
                    </button>

                  </div>

                ))}

              </div>
            )}

            {/* MESSAGE BEFORE GENERATION */}
            {!isAiIdeasLoading &&
              aiIdeas.length === 0 &&
              !aiIdeasError && (
                <div className="no-ideas-message">
                  <p>
                    Complete at least one SCAMPER or Mind Map field,
                    then generate ideas based on your thinking.
                  </p>
                </div>
              )}

          </div>

          {/* OWN IDEA */}
          <div className={isOwnIdeaSelected ? "own-idea-card selected-idea" : "own-idea-card"}>

            <p className="idea-placeholder-label">
              ✎ YOUR OWN IDEA
            </p>

            <h3>
              Have a different solution in mind?
            </h3>

            <p className="own-idea-hint">
              You don't have to use an AI suggestion — describe your own idea
              and carry it forward to Idea Evaluation instead.
            </p>

            <label htmlFor="own-idea-title">
              Idea title
            </label>
            <input
              id="own-idea-title"
              type="text"
              value={ownIdea.title}
              onChange={(e) => handleOwnIdeaChange("title", e.target.value)}
              placeholder="e.g. Offline voice-first triage assistant"
              maxLength={120}
            />

            <label htmlFor="own-idea-description">
              Description
            </label>
            <textarea
              id="own-idea-description"
              value={ownIdea.description}
              onChange={(e) => handleOwnIdeaChange("description", e.target.value)}
              placeholder="What does your idea do, who is it for, and how does it address your How Might We statement?"
            />

            <button
              type="button"
              className="explore-idea-button"
              onClick={handleSelectOwnIdea}
              disabled={!canUseOwnIdea}
            >
              {isOwnIdeaSelected ? "✓ Selected" : "Use my idea →"}
            </button>

          </div>

          {/* ERROR */}
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {/* ACTIONS */}
          <div className="ideation-actions">

            <button
              className="back-button"
              onClick={() => onBack?.()}
            >
              ← Back to Problem Canvas
            </button>

            {/* GENERATE IDEAS */}
            <button
              className="generate-more-button"
              onClick={handleGenerateMoreIdeas}
              disabled={
                isAiIdeasLoading ||
                !hmw.trim() ||
                !hasIdeationInput
              }
              title={
                !hasIdeationInput
                  ? "Fill at least one SCAMPER or Mind Map field first"
                  : ""
              }
            >
              {isAiIdeasLoading
                ? "Generating..."
                : aiIdeas.length > 0
                ? "✦ Generate More Ideas"
                : "✦ Generate Ideas"}
            </button>

            {/* CONTINUE */}
            <button
              className="continue-button"
              onClick={handleFinishIdeation}
              disabled={!selectedIdea || isSaving}
            >
              {isSaving
                ? "Saving..."
                : "Save & Continue to Idea Evaluation →"}
            </button>

          </div>

        </section>

      </main>

      <AiMentorDrawer
        currentStage="ideation"
        workspaceContext={{
          hmw,
          selectedIdea,
          scamperAnswers,
          mindMapIdeas,
        }}
        workspaceId={
          challengeId
            ? String(challengeId)
            : "default"
        }
      />

    </div>
  );
}

export default IdeatePage;