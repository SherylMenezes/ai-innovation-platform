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
  scoreProblemCanvas,
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

  // Interactive 5 Whys: AI-generated questions, the student's own answers,
  // and AI thinking hints — kept as three separate arrays so the AI can
  // never overwrite an answer.
  const [whyQuestions, setWhyQuestions] = useState(["", "", "", "", ""]);
  const [whys, setWhys] = useState(["", "", "", "", ""]); // Student answers
  const [whySuggestions, setWhySuggestions] = useState([[], [], [], [], []]);

  // AI score of the complete problem + 5-Whys chain.
  const [canvasAiScore, setCanvasAiScore] = useState(null);
  const [canvasAiScoreError, setCanvasAiScoreError] = useState("");

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
  // Which Why index the AI is currently working on (5 = root-cause
  // synthesis), so only that step shows the loading state.
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
        if (saved.why_questions) setWhyQuestions(saved.why_questions);
        // why_prompts is the name earlier saves used for the same hints.
        const savedSuggestions = saved.why_suggestions || saved.why_prompts;
        if (Array.isArray(savedSuggestions)) setWhySuggestions(savedSuggestions);
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
    why_questions: whyQuestions,
    why_suggestions: whySuggestions,
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

  // Student answers only ever change here — the AI never writes them.
  const handleWhyChange = (index, value) => {
    const updatedWhys = [...whys];
    updatedWhys[index] = value;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));
    setError("");
  };

  // Asks the AI for the Why question + 3 thinking hints at `index`, based on
  // the student's answers before it. index 5 (all five answered) returns the
  // root-cause synthesis instead of a new question.
  const handleGetAiGuidance = async (index) => {
    if (!problem.trim() || isAiRootCauseLoading) return null;
    setIsAiRootCauseLoading(true);
    setAiRootCauseMode(index);
    setAiRootCauseError("");
    setCanvasAiScoreError("");

    try {
      const answers = whys.slice(0, index).map((ans) => ans.trim());
      const result = await refineProblem(problem, answers, Math.min(index, 4));

      const questions = [...whyQuestions];
      const suggestions = [...whySuggestions];

      result.five_whys?.forEach((item, itemIndex) => {
        if (item.question) questions[itemIndex] = item.question;
        if (item.suggestions?.length) suggestions[itemIndex] = item.suggestions;
      });

      setWhyQuestions(questions);
      setWhySuggestions(suggestions);
      setAiRootCause({ ...result, five_whys: result.five_whys || [] });

      const saveOverrides = { why_questions: questions, why_suggestions: suggestions };
      if (result.synthesized_root_cause) {
        setRootCause(result.synthesized_root_cause);
        saveOverrides.root_cause = result.synthesized_root_cause;
      }

      // Keep questions, hints and answers saved as the chain grows.
      saveCanvasState(accessToken, challengeId, buildCanvasState(saveOverrides)).catch(() => {});

      return result;
    } catch (err) {
      setAiRootCauseError(err.message);
      return null;
    } finally {
      setIsAiRootCauseLoading(false);
      setAiRootCauseMode(null);
    }
  };

  // Auto-trigger Why 1 when the student enters the 5 Whys screen.
  useEffect(() => {
    if (step === 2 && problem.trim() && !whyQuestions[0] && !isAiRootCauseLoading) {
      handleGetAiGuidance(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, problem]);

  // "✦ Analyze Answer & Generate Why N": the AI reads this answer and asks
  // the next Why. After Why 5 it synthesizes the root cause from all five,
  // then the complete canvas is scored.
  const handleAnalyzeAnswer = async (index) => {
    if (!whys[index]?.trim()) {
      setError(`Please answer Why ${index + 1} before continuing.`);
      return;
    }
    setError("");

    if (index < 4) {
      await handleGetAiGuidance(index + 1);
      return;
    }

    const result = await handleGetAiGuidance(5);
    if (!result?.synthesized_root_cause) return;

    try {
      const scoreResult = await scoreProblemCanvas({
        problemStatement: problem,
        whyAnswers: whys.map((value) => value.trim()),
        rootCause: result.synthesized_root_cause,
        refinedProblemStatement: result.refined_problem_statement || "",
      });
      setCanvasAiScore(scoreResult);
    } catch (err) {
      setCanvasAiScoreError(err.message);
    }
  };

  // Thinking-hint chips append to the student's answer so they can edit it.
  const appendSuggestion = (index, suggestion) => {
    const currentAnswer = whys[index]?.trim() || "";
    handleWhyChange(index, currentAnswer ? `${currentAnswer} ${suggestion}` : suggestion);
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

  // The old root-cause AI controls are now handled by the sequential 5-Whys
  // flow above. Keep the refined-problem scorer below as a separate feature.

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
                <p>
                  The AI asks each Why based on your previous answer. You write
                  every answer — the AI thinking hints are only there to help
                  you reason.
                </p>
              </div>
            </div>

            <div className="why-interactive-chain">
              <div className="why-problem-card">
                <span>PROBLEM STATEMENT</span>
                <p>{problem}</p>
              </div>

              {whys.map((why, index) => {
                const isUnlocked = index === 0 || whys[index - 1].trim() !== "";
                if (!isUnlocked) return null;

                const question = whyQuestions[index];
                const suggestions = whySuggestions[index] || [];
                const isGenerating = isAiRootCauseLoading && aiRootCauseMode === index;
                const isAnalyzing = isAiRootCauseLoading && aiRootCauseMode === index + 1;
                const isSynthesizing = isAiRootCauseLoading && aiRootCauseMode === 5 && index === 4;

                return (
                  <div className="why-chain-step" key={index}>
                    <div className="why-question-card">
                      <span>WHY {index + 1}</span>
                      <p>
                        {question ||
                          (isGenerating
                            ? "AI is generating this Why..."
                            : "The AI will ask this Why once the previous answer is analyzed.")}
                      </p>
                    </div>

                    {question && (
                      <div className="why-answer-card">
                        <label htmlFor={`why-${index}`}>Your answer</label>
                        <textarea
                          id={`why-${index}`}
                          value={why}
                          onChange={(e) => handleWhyChange(index, e.target.value)}
                          placeholder="Write what you think is causing this..."
                          rows={4}
                        />

                        {suggestions.length > 0 && (
                          <div className="answer-suggestions">
                            <span>💡 AI thinking hints — click to add to your answer</span>
                            <div>
                              {suggestions.map((suggestion, i) => (
                                <button
                                  type="button"
                                  className="answer-suggestion"
                                  key={i}
                                  onClick={() => appendSuggestion(index, suggestion)}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {why.trim() && (
                          <button
                            type="button"
                            className="ai-feedback-button"
                            onClick={() => handleAnalyzeAnswer(index)}
                            disabled={isAiRootCauseLoading}
                          >
                            {isAnalyzing || isSynthesizing
                              ? "Analyzing..."
                              : index < 4
                                ? `✦ Analyze Answer & Generate Why ${index + 2}`
                                : "✦ Analyze Answers & Find Root Cause"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <ScoreIndicator
              label="Depth of analysis"
              score={whysScore.score}
              tips={whysScore.tips}
            />

            {aiRootCauseError && <p className="error-message">{aiRootCauseError}</p>}

            {aiRootCause?.refined_problem_statement && (
              <div className="ai-feedback-box">
                <div className="refined-problem">
                  <span>Refined problem</span>
                  {aiRootCause.refined_problem_statement}
                </div>

                <button
                  type="button"
                  className="ai-feedback-button"
                  onClick={handleScoreRefinedProblem}
                  disabled={isRefinedScoreLoading}
                >
                  {isRefinedScoreLoading ? "Scoring..." : "✦ Score this problem"}
                </button>

                {refinedScoreError && <p className="error-message">{refinedScoreError}</p>}

                {refinedScore && (
                  <div className="refined-score">
                    <p className="ai-feedback-score">
                      AI overall score: {refinedScore.overall_score}%
                    </p>
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
              </div>
            )}

            {aiRootCause?.synthesized_root_cause && (
              <>
                <div className="root-cause-highlight">
                  <div className="root-cause-highlight-icon">🎯</div>
                  <div>
                    <span>AI-IDENTIFIED ROOT CAUSE</span>
                    <h3>{aiRootCause.synthesized_root_cause}</h3>
                    <p>
                      This was synthesized from the complete chain of five
                      answers rather than from the fifth answer alone.
                    </p>
                  </div>
                </div>

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
              </>
            )}

            {canvasAiScore && (
              <div className="canvas-ai-score-card">
                <div className="canvas-ai-score-header">
                  <div>
                    <span>AI PROBLEM SCORE</span>
                    <h3>Problem Framing Canvas</h3>
                    <p>
                      The score uses the original problem, all five answers,
                      and the identified root cause.
                    </p>
                  </div>
                  <div className="canvas-overall-score">
                    <strong>{canvasAiScore.overall_score}</strong>
                    <span>/100</span>
                  </div>
                </div>

                <div className="canvas-score-metrics">
                  {[
                    ["Problem Clarity", canvasAiScore.problem_clarity],
                    ["Impact", canvasAiScore.impact],
                    ["Feasibility", canvasAiScore.feasibility],
                  ].map(([label, metric]) => (
                    <div className="canvas-score-metric" key={label}>
                      <span>{label}</span>
                      <strong>{metric?.score}%</strong>
                      <p>{metric?.explanation}</p>
                    </div>
                  ))}
                </div>

                {canvasAiScore.improvement_suggestions?.length > 0 && (
                  <div className="canvas-score-suggestions">
                    <h4>AI improvement suggestions</h4>
                    <ul>
                      {canvasAiScore.improvement_suggestions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {canvasAiScoreError && <p className="error-message">{canvasAiScoreError}</p>}

            {error && <p className="error-message">{error}</p>}

            <div className="whys-actions">
              <button
                className="back-button"
                onClick={() => { setError(""); setStep(1); }}
              >
                ← Back
              </button>
              <button
                className="continue-button"
                onClick={handleContinueToReframe}
                disabled={
                  whysScore.score < PASS_THRESHOLD ||
                  whys.some((why) => !why.trim()) ||
                  !aiRootCause?.synthesized_root_cause ||
                  savingStep === "canvas_step_2"
                }
                title={
                  whysScore.score < PASS_THRESHOLD
                    ? "Answer the Whys with more depth to reach at least 40% before continuing."
                    : undefined
                }
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