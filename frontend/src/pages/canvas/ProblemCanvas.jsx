import { useEffect, useState } from "react";
import "./ProblemCanvas.css";
import {
  scoreWhyAnswers,
  scoreHMW
} from "../../utils/scoreProblem";
import {
  scoreProblemWithAi,
  refineProblem,
  generateHmw,
  generateIdeas
} from "../../api/aiClient";
import { getWorkspace, saveCanvasState, advanceStage } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { stepLabel } from "../../utils/progression";

// Minimum score required before a step's Continue button unlocks.
const PASS_THRESHOLD = 40;

// Compact clarity/quality indicator shown next to a scored field.
function ScoreIndicator({ label, score, tips }) {
  const level =
    score >= 75 ? "high" : score >= PASS_THRESHOLD ? "medium" : "low";

  return (
    <div className={`score-indicator score-${level}`}>

      <div className="score-indicator-top">
        <span className="score-indicator-label">
          {label}: {score}%
        </span>
      </div>

      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%` }}
        />
      </div>

      {tips.length > 0 && (
        <div className="score-tip-chips">
          {tips.slice(0, 3).map((tip, i) => (
            <span className="score-tip-chip" key={i}>
              {tip}
            </span>
          ))}
        </div>
      )}

    </div>
  );
}

function ProblemCanvas({ challengeId, onStageAdvance, onReward }) {
  const { accessToken } = useAuth();

  // Workspace load state
  const [challenge, setChallenge] = useState(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Five Why answers
  const [whys, setWhys] = useState(["", "", "", "", ""]);

  // 1 = Define Problem, 2 = 5 Whys, 3 = Reframe, 4 = Ideation Board
  const [step, setStep] = useState(1);

  // Validation
  const [error, setError] = useState("");

  // Root cause
  const [rootCause, setRootCause] = useState("");

  // How Might We statement
  const [hmw, setHmw] = useState("");

  // Live heuristic scores for the scored fields
  const [whysScore, setWhysScore] = useState({ score: 0, tips: [] });
  const [hmwScore, setHmwScore] = useState({ score: 0, tips: [] });

  // Current ideation method
  const [ideationMethod, setIdeationMethod] = useState("SCAMPER");

  // SCAMPER answers
  const [scamperAnswers, setScamperAnswers] = useState(["", "", "", "", "", "", ""]);

  // Mind Map answers
  const [mindMapIdeas, setMindMapIdeas] = useState(["", "", "", ""]);

  // Selected AI idea — stores the idea object itself (not an index), so
  // the selection survives a reload even if the AI idea list regenerates.
  const [selectedIdea, setSelectedIdea] = useState(null);

  // Additional AI-generated ideas (appended on "Generate More Ideas")
  const [extraIdeas, setExtraIdeas] = useState([]);

  const [savingStep, setSavingStep] = useState(null);

  // Real AI calls — feedback (step 1), root cause suggestions (step 2),
  // HMW suggestions (step 3), and the initial idea batch (step 4).
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAiFeedbackLoading, setIsAiFeedbackLoading] = useState(false);
  const [aiFeedbackError, setAiFeedbackError] = useState("");

  const [aiRootCause, setAiRootCause] = useState(null);
  const [isAiRootCauseLoading, setIsAiRootCauseLoading] = useState(false);
  const [aiRootCauseError, setAiRootCauseError] = useState("");

  const [aiHmwSuggestions, setAiHmwSuggestions] = useState([]);
  const [isAiHmwLoading, setIsAiHmwLoading] = useState(false);
  const [aiHmwError, setAiHmwError] = useState("");

  const [aiIdeas, setAiIdeas] = useState([]);
  const [isAiIdeasLoading, setIsAiIdeasLoading] = useState(false);
  const [aiIdeasError, setAiIdeasError] = useState("");

  // Load (or resume) this challenge's saved canvas progress.
  useEffect(() => {
    if (!challengeId || !accessToken) return;
    setIsLoadingWorkspace(true);
    setWorkspaceError("");
    getWorkspace(accessToken, challengeId)
      .then((data) => {
        setChallenge(data.challenge);
        setIsLocked(data.status === "completed");

        const saved = data.canvas_state || {};
        if (saved.whys) setWhys(saved.whys);
        if (saved.root_cause) setRootCause(saved.root_cause);
        if (saved.hmw) setHmw(saved.hmw);
        if (saved.scamper_answers) setScamperAnswers(saved.scamper_answers);
        if (saved.mindmap_ideas) setMindMapIdeas(saved.mindmap_ideas);
        if (saved.selected_idea) setSelectedIdea(saved.selected_idea);
        if (saved.whys) setWhysScore(scoreWhyAnswers(saved.whys));
        if (saved.hmw) setHmwScore(scoreHMW(saved.hmw));
        if (saved.step) setStep(saved.step);
      })
      .catch((err) => setWorkspaceError(err.message))
      .finally(() => setIsLoadingWorkspace(false));
  }, [challengeId, accessToken]);

  const problem = challenge?.description || "";

  const buildCanvasState = (overrides = {}) => ({
    step,
    whys,
    root_cause: rootCause,
    hmw,
    scamper_answers: scamperAnswers,
    mindmap_ideas: mindMapIdeas,
    selected_idea: selectedIdea,
    ...overrides,
  });

  const persistStep = async (stepKey, overrides, nextStep) => {
    setSavingStep(stepKey);
    try {
      const result = await saveCanvasState(accessToken, challengeId, buildCanvasState(overrides), stepKey);
      onReward?.({ ...result, label: stepLabel(stepKey) });
      if (nextStep) setStep(nextStep);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSavingStep(null);
    }
  };

  // 5 Whys guidance
  const whyQuestions = [
    { title: "Why is this problem happening?", hint: "Think about the most immediate reason behind the problem.", placeholder: "Describe the immediate cause..." },
    { title: "Why does that happen?", hint: "Look at your previous answer and ask what causes it.", placeholder: "What causes the reason you identified above?" },
    { title: "What causes that underlying issue?", hint: "Go one level deeper instead of repeating the previous answer.", placeholder: "Describe the deeper cause..." },
    { title: "Why does this deeper issue continue?", hint: "Think about systems, resources, processes, or decisions.", placeholder: "What allows this issue to continue?" },
    { title: "What is the fundamental reason?", hint: "Identify the deepest cause that could realistically be addressed.", placeholder: "Describe the root cause..." },
  ];

  const ideaSuggestions = [
    { title: "Smart Demand Planning", description: "Estimate expected demand before food is prepared so businesses can reduce unnecessary production." },
    { title: "Pre-order System", description: "Allow customers to place orders in advance so businesses know how much food is actually required." },
    { title: "Surplus Food Network", description: "Connect businesses with surplus food to nearby NGOs, shelters, or communities that can use it." },
  ];

  const scamperPrompts = [
    { letter: "S", title: "Substitute", question: "What could be replaced or substituted?", placeholder: "Think about replacing a process, material, user action, or feature..." },
    { letter: "C", title: "Combine", question: "What could be combined?", placeholder: "Could two ideas, services, features, or processes work together?" },
    { letter: "A", title: "Adapt", question: "What could be adapted from something that already exists?", placeholder: "Think about an existing approach that could be adapted..." },
    { letter: "M", title: "Modify", question: "What could be changed, improved, enlarged, or simplified?", placeholder: "How could the idea or process be modified?" },
    { letter: "P", title: "Put to Another Use", question: "Could something be used in a different way?", placeholder: "Could an existing resource, technology, or process serve another purpose?" },
    { letter: "E", title: "Eliminate", question: "What could be removed or simplified?", placeholder: "What unnecessary step, feature, or difficulty could be removed?" },
    { letter: "R", title: "Rearrange", question: "What could be reordered or done differently?", placeholder: "Could the sequence, responsibility, or process be rearranged?" },
  ];

  const handleWhyChange = (index, value) => {
    const updatedWhys = [...whys];
    updatedWhys[index] = value;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));
  };

  // Step 1 -> Step 2 (the problem statement is the challenge description —
  // nothing to validate, just save progress and move on)
  const handleAnalyze = async () => {
    setError("");
    await persistStep("canvas_step_1", { step: 2 }, 2);
  };

  // Step 2 -> Step 3
  const handleContinueToReframe = async () => {
    const hasEmptyWhy = whys.some((why) => why.trim() === "");
    if (hasEmptyWhy) {
      setError("Please answer all five Why questions before continuing.");
      return;
    }
    setError("");

    const nextRootCause = rootCause.trim() ? rootCause : whys[4];
    if (!rootCause.trim()) setRootCause(nextRootCause);

    await persistStep("canvas_step_2", { step: 3, root_cause: nextRootCause }, 3);
  };

  // Step 3 -> Step 4
  const handleGenerateIdeas = async () => {
    if (rootCause.trim() === "") {
      setError("Please review or enter the root cause before continuing.");
      return;
    }
    if (hmw.trim() === "") {
      setError("Please write a How Might We statement before continuing.");
      return;
    }
    setError("");
    await persistStep("canvas_step_3", { step: 4 }, 4);
  };

  // Step 4 -> advance workspace stage to Ideation Board
  const handleFinishCanvas = async () => {
    if (!selectedIdea) {
      setError("Select an idea to carry forward before continuing.");
      return;
    }
    setError("");
    const saved = await persistStep("canvas_step_4", {}, null);
    if (!saved) return;
    try {
      const result = await advanceStage(accessToken, challengeId, "canvas");
      onReward?.(result);
      onStageAdvance?.(result.current_stage);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScamperChange = (index, value) => {
    const updatedAnswers = [...scamperAnswers];
    updatedAnswers[index] = value;
    setScamperAnswers(updatedAnswers);
  };

  const handleMindMapChange = (index, value) => {
    const updatedIdeas = [...mindMapIdeas];
    updatedIdeas[index] = value;
    setMindMapIdeas(updatedIdeas);
  };

  const handleGetAiFeedback = async () => {
    if (!problem.trim() || isAiFeedbackLoading) return;
    setIsAiFeedbackLoading(true);
    setAiFeedbackError("");
    try {
      const result = await scoreProblemWithAi(problem);
      setAiFeedback(result);
    } catch (err) {
      setAiFeedbackError(err.message);
    } finally {
      setIsAiFeedbackLoading(false);
    }
  };

  const handleGetAiRootCause = async () => {
    if (!problem.trim() || isAiRootCauseLoading) return;
    setIsAiRootCauseLoading(true);
    setAiRootCauseError("");
    try {
      const result = await refineProblem(problem);
      setAiRootCause(result);
    } catch (err) {
      setAiRootCauseError(err.message);
    } finally {
      setIsAiRootCauseLoading(false);
    }
  };

  const handleGetAiHmwSuggestions = async () => {
    if (!rootCause.trim() || isAiHmwLoading) return;
    setIsAiHmwLoading(true);
    setAiHmwError("");
    try {
      const result = await generateHmw(rootCause);
      setAiHmwSuggestions(result.hmw_statements || []);
    } catch (err) {
      setAiHmwError(err.message);
    } finally {
      setIsAiHmwLoading(false);
    }
  };

  const handleGenerateMoreIdeas = async () => {
    if (!hmw.trim() || isAiIdeasLoading) return;
    setIsAiIdeasLoading(true);
    setAiIdeasError("");
    try {
      const result = await generateIdeas(hmw, 3);
      setExtraIdeas((prev) => [...prev, ...(result.ideas || [])]);
    } catch (err) {
      setAiIdeasError(err.message);
    } finally {
      setIsAiIdeasLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 4 || !hmw.trim() || aiIdeas.length > 0) return;
    setIsAiIdeasLoading(true);
    setAiIdeasError("");
    generateIdeas(hmw, 5)
      .then((result) => setAiIdeas(result.ideas || []))
      .catch((err) => setAiIdeasError(err.message))
      .finally(() => setIsAiIdeasLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (isLoadingWorkspace) {
    return <div className="workspace"><p className="canvas-loading">Loading your saved progress...</p></div>;
  }

  if (workspaceError) {
    return <div className="workspace"><p className="error-message">{workspaceError}</p></div>;
  }

  if (isLocked) {
    return (
      <div className="workspace">
        <p className="canvas-loading">
          This challenge is already completed — open it from the Dashboard or Challenges tab to view your submitted approach.
        </p>
      </div>
    );
  }

  return (
    <div className="workspace">

      <header className="workspace-header">
        <p className="workspace-label">PROJECT WORKSPACE</p>
        {challenge && <h1 className="workspace-challenge-title">{challenge.title}</h1>}
      </header>

      <nav className="workspace-tabs">
        <button className={step <= 3 ? "active-tab" : ""} onClick={() => setStep(1)}>Canvas</button>
        <button className={step === 4 ? "active-tab" : ""} onClick={() => setStep(4)}>Ideate</button>
      </nav>

      <main className="canvas-content">

        {step <= 3 && (
          <section className="canvas-intro">
            <p className="section-label">PROBLEM FRAMING CANVAS</p>
            <h2>Understand the problem before jumping to a solution</h2>
            <p>Break down the challenge, identify the root cause, and reframe it into an opportunity.</p>
          </section>
        )}

        {step === 4 && (
          <section className="canvas-intro">
            <p className="section-label">CREATIVE IDEATION BOARD</p>
            <h2>Turn your challenge into possible solutions</h2>
            <p>Explore different approaches, generate ideas, and build on the directions that seem most promising.</p>
          </section>
        )}

        {/* SCREEN 1 — PROBLEM STATEMENT (from the selected challenge) */}
        {step === 1 && (
          <section className="problem-card">
            <div className="step-heading">
              <span className="step-number">01</span>
              <div>
                <h3>Your Problem Statement</h3>
                <p>This comes from the challenge you selected — no need to retype it.</p>
              </div>
            </div>

            <label>Problem statement</label>
            <p className="challenge-problem-statement">{problem}</p>

            <button
              type="button"
              className="ai-feedback-button"
              onClick={handleGetAiFeedback}
              disabled={!problem.trim() || isAiFeedbackLoading}
            >
              {isAiFeedbackLoading ? "Asking AI..." : "✦ Get AI Feedback"}
            </button>

            {aiFeedbackError && <p className="error-message">{aiFeedbackError}</p>}

            {aiFeedback && (
              <div className="ai-feedback-box">
                <p className="ai-feedback-score">AI overall score: {aiFeedback.overall_score}%</p>
                {aiFeedback.suggestions?.length > 0 && (
                  <ul>
                    {aiFeedback.suggestions.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                )}
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={savingStep === "canvas_step_1"}
            >
              {savingStep === "canvas_step_1" ? "Saving..." : "Save & Continue to 5 Whys →"}
            </button>
          </section>
        )}

        {/* SCREEN 2 — 5 WHYS */}
        {step === 2 && (
          <section className="whys-card">
            <div className="step-heading">
              <span className="step-number">02</span>
              <div>
                <h3>Explore the Root Cause</h3>
                <p>Ask "why" repeatedly to uncover what is really causing the problem.</p>
              </div>
            </div>

            <div className="original-problem">
              <span>ORIGINAL PROBLEM</span>
              <p>{problem}</p>
            </div>

            <div className="whys-list">
              {whys.map((why, index) => (
                <div className="why-item" key={index}>
                  <div className="why-heading">
                    <span className="why-number">WHY {index + 1}</span>
                    <div>
                      <label htmlFor={`why-${index}`}>{whyQuestions[index].title}</label>
                      <p className="why-hint">{whyQuestions[index].hint}</p>
                    </div>
                  </div>
                  <input
                    id={`why-${index}`}
                    type="text"
                    value={why}
                    onChange={(e) => { handleWhyChange(index, e.target.value); setError(""); }}
                    placeholder={whyQuestions[index].placeholder}
                  />
                </div>
              ))}
            </div>

            <ScoreIndicator label="Depth of analysis" score={whysScore.score} tips={whysScore.tips} />

            <button
              type="button"
              className="ai-feedback-button"
              onClick={handleGetAiRootCause}
              disabled={!problem.trim() || isAiRootCauseLoading}
            >
              {isAiRootCauseLoading ? "Asking AI..." : "✦ Get AI Root Cause Suggestions"}
            </button>

            {aiRootCauseError && <p className="error-message">{aiRootCauseError}</p>}

            {aiRootCause && (
              <div className="ai-feedback-box">
                <p><strong>AI-synthesized root cause:</strong> {aiRootCause.synthesized_root_cause}</p>
                {aiRootCause.five_whys?.length > 0 && (
                  <ul>{aiRootCause.five_whys.map((why, i) => <li key={i}>{why}</li>)}</ul>
                )}
                <button
                  type="button"
                  className="use-ai-suggestion-button"
                  onClick={() => setRootCause(aiRootCause.synthesized_root_cause)}
                >
                  Use this root cause
                </button>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="whys-actions">
              <button className="back-button" onClick={() => { setError(""); setStep(1); }}>← Back</button>
              <button
                className="continue-button"
                onClick={handleContinueToReframe}
                disabled={whysScore.score < PASS_THRESHOLD || savingStep === "canvas_step_2"}
                title={whysScore.score < PASS_THRESHOLD ? "Answer the Whys with more depth to reach at least 40% before continuing." : undefined}
              >
                {savingStep === "canvas_step_2" ? "Saving..." : "Save & Continue to Reframe →"}
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 3 — REFRAME */}
        {step === 3 && (
          <section className="reframe-card">
            <div className="step-heading">
              <span className="step-number">03</span>
              <div>
                <h3>Reframe the Problem</h3>
                <p>Turn what you discovered into a clear opportunity for innovation.</p>
              </div>
            </div>

            <div className="original-problem">
              <span>ORIGINAL PROBLEM</span>
              <p>{problem}</p>
            </div>

            <div className="root-cause-box">
              <label htmlFor="root-cause">Review the proposed root cause</label>
              <p className="field-hint">We've used your fifth Why as a starting point. Edit it if needed so it clearly describes the underlying cause of the problem.</p>
              <textarea
                id="root-cause"
                value={rootCause}
                onChange={(e) => { setRootCause(e.target.value); setError(""); }}
                placeholder="Describe the root cause you identified..."
              />
            </div>

            <div className="hmw-section">
              <p className="hmw-label">HOW MIGHT WE...</p>
              <h3>Turn the root cause into an opportunity</h3>
              <p className="field-hint">Phrase the challenge as an open-ended question that encourages different possible solutions.</p>

              <textarea
                id="hmw"
                value={hmw}
                onChange={(e) => { setHmw(e.target.value); setHmwScore(scoreHMW(e.target.value)); setError(""); }}
                placeholder="How might we help [user/group] achieve [goal] despite [challenge]?"
              />

              <ScoreIndicator label="HMW quality" score={hmwScore.score} tips={hmwScore.tips} />

              <button
                type="button"
                className="ai-feedback-button"
                onClick={handleGetAiHmwSuggestions}
                disabled={!rootCause.trim() || isAiHmwLoading}
              >
                {isAiHmwLoading ? "Asking AI..." : "✦ Suggest HMW Statements"}
              </button>

              {aiHmwError && <p className="error-message">{aiHmwError}</p>}

              {aiHmwSuggestions.length > 0 && (
                <div className="ai-feedback-box">
                  {aiHmwSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="hmw-suggestion-chip"
                      onClick={() => { setHmw(item.hmw_statement); setHmwScore(scoreHMW(item.hmw_statement)); }}
                    >
                      {item.hmw_statement}
                    </button>
                  ))}
                </div>
              )}

              <div className="hmw-example">
                <strong>Example:</strong>{" "}
                How might we help local food businesses reduce unnecessary food preparation while still meeting customer demand?
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="whys-actions">
              <button className="back-button" onClick={() => { setError(""); setStep(2); }}>← Back to 5 Whys</button>
              <button
                className="continue-button"
                onClick={handleGenerateIdeas}
                disabled={rootCause.trim() === "" || hmwScore.score < PASS_THRESHOLD || savingStep === "canvas_step_3"}
                title={hmwScore.score < PASS_THRESHOLD ? "Sharpen your How Might We statement to reach at least 40% before continuing." : undefined}
              >
                {savingStep === "canvas_step_3" ? "Saving..." : "Save & Generate Ideas →"}
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 4 — CREATIVE IDEATION BOARD */}
        {step === 4 && (
          <section className="ideas-card">
            <div className="step-heading">
              <span className="step-number">04</span>
              <div>
                <h3>Creative Ideation Board</h3>
                <p>Explore different approaches before deciding which solution direction to develop.</p>
              </div>
            </div>

            <div className="original-problem">
              <span>HOW MIGHT WE</span>
              <p>{hmw}</p>
            </div>

            <div className="ideation-tools">
              <div className="ideation-tools-heading">
                <p className="idea-placeholder-label">IDEATION METHOD</p>
                <h3>Choose a way to explore your challenge</h3>
                <p>Try different thinking methods to discover solution directions you may not have considered initially.</p>
              </div>

              <div className="method-tabs">
                <button className={ideationMethod === "SCAMPER" ? "method-active" : ""} onClick={() => setIdeationMethod("SCAMPER")}>SCAMPER</button>
                <button className={ideationMethod === "Mind Map" ? "method-active" : ""} onClick={() => setIdeationMethod("Mind Map")}>Mind Map</button>
              </div>

              {ideationMethod === "SCAMPER" && (
                <div className="scamper-section">
                  <div className="method-info">
                    <h4>SCAMPER</h4>
                    <p>Look at your challenge from seven different angles. You do not need to use every answer later — the goal is to generate possibilities.</p>
                  </div>
                  <div className="scamper-grid">
                    {scamperPrompts.map((prompt, index) => (
                      <div className="scamper-card" key={prompt.letter}>
                        <div className="scamper-heading">
                          <span className="scamper-letter">{prompt.letter}</span>
                          <div>
                            <h4>{prompt.title}</h4>
                            <p>{prompt.question}</p>
                          </div>
                        </div>
                        <textarea
                          value={scamperAnswers[index]}
                          onChange={(e) => handleScamperChange(index, e.target.value)}
                          placeholder={prompt.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ideationMethod === "Mind Map" && (
                <div className="mindmap-section">
                  <div className="method-info">
                    <h4>Mind Map</h4>
                    <p>Start with your How Might We statement in the centre and branch into different areas that could lead to possible solutions.</p>
                  </div>
                  <div className="mindmap-board">
                    <div className="mindmap-center">
                      <span>CENTRAL CHALLENGE</span>
                      <p>{hmw}</p>
                    </div>
                    <div className="mindmap-branches">
                      <div className="mindmap-branch">
                        <label htmlFor="mindmap-users">Users & Needs</label>
                        <textarea id="mindmap-users" value={mindMapIdeas[0]} onChange={(e) => handleMindMapChange(0, e.target.value)} placeholder="Who is affected and what do they need?" />
                      </div>
                      <div className="mindmap-branch">
                        <label htmlFor="mindmap-tech">Technology</label>
                        <textarea id="mindmap-tech" value={mindMapIdeas[1]} onChange={(e) => handleMindMapChange(1, e.target.value)} placeholder="What technologies could help?" />
                      </div>
                      <div className="mindmap-branch">
                        <label htmlFor="mindmap-process">Process & System</label>
                        <textarea id="mindmap-process" value={mindMapIdeas[2]} onChange={(e) => handleMindMapChange(2, e.target.value)} placeholder="What process or system could be improved?" />
                      </div>
                      <div className="mindmap-branch">
                        <label htmlFor="mindmap-opportunities">Opportunities</label>
                        <textarea id="mindmap-opportunities" value={mindMapIdeas[3]} onChange={(e) => handleMindMapChange(3, e.target.value)} placeholder="What possible solution directions come to mind?" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ideas-section">
              <div className="ideas-heading">
                <p className="idea-placeholder-label">✦ AI IDEA SUGGESTIONS</p>
                <h3>Explore possible solution directions</h3>
                <p>Generated from your How Might We statement using the platform's AI ideation service.</p>
              </div>

              {isAiIdeasLoading && aiIdeas.length === 0 && <p className="ai-idea-loading">Generating ideas with AI...</p>}
              {aiIdeasError && <p className="error-message">{aiIdeasError}</p>}

              <div className="idea-grid">
                {[...(aiIdeas.length > 0 ? aiIdeas : ideaSuggestions), ...extraIdeas].map((idea, index) => (
                  <div
                    className={selectedIdea?.title === idea.title ? "idea-card selected-idea" : "idea-card"}
                    key={idea.id || index}
                  >
                    <span className="idea-number">IDEA {index + 1}</span>
                    <h4>{idea.title}</h4>
                    <p>{idea.description}</p>
                    <button
                      className="explore-idea-button"
                      onClick={() => { setSelectedIdea({ title: idea.title, description: idea.description }); setError(""); }}
                    >
                      {selectedIdea?.title === idea.title ? "✓ Selected" : "Explore this idea →"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="ideation-actions">
              <button className="back-button" onClick={() => setStep(3)}>← Back to Reframe</button>
              <button className="generate-more-button" onClick={handleGenerateMoreIdeas} disabled={isAiIdeasLoading}>
                {isAiIdeasLoading ? "Generating..." : "✦ Generate More Ideas"}
              </button>
              <button
                className="continue-button"
                onClick={handleFinishCanvas}
                disabled={!selectedIdea || savingStep === "canvas_step_4"}
              >
                {savingStep === "canvas_step_4" ? "Saving..." : "Save & Continue to Ideation Board →"}
              </button>
            </div>
          </section>
        )}

      </main>

    </div>
  );
}

export default ProblemCanvas;
