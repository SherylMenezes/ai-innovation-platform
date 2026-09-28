import { useEffect, useState } from "react";
import "./ProblemCanvas.css";
import "./WhysInsights.css";
import {
  scoreWhyAnswers,
  scoreHMW
} from "../../utils/scoreProblem";
import {
  scoreProblemWithAi,
  refineProblem,
  generateHmw
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

  // 1 = Define Problem, 2 = 5 Whys, 3 = Reframe
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

  // The full saved canvas_state, so saving Level 1 keeps the Level 2
  // (Ideate) fields stored alongside it.
  const [savedCanvas, setSavedCanvas] = useState({});

  const [savingStep, setSavingStep] = useState(null);

  // Real AI calls — feedback (step 1), root cause suggestions (step 2),
  // and HMW suggestions (step 3).
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAiFeedbackLoading, setIsAiFeedbackLoading] = useState(false);
  const [aiFeedbackError, setAiFeedbackError] = useState("");

  const [aiRootCause, setAiRootCause] = useState(null);
  const [isAiRootCauseLoading, setIsAiRootCauseLoading] = useState(false);
  const [aiRootCauseError, setAiRootCauseError] = useState("");
  // "continue" (extend the Whys I typed) or "scratch" (generate all 5) —
  // only used to show "Asking AI..." on the button that was clicked.
  const [aiRootCauseMode, setAiRootCauseMode] = useState(null);

  // Score of the AI's refined problem statement (separate, on-demand call).
  const [refinedScore, setRefinedScore] = useState(null);
  const [isRefinedScoreLoading, setIsRefinedScoreLoading] = useState(false);
  const [refinedScoreError, setRefinedScoreError] = useState("");

  const [aiHmwSuggestions, setAiHmwSuggestions] = useState([]);
  const [isAiHmwLoading, setIsAiHmwLoading] = useState(false);
  const [aiHmwError, setAiHmwError] = useState("");

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
        setSavedCanvas(saved);
        if (saved.whys) setWhys(saved.whys);
        if (saved.root_cause) setRootCause(saved.root_cause);
        if (saved.hmw) setHmw(saved.hmw);
        if (saved.whys) setWhysScore(scoreWhyAnswers(saved.whys));
        if (saved.hmw) setHmwScore(scoreHMW(saved.hmw));
        // Step 4 (Ideate) moved to Level 2 — older saves may still say 4.
        if (saved.step) setStep(Math.min(saved.step, 3));
      })
      .catch((err) => setWorkspaceError(err.message))
      .finally(() => setIsLoadingWorkspace(false));
  }, [challengeId, accessToken]);

  const problem = challenge?.description || "";

  const buildCanvasState = (overrides = {}) => ({
    ...savedCanvas,
    step,
    whys,
    root_cause: rootCause,
    hmw,
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

  // Step 3 -> finish Level 1 and advance the workspace to Level 2 (Ideate)
  const handleFinishCanvas = async () => {
    if (rootCause.trim() === "") {
      setError("Please review or enter the root cause before continuing.");
      return;
    }
    if (hmw.trim() === "") {
      setError("Please write a How Might We statement before continuing.");
      return;
    }
    setError("");
    const saved = await persistStep("canvas_step_3", {}, null);
    if (!saved) return;
    try {
      const result = await advanceStage(accessToken, challengeId, "canvas");
      onReward?.(result);
      onStageAdvance?.(result.current_stage);
    } catch (err) {
      setError(err.message);
    }
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

  // fromScratch = true: ignore whatever is typed and have the AI write all
  // 5 Whys. false: continue the Whys already typed (the contiguous run of
  // filled-in ones, starting from Why 1 — a gap after a blank one doesn't
  // represent a continuable chain).
  const handleGetAiRootCause = async (fromScratch = false) => {
    if (!problem.trim() || isAiRootCauseLoading) return;
    setIsAiRootCauseLoading(true);
    setAiRootCauseMode(fromScratch ? "scratch" : "continue");
    setAiRootCauseError("");
    try {
      const answeredWhys = [];
      if (!fromScratch) {
        for (const why of whys) {
          if (!why.trim()) break;
          answeredWhys.push(why.trim());
        }
      }
      const result = await refineProblem(problem, answeredWhys);
      setAiRootCause(result);
      setRefinedScore(null);
      setRefinedScoreError("");
    } catch (err) {
      setAiRootCauseError(err.message);
    } finally {
      setIsAiRootCauseLoading(false);
    }
  };

  // Scores the AI's refined problem statement with the same scorer the
  // step 1 "Get AI Feedback" button uses (/api/ai/problem-score).
  const handleScoreRefinedProblem = async () => {
    const statement = aiRootCause?.refined_problem_statement;
    if (!statement?.trim() || isRefinedScoreLoading) return;
    setIsRefinedScoreLoading(true);
    setRefinedScoreError("");
    try {
      const result = await scoreProblemWithAi(statement);
      setRefinedScore(result);
    } catch (err) {
      setRefinedScoreError(err.message);
    } finally {
      setIsRefinedScoreLoading(false);
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

      <main className="canvas-content">

        <section className="canvas-intro">
          <p className="section-label">PROBLEM FRAMING CANVAS</p>
          <h2>Understand the problem before jumping to a solution</h2>
          <p>Break down the challenge, identify the root cause, and reframe it into an opportunity.</p>
        </section>

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

            <div className="ai-button-row">
              <button
                type="button"
                className="ai-feedback-button"
                onClick={() => handleGetAiRootCause(false)}
                disabled={!problem.trim() || isAiRootCauseLoading || !whys[0].trim()}
                title={!whys[0].trim() ? "Type your first Why and the AI will continue it." : undefined}
              >
                {isAiRootCauseLoading && aiRootCauseMode === "continue" ? "Asking AI..." : "✦ Continue My Whys with AI"}
              </button>

              <button
                type="button"
                className="ai-feedback-button"
                onClick={() => handleGetAiRootCause(true)}
                disabled={!problem.trim() || isAiRootCauseLoading}
              >
                {isAiRootCauseLoading && aiRootCauseMode === "scratch" ? "Asking AI..." : "✦ Generate All 5 Whys with AI"}
              </button>
            </div>

            {aiRootCauseError && <p className="error-message">{aiRootCauseError}</p>}

            {aiRootCause && (
              <div className="ai-feedback-box">
                {aiRootCause.refined_problem_statement && (
                  <div className="refined-problem">
                    <span>Refined problem</span>
                    {aiRootCause.refined_problem_statement}
                  </div>
                )}

                {aiRootCause.refined_problem_statement && (
                  <button
                    type="button"
                    className="ai-feedback-button"
                    onClick={handleScoreRefinedProblem}
                    disabled={isRefinedScoreLoading}
                  >
                    {isRefinedScoreLoading ? "Scoring..." : "✦ Score this problem"}
                  </button>
                )}

                {refinedScoreError && <p className="error-message">{refinedScoreError}</p>}

                {refinedScore && (
                  <div className="refined-score">
                    <p className="ai-feedback-score">AI overall score: {refinedScore.overall_score}%</p>
                    <div className="refined-score-metrics">
                      {[
                        ["Clarity", refinedScore.clarity],
                        ["Specificity", refinedScore.specificity],
                        ["Actionability", refinedScore.actionability],
                      ].map(([label, metric]) => (
                        <div className="refined-score-metric" key={label}>
                          <strong>{label}: {metric?.score}%</strong>
                          <span>{metric?.reason}</span>
                        </div>
                      ))}
                    </div>
                    {refinedScore.suggestions?.length > 0 && (
                      <ul>
                        {refinedScore.suggestions.map((tip, i) => <li key={i}>{tip}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <ol className="why-chain">
                  <li className="why-chain-node why-chain-start">
                    <span>Problem</span>
                    {problem}
                  </li>
                  {(aiRootCause.five_whys || []).map((why, i) => (
                    <li className="why-chain-node" key={i}>
                      <span>Why {i + 1}</span>
                      {why}
                    </li>
                  ))}
                  <li className="why-chain-node why-chain-root">
                    <span>Root cause</span>
                    {aiRootCause.synthesized_root_cause}
                  </li>
                </ol>

                <div className="insight-grid">
                  {[
                    ["Hidden variables", aiRootCause.hidden_variables],
                    ["Stakeholders", aiRootCause.stakeholders],
                    ["Market gaps", aiRootCause.market_gaps],
                    ["Trends", aiRootCause.trend_insights],
                  ].map(([title, items]) =>
                    items?.length > 0 ? (
                      <div className="insight-card" key={title}>
                        <h5>{title}</h5>
                        <ul>
                          {items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
                <button
                  type="button"
                  className="use-ai-suggestion-button"
                  onClick={() => {
                    const filled = [...aiRootCause.five_whys, "", "", "", "", ""].slice(0, 5);
                    setWhys(filled);
                    setWhysScore(scoreWhyAnswers(filled));
                    setError("");
                  }}
                >
                  Fill in my Whys with this
                </button>
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
                onClick={handleFinishCanvas}
                disabled={rootCause.trim() === "" || hmwScore.score < PASS_THRESHOLD || savingStep === "canvas_step_3"}
                title={hmwScore.score < PASS_THRESHOLD ? "Sharpen your How Might We statement to reach at least 40% before continuing." : undefined}
              >
                {savingStep === "canvas_step_3" ? "Saving..." : "Save & Continue to Level 2: Ideate →"}
              </button>
            </div>
          </section>
        )}

      </main>

    </div>
  );
}

export default ProblemCanvas;