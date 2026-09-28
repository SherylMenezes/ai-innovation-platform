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

  // Five Why answers
  const [whys, setWhys] = useState(["", "", "", "", ""]);

  // AI-generated Why questions. The AI creates these one step at a time
  // from the student's previous answers.
  const [whyQuestions, setWhyQuestions] = useState(["", "", "", "", ""]);

  // AI thinking prompts shown beside each answer.
  const [whyPrompts, setWhyPrompts] = useState([[], [], [], [], []]);

  // Short AI feedback on the student's current answer.
  const [whyFeedback, setWhyFeedback] = useState(["", "", "", "", ""]);

  // Possible answer generated only when the student explicitly asks for help.
  const [aiGeneratedAnswers, setAiGeneratedAnswers] = useState(["", "", "", "", ""]);

  const [activeAiStep, setActiveAiStep] = useState(null);
  const [isWhyAiLoading, setIsWhyAiLoading] = useState(false);

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
        if (saved.why_questions) setWhyQuestions(saved.why_questions);
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

  // 5 Whys guidance is generated by AI one step at a time.
  const handleWhyChange = (index, value) => {
    const updatedWhys = [...whys];
    updatedWhys[index] = value;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));
    setError("");

    // Once the student starts editing an AI-generated answer, the old
    // generated answer should no longer be shown as if it were current.
    setAiGeneratedAnswers((previous) => {
      const updated = [...previous];
      updated[index] = "";
      return updated;
    });
  };

  const requestWhyGuidance = async ({
    stepIndex,
    answer = "",
    helpMeAnswer = false,
  }) => {
    if (!problem.trim() || isWhyAiLoading) return null;

    setIsWhyAiLoading(true);
    setActiveAiStep(stepIndex);
    setAiRootCauseError("");
    setCanvasAiScoreError("");

    try {
      const previousAnswers = whys
        .slice(0, stepIndex)
        .map((value) => value.trim());

      const result = await refineProblem(
        problem,
        previousAnswers,
        stepIndex,
        answer,
        helpMeAnswer
      );

      // The current step's question is already stored at this index.
      // If the backend returns a next question, it belongs to the current
      // requested step index.
      if (result.next_question) {
        setWhyQuestions((previous) => {
          const updated = [...previous];
          updated[stepIndex] = result.next_question;
          return updated;
        });
      }

      setWhyPrompts((previous) => {
        const updated = [...previous];
        updated[stepIndex] = result.thinking_prompts || [];
        return updated;
      });

      setWhyFeedback((previous) => {
        const updated = [...previous];
        updated[stepIndex] = result.answer_feedback || "";
        return updated;
      });

      if (result.generated_answer) {
        setAiGeneratedAnswers((previous) => {
          const updated = [...previous];
          updated[stepIndex] = result.generated_answer;
          return updated;
        });
      }

      // Keep the existing AI insight-card feature. The backend fills these
      // once the fifth Why has been analysed.
      setAiRootCause(result);

      if (result.synthesized_root_cause) {
        setRootCause(result.synthesized_root_cause);
      }

      return result;
    } catch (err) {
      setAiRootCauseError(err.message);
      return null;
    } finally {
      setIsWhyAiLoading(false);
      setActiveAiStep(null);
    }
  };

  const generateInitialWhy = async () => {
    if (whyQuestions[0]?.trim()) return;

    await requestWhyGuidance({
      stepIndex: 0,
      answer: "",
      helpMeAnswer: false,
    });
  };

  // Automatically create Why 1 when the student enters the 5-Whys screen.
  // If an older saved canvas already contains answers, generate the first
  // missing question instead of restarting the chain.
  useEffect(() => {
    if (step !== 2 || !problem.trim() || isLoadingWorkspace || isWhyAiLoading) {
      return;
    }

    const firstMissingQuestion = whys.findIndex((_, index) => !whyQuestions[index]?.trim());

    if (firstMissingQuestion === -1) return;

    const hasEarlierBlank = whys
      .slice(0, firstMissingQuestion)
      .some((answer) => !answer.trim());

    if (hasEarlierBlank) return;

    requestWhyGuidance({
      stepIndex: firstMissingQuestion,
      answer: "",
      helpMeAnswer: false,
    });
  }, [step, problem, isLoadingWorkspace]);

  const handleNextWhy = async (index) => {
    const answer = whys[index]?.trim();

    if (!answer) {
      setError(`Please answer Why ${index + 1} before continuing.`);
      return;
    }

    setError("");

    if (index < 4) {
      await requestWhyGuidance({
        stepIndex: index + 1,
        answer: "",
        helpMeAnswer: false,
      });
      return;
    }

    // Why 5 is complete: ask the AI to analyse the entire chain and then
    // score the complete Problem Canvas.
    const result = await requestWhyGuidance({
      stepIndex: 4,
      answer,
      helpMeAnswer: false,
    });

    if (!result?.synthesized_root_cause) return;

    const completeAnswers = whys
      .map((value) => value.trim())
      .filter(Boolean);

    if (completeAnswers.length !== 5) return;

    try {
      const scoreResult = await scoreProblemCanvas({
        problemStatement: problem,
        whyAnswers: completeAnswers,
        rootCause: result.synthesized_root_cause,
        refinedProblemStatement: result.refined_problem_statement || "",
      });

      setCanvasAiScore(scoreResult);
    } catch (err) {
      setCanvasAiScoreError(err.message);
    }
  };

  const handleHelpMeAnswer = async (index) => {
    const currentAnswer = whys[index]?.trim() || "";

    await requestWhyGuidance({
      stepIndex: index,
      answer: currentAnswer,
      helpMeAnswer: true,
    });
  };

  const useGeneratedAnswer = (index) => {
    const generated = aiGeneratedAnswers[index];
    if (!generated) return;

    const updatedWhys = [...whys];
    updatedWhys[index] = generated;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));

    setAiGeneratedAnswers((previous) => {
      const updated = [...previous];
      updated[index] = "";
      return updated;
    });

    setError("");
  };

  const useThinkingPrompt = (index, prompt) => {
    const currentAnswer = whys[index]?.trim() || "";
    const updatedAnswer = currentAnswer
      ? `${currentAnswer} ${prompt}`
      : prompt;

    const updatedWhys = [...whys];
    updatedWhys[index] = updatedAnswer;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));
    setError("");
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
                  AI generates each Why from your previous answer. If you are
                  unsure, AI can give you thinking prompts or generate a
                  possible answer that you can edit.
                </p>
              </div>
            </div>

            <div className="original-problem">
              <span>ORIGINAL PROBLEM</span>
              <p>{problem}</p>
            </div>

            <div className="whys-list">
              {whys.map((why, index) => {
                const question = whyQuestions[index];
                const prompts = whyPrompts[index] || [];
                const generatedAnswer = aiGeneratedAnswers[index];
                const feedback = whyFeedback[index];
                const isLoading = isWhyAiLoading && activeAiStep === index;
                const canWorkOnStep = index === 0 || Boolean(whys[index - 1]?.trim());

                return (
                  <div
                    className={`why-item ${!canWorkOnStep ? "why-item-locked" : ""}`}
                    key={index}
                  >
                    <div className="why-heading">
                      <span className="why-number">WHY {index + 1}</span>
                      <div>
                        <label htmlFor={`why-${index}`}>
                          {question || (
                            isLoading
                              ? "AI is generating this Why..."
                              : "AI will generate this Why after the previous answer."
                          )}
                        </label>
                        <p className="why-hint">
                          {index === 0
                            ? "Start with the most immediate cause you believe explains the problem."
                            : "Use the previous answer to investigate the cause one level deeper."}
                        </p>
                      </div>
                    </div>

                    {canWorkOnStep && question && (
                      <div className="why-answer-layout">
                        <div className="why-answer-panel">
                          <label htmlFor={`why-${index}`}>Your answer</label>

                          <textarea
                            id={`why-${index}`}
                            value={why}
                            onChange={(e) => handleWhyChange(index, e.target.value)}
                            placeholder="Write what you think is causing this..."
                            rows={5}
                          />

                          {feedback && (
                            <div className="why-ai-feedback">
                              <strong>✦ AI feedback</strong>
                              <p>{feedback}</p>
                            </div>
                          )}

                          {generatedAnswer && (
                            <div className="ai-generated-answer">
                              <div className="ai-generated-answer-header">
                                <strong>✨ AI-generated possible answer</strong>
                                <span>Review it and edit it before using it.</span>
                              </div>
                              <p>{generatedAnswer}</p>
                              <div className="ai-generated-answer-actions">
                                <button
                                  type="button"
                                  className="use-ai-suggestion-button"
                                  onClick={() => useGeneratedAnswer(index)}
                                >
                                  Use this answer
                                </button>
                                <button
                                  type="button"
                                  className="use-ai-suggestion-button secondary"
                                  onClick={() => {
                                    setAiGeneratedAnswers((previous) => {
                                      const updated = [...previous];
                                      updated[index] = "";
                                      return updated;
                                    });
                                  }}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            className="ai-help-button"
                            onClick={() => handleHelpMeAnswer(index)}
                            disabled={isLoading}
                          >
                            {isLoading ? "AI is thinking..." : "✨ Help me answer"}
                          </button>
                        </div>

                        <div className="why-prompts-panel">
                          <div className="why-prompts-title">
                            <span>AI SUPPORT</span>
                            <h4>Thinking prompts</h4>
                          </div>
                          <p>
                            These are possible directions to help you think.
                            They are not confirmed facts.
                          </p>

                          <div className="why-prompt-list">
                            {prompts.length > 0 ? (
                              prompts.map((prompt, promptIndex) => (
                                <button
                                  type="button"
                                  className="why-prompt-card"
                                  key={promptIndex}
                                  onClick={() => useThinkingPrompt(index, prompt)}
                                >
                                  <span>💡</span>
                                  <span>{prompt}</span>
                                </button>
                              ))
                            ) : (
                              <div className="why-prompt-empty">
                                AI thinking prompts will appear here.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {canWorkOnStep && question && (
                      <div className="why-step-actions">
                        <button
                          type="button"
                          className="ai-feedback-button"
                          disabled={!why.trim() || isLoading}
                          onClick={() => handleNextWhy(index)}
                        >
                          {isLoading
                            ? "Analysing..."
                            : index < 4
                              ? `Analyse & generate Why ${index + 2} →`
                              : "Analyse all 5 Whys & find root cause →"}
                        </button>
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

                <ol className="why-chain">
                  <li className="why-chain-node why-chain-start">
                    <span>Problem</span>
                    {problem}
                  </li>
                  {whys.map((answer, i) => (
                    <li className="why-chain-node" key={i}>
                      <span>Why {i + 1} — Answer</span>
                      {answer}
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