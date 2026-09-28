import { useEffect, useState } from "react";
import "./IdeaEvaluation.css";
import {
  getSwotAnalysis,
  scoreIdeaFromSwot,
  getRiskAnalysis,
  mentorCoach,
  generateIdeas,
  rankIdeas,
} from "../../api/aiClient";
import { getWorkspace, saveEvaluationState, saveCanvasState, advanceStage } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { stepLabel } from "../../utils/progression";

function IdeaEvaluation({ challengeId, onStageAdvance, onReward }) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState(1);

  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [savingStep, setSavingStep] = useState(null);

  const [idea, setIdea] = useState({ title: "", description: "" });

  const [swot, setSwot] = useState({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
  });

  const [scores, setScores] = useState({
    feasibility: 0,
    impact: 0,
    innovation: 0,
    scalability: 0,
  });

  const [mentorMessage, setMentorMessage] = useState("");
  const [mentorReply, setMentorReply] = useState("");
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState("");

  const [isSwotAiLoading, setIsSwotAiLoading] = useState(false);
  const [swotAiError, setSwotAiError] = useState("");
  const [swotAiRecommendation, setSwotAiRecommendation] = useState("");

  const [isScoreAiLoading, setIsScoreAiLoading] = useState(false);
  const [scoreAiError, setScoreAiError] = useState("");
  const [scoreAiSummary, setScoreAiSummary] = useState("");
  const [scoreReasons, setScoreReasons] = useState({});
  // Snapshot of the idea + SWOT the current scores were produced from, so
  // continuing to Scoring only re-runs the AI when that input has changed.
  const [lastScoredInput, setLastScoredInput] = useState("");

  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");

  // Idea ranking: the other ideas from Ideate, AI-scored against the
  // current one so the student can switch to a higher-ranked idea.
  const [canvasState, setCanvasState] = useState({});
  const [candidateIdeas, setCandidateIdeas] = useState([]);
  const [rankedAlternatives, setRankedAlternatives] = useState(null);
  const [rankedFor, setRankedFor] = useState("");
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const scoringInputKey = (ideaValue, swotValue) => JSON.stringify({ idea: ideaValue, swot: swotValue });

  const isSwotComplete = Object.values(swot).every((value) => String(value ?? "").trim());
  const hasScores = Object.values(scores).every((value) => value > 0);

  // Load (or resume) this challenge's saved evaluation progress. Prefills
  // the idea title/description from the challenge itself the first time,
  // since the challenge already stood in as the problem statement upstream.
  useEffect(() => {
    if (!challengeId || !accessToken) return;
    setIsLoadingWorkspace(true);
    setWorkspaceError("");
    getWorkspace(accessToken, challengeId)
      .then((data) => {
        setIsLocked(data.status === "completed");
        const saved = data.evaluation_state || {};
        const loadedIdea = {
          title: saved.idea_title || data.canvas_state?.selected_idea?.title || data.challenge.title,
          description: saved.idea_description || data.canvas_state?.selected_idea?.description || "",
        };
        setIdea(loadedIdea);
        if (saved.swot) setSwot(saved.swot);
        if (saved.swot_recommendation) setSwotAiRecommendation(saved.swot_recommendation);
        // Only trust saved scores that came from the SWOT-based AI scorer
        // (those carry score_reasons); older hand-picked scores get re-scored.
        if (saved.scores && saved.score_reasons) {
          setScores(saved.scores);
          setScoreReasons(saved.score_reasons);
          if (saved.score_summary) setScoreAiSummary(saved.score_summary);
          if (saved.swot) setLastScoredInput(scoringInputKey(loadedIdea, saved.swot));
        }
        if (saved.risk_analysis) setRiskAnalysis(saved.risk_analysis);
        setCanvasState(data.canvas_state || {});
        if (Array.isArray(saved.candidate_ideas)) setCandidateIdeas(saved.candidate_ideas);
        if (Array.isArray(saved.ranked_alternatives)) {
          setRankedAlternatives(saved.ranked_alternatives);
          setRankedFor(saved.ranked_for || "");
        }
      })
      .catch((err) => setWorkspaceError(err.message))
      .finally(() => setIsLoadingWorkspace(false));
  }, [challengeId, accessToken]);

  const buildEvaluationState = (overrides = {}) => ({
    idea_title: idea.title,
    idea_description: idea.description,
    swot,
    scores,
    swot_recommendation: swotAiRecommendation,
    score_summary: scoreAiSummary,
    score_reasons: scoreReasons,
    risk_analysis: riskAnalysis,
    candidate_ideas: candidateIdeas,
    ranked_alternatives: rankedAlternatives,
    ranked_for: rankedFor,
    ...overrides,
  });

  const persistStep = async (stepKey, overrides) => {
    setSavingStep(stepKey);
    try {
      const result = await saveEvaluationState(accessToken, challengeId, buildEvaluationState(overrides), stepKey);
      onReward?.({ ...result, label: stepLabel(stepKey) });
      return true;
    } catch (err) {
      setWorkspaceError(err.message);
      return false;
    } finally {
      setSavingStep(null);
    }
  };

  const handleFinishEvaluation = async () => {
    const saved = await persistStep("eval_complete", {});
    if (!saved) return;
    try {
      const result = await advanceStage(accessToken, challengeId, "evaluation");
      onReward?.(result);
      onStageAdvance?.(result.current_stage);
    } catch (err) {
      setWorkspaceError(err.message);
    }
  };

  const handleIdeaChange = (field, value) => {
    setIdea((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoFillSwot = async () => {
    if (!idea.title.trim() || isSwotAiLoading) return;
    setIsSwotAiLoading(true);
    setSwotAiError("");
    try {
      const result = await getSwotAnalysis(idea.title, idea.description);
      const nextSwot = {
        strengths: result.strengths.join("\n"),
        weaknesses: result.weaknesses.join("\n"),
        opportunities: result.opportunities.join("\n"),
        threats: result.threats.join("\n"),
      };
      setSwot(nextSwot);
      setSwotAiRecommendation(result.strategic_recommendation);
      await persistStep("eval_swot", { swot: nextSwot, swot_recommendation: result.strategic_recommendation });
    } catch (err) {
      setSwotAiError(err.message);
    } finally {
      setIsSwotAiLoading(false);
    }
  };

  // Scores come only from the AI, based on the idea and the student's SWOT.
  const handleScoreWithAi = async () => {
    if (!idea.title.trim() || isScoreAiLoading) return;
    setIsScoreAiLoading(true);
    setScoreAiError("");
    try {
      const result = await scoreIdeaFromSwot(idea.title, idea.description, swot);
      const criteria = ["feasibility", "impact", "innovation", "scalability"];
      const nextScores = Object.fromEntries(criteria.map((key) => [key, result[key].score]));
      const nextReasons = Object.fromEntries(criteria.map((key) => [key, result[key].reason]));
      setScores(nextScores);
      setScoreReasons(nextReasons);
      setScoreAiSummary(result.summary);
      setLastScoredInput(scoringInputKey(idea, swot));
      await persistStep("eval_scoring", {
        scores: nextScores,
        score_reasons: nextReasons,
        score_summary: result.summary,
      });
    } catch (err) {
      setScoreAiError(err.message);
    } finally {
      setIsScoreAiLoading(false);
    }
  };

  const handleGetRiskAnalysis = async () => {
    if (!idea.title.trim() || isRiskLoading) return;
    setIsRiskLoading(true);
    setRiskError("");
    try {
      const result = await getRiskAnalysis(idea.title, idea.description);
      setRiskAnalysis(result);
    } catch (err) {
      setRiskError(err.message);
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleSwotChange = (field, value) => {
    setSwot((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleContinueToScoring = () => {
    if (!isSwotComplete) return;
    setStep(2);
    if (!hasScores || scoringInputKey(idea, swot) !== lastScoredInput) {
      handleScoreWithAi();
    }
  };

  const overallScore =
    (
      (scores.feasibility +
        scores.impact +
        scores.innovation +
        scores.scalability) /
      4
    ).toFixed(1);

  const overallOf = (s) => (s.feasibility + s.impact + s.innovation + s.scalability) / 4;

  // Scores the other Ideate ideas against the current (SWOT-scored) idea.
  // Falls back to fresh AI ideas for workspaces saved before Ideate kept
  // its idea list.
  const handleRankIdeas = async () => {
    if (isRankingLoading || !hasScores) return;
    setIsRankingLoading(true);
    setRankingError("");
    try {
      let candidates = candidateIdeas;
      if (candidates.length === 0) {
        const options = Array.isArray(canvasState.idea_options) ? canvasState.idea_options : [];
        if (options.length > 0) {
          candidates = options;
        } else {
          const context = canvasState.hmw || idea.description || idea.title;
          const generated = await generateIdeas(context, 4);
          candidates = (generated.ideas || []).map(({ title, description }) => ({ title, description }));
        }
      }
      const currentTitle = idea.title.trim().toLowerCase();
      candidates = candidates
        .filter((c) => c?.title && c.title.trim().toLowerCase() !== currentTitle)
        .slice(0, 6);

      let ranked = [];
      if (candidates.length > 0) {
        const result = await rankIdeas({
          context: canvasState.hmw || "",
          currentTitle: idea.title,
          currentDescription: idea.description,
          currentScores: scores,
          ideas: candidates.map((c, i) => ({ id: String(i), title: c.title, description: c.description || "" })),
        });
        const byId = new Map((result.ranked_ideas || []).map((r) => [r.id, r]));
        ranked = candidates
          .map((c, i) => {
            const r = byId.get(String(i));
            if (!r) return null;
            return {
              title: c.title,
              description: c.description || "",
              scores: {
                feasibility: r.feasibility,
                impact: r.impact,
                innovation: r.innovation,
                scalability: r.scalability,
              },
              reason: r.reason,
            };
          })
          .filter(Boolean);
      }

      setCandidateIdeas(candidates);
      setRankedAlternatives(ranked);
      setRankedFor(lastScoredInput);
      try {
        await saveEvaluationState(
          accessToken,
          challengeId,
          buildEvaluationState({ candidate_ideas: candidates, ranked_alternatives: ranked, ranked_for: lastScoredInput })
        );
      } catch {
        // Non-fatal — the ranking is shown either way and re-runs next visit.
      }
    } catch (err) {
      setRankingError(err.message);
    } finally {
      setIsRankingLoading(false);
    }
  };

  const handleOpenRanking = () => {
    setStep(5);
    if (rankedAlternatives === null || rankedFor !== lastScoredInput) {
      handleRankIdeas();
    }
  };

  // Swap in a higher-ranked idea and restart the evaluation from SWOT.
  // The idea being replaced joins the candidate list so it can be ranked
  // (and switched back to) later.
  const handleSwitchIdea = async (alternative) => {
    if (isSwitching) return;
    const confirmed = window.confirm(
      `Switch to "${alternative.title}"?\n\nYour current SWOT analysis and scores will be cleared, and you'll restart the evaluation from the SWOT step with this idea.`
    );
    if (!confirmed) return;

    setIsSwitching(true);
    setWorkspaceError("");
    const nextIdea = { title: alternative.title, description: alternative.description || "" };
    const nextCandidates = [
      ...candidateIdeas.filter((c) => c.title !== alternative.title),
      { title: idea.title, description: idea.description },
    ];
    const emptySwot = { strengths: "", weaknesses: "", opportunities: "", threats: "" };
    const emptyScores = { feasibility: 0, impact: 0, innovation: 0, scalability: 0 };

    try {
      await saveEvaluationState(accessToken, challengeId, {
        idea_title: nextIdea.title,
        idea_description: nextIdea.description,
        swot: emptySwot,
        scores: emptyScores,
        swot_recommendation: "",
        score_summary: "",
        score_reasons: null,
        risk_analysis: null,
        candidate_ideas: nextCandidates,
        ranked_alternatives: null,
        ranked_for: "",
      });
      // Keep the project summary's "Selected idea" in step with the switch.
      const nextCanvas = { ...canvasState, selected_idea: nextIdea };
      await saveCanvasState(accessToken, challengeId, nextCanvas);

      setCanvasState(nextCanvas);
      setIdea(nextIdea);
      setSwot(emptySwot);
      setScores(emptyScores);
      setScoreReasons({});
      setScoreAiSummary("");
      setScoreAiError("");
      setSwotAiRecommendation("");
      setSwotAiError("");
      setRiskAnalysis(null);
      setRiskError("");
      setCandidateIdeas(nextCandidates);
      setRankedAlternatives(null);
      setRankedFor("");
      setLastScoredInput("");
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setWorkspaceError(err.message);
    } finally {
      setIsSwitching(false);
    }
  };

  const currentOverall = overallOf(scores);
  const rankingRows = [
    { title: idea.title, description: idea.description, scores, isCurrent: true },
    ...(rankedAlternatives || []),
  ]
    .map((row) => ({ ...row, overall: overallOf(row.scores) }))
    // Ties keep the current idea on top — only a strictly better idea is a reason to switch.
    .sort((a, b) => b.overall - a.overall || (a.isCurrent ? -1 : b.isCurrent ? 1 : 0));
  const higherRankedCount = rankingRows.filter((row) => !row.isCurrent && row.overall > currentOverall).length;

  const mentorPrompts = [
    "Help me improve my idea",
    "What is my biggest weakness?",
    "How can I increase impact?",
    "Is my idea feasible?",
  ];

  const handleMentorPrompt = async (prompt) => {
    if (!accessToken || isMentorLoading) return;
    setMentorMessage(prompt);
    setMentorReply("");
    setMentorError("");
    setIsMentorLoading(true);
    try {
      const context = JSON.stringify({ idea, swot, scores });
      const result = await mentorCoach(accessToken, context, prompt, "evaluation", String(challengeId));
      setMentorReply(result.feedback);
    } catch (err) {
      setMentorError(err.message);
    } finally {
      setIsMentorLoading(false);
    }
  };

  if (isLoadingWorkspace) {
    return <div className="evaluation-page"><p className="canvas-loading">Loading your saved progress...</p></div>;
  }

  if (isLocked) {
    return (
      <div className="evaluation-page">
        <p className="canvas-loading">
          This challenge is already completed — open it from the Dashboard or Challenges tab to view your submitted approach.
        </p>
      </div>
    );
  }

  return (
    <div className="evaluation-page">
      {workspaceError && <p className="ai-error-text">{workspaceError}</p>}

      {/* =====================================================
          STEP 1 — SWOT ANALYSIS
          ===================================================== */}

      {step === 1 && (
        <>
          <div className="evaluation-header">
            <p className="section-label">IDEA EVALUATION</p>

            <h1>SWOT Analysis</h1>

            <p>
              Analyze your idea by identifying its strengths,
              weaknesses, opportunities, and threats.
            </p>
          </div>

          <div className="idea-identity">
            <label htmlFor="idea-title">Idea title</label>
            <input
              id="idea-title"
              type="text"
              value={idea.title}
              onChange={(event) => handleIdeaChange("title", event.target.value)}
              placeholder="e.g. Smart Demand Planning"
            />

            <label htmlFor="idea-description">Idea description</label>
            <textarea
              id="idea-description"
              value={idea.description}
              onChange={(event) => handleIdeaChange("description", event.target.value)}
              placeholder="Briefly describe what the idea does and who it's for..."
            />

            <button
              type="button"
              className="ai-autofill-button"
              onClick={handleAutoFillSwot}
              disabled={!idea.title.trim() || isSwotAiLoading}
            >
              {isSwotAiLoading ? "Analyzing with AI..." : "✦ Auto-fill SWOT with AI"}
            </button>

            {swotAiError && <p className="ai-error-text">{swotAiError}</p>}

            {swotAiRecommendation && (
              <p className="ai-recommendation-text">
                <strong>AI recommendation:</strong> {swotAiRecommendation}
              </p>
            )}
          </div>

          <div className="swot-grid">

            <div className="swot-card strengths-card">
              <div className="swot-card-header">
                <h2>Strengths</h2>
                <span>01</span>
              </div>

              <p>
                What advantages or capabilities does your idea have?
              </p>

              <textarea
                value={swot.strengths}
                onChange={(event) =>
                  handleSwotChange(
                    "strengths",
                    event.target.value
                  )
                }
                placeholder="Enter your idea's strengths..."
              />
            </div>

            <div className="swot-card weaknesses-card">
              <div className="swot-card-header">
                <h2>Weaknesses</h2>
                <span>02</span>
              </div>

              <p>
                What limitations or challenges could affect your idea?
              </p>

              <textarea
                value={swot.weaknesses}
                onChange={(event) =>
                  handleSwotChange(
                    "weaknesses",
                    event.target.value
                  )
                }
                placeholder="Enter your idea's weaknesses..."
              />
            </div>

            <div className="swot-card opportunities-card">
              <div className="swot-card-header">
                <h2>Opportunities</h2>
                <span>03</span>
              </div>

              <p>
                What external opportunities could help your idea grow?
              </p>

              <textarea
                value={swot.opportunities}
                onChange={(event) =>
                  handleSwotChange(
                    "opportunities",
                    event.target.value
                  )
                }
                placeholder="Enter potential opportunities..."
              />
            </div>

            <div className="swot-card threats-card">
              <div className="swot-card-header">
                <h2>Threats</h2>
                <span>04</span>
              </div>

              <p>
                What external risks could affect your idea?
              </p>

              <textarea
                value={swot.threats}
                onChange={(event) =>
                  handleSwotChange(
                    "threats",
                    event.target.value
                  )
                }
                placeholder="Enter potential threats..."
              />
            </div>

          </div>

          <div className="evaluation-actions">
            {!isSwotComplete && (
              <p className="score-description">
                Fill in all four SWOT sections to get your AI score.
              </p>
            )}
            <button
              className="continue-evaluation-button"
              onClick={handleContinueToScoring}
              disabled={!isSwotComplete || !idea.title.trim()}
            >
              Continue to AI Scoring →
            </button>
          </div>
        </>
      )}

      {/* =====================================================
          STEP 2 — SCORING
          ===================================================== */}

      {step === 2 && (
        <>
          <div className="evaluation-header">
            <p className="section-label">IDEA EVALUATION</p>

            <h1>AI Idea Score</h1>

            <p>
              Your idea is scored from 1 to 5 across four evaluation
              criteria by AI, based on your SWOT analysis.
            </p>
          </div>

          <div className="score-section">

            <h2>Evaluation Criteria</h2>

            <p className="score-description">
              Scores are assigned automatically. To change them, go back and
              improve your SWOT, then continue again to re-score.
            </p>

            {isScoreAiLoading && (
              <p className="ai-recommendation-text">✦ AI is scoring your idea from your SWOT...</p>
            )}

            {scoreAiError && (
              <>
                <p className="ai-error-text">{scoreAiError}</p>
                <button
                  type="button"
                  className="ai-autofill-button"
                  onClick={handleScoreWithAi}
                  disabled={isScoreAiLoading}
                >
                  ↻ Retry AI scoring
                </button>
              </>
            )}

            {scoreAiSummary && !isScoreAiLoading && (
              <p className="ai-recommendation-text">
                <strong>AI summary:</strong> {scoreAiSummary}
              </p>
            )}

            <button
              type="button"
              className="ai-autofill-button"
              onClick={handleGetRiskAnalysis}
              disabled={!idea.title.trim() || isRiskLoading}
            >
              {isRiskLoading ? "Analyzing risks..." : "✦ Get AI Risk Analysis"}
            </button>

            {riskError && <p className="ai-error-text">{riskError}</p>}

            {riskAnalysis && (
              <div className="ai-risk-box">
                {riskAnalysis.risks.map((risk, i) => (
                  <div key={i} className="ai-risk-item">
                    <strong>{risk.risk_type}</strong> ({risk.impact_level}): {risk.description}
                    <br />
                    <em>Mitigation: {risk.mitigation}</em>
                  </div>
                ))}
              </div>
            )}

            <div className="score-grid">
              {[
                ["feasibility", "Feasibility", "How realistic and practical is the idea to implement?"],
                ["impact", "Impact", "How much value or positive change could the idea create?"],
                ["innovation", "Innovation", "How original or innovative is the proposed solution?"],
                ["scalability", "Scalability", "How easily could the idea grow to support more users or use cases?"],
              ].map(([key, label, question]) => (
                <div className="score-card" key={key}>
                  <h3>{label}</h3>

                  <p>{question}</p>

                  <div className="score-options read-only" aria-label={`${label} score: ${scores[key] || "not scored"} out of 5`}>
                    {[1, 2, 3, 4, 5].map((number) => (
                      <span
                        key={number}
                        className={`score-option ${scores[key] === number ? "selected" : ""}`}
                      >
                        {number}
                      </span>
                    ))}
                  </div>

                  {scoreReasons[key] && !isScoreAiLoading && (
                    <p className="ai-score-reason">{scoreReasons[key]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="overall-score">
              <p className="overall-score-label">
                Overall Score
              </p>

              <div className="overall-score-value">
                {overallScore}
                <span> / 5</span>
              </div>
            </div>

          </div>

          <div className="evaluation-actions">

            <button
              className="back-evaluation-button"
              onClick={() => setStep(1)}
            >
              ← Back to SWOT
            </button>

            <button
              className="continue-evaluation-button"
              onClick={() => setStep(3)}
              disabled={!hasScores || isScoreAiLoading}
            >
              Complete Evaluation →
            </button>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 3 — RESULTS
          ===================================================== */}

      {step === 3 && (
        <>
          <div className="evaluation-header">
            <p className="section-label">
              EVALUATION COMPLETE
            </p>

            <h1>Evaluation Results</h1>

            <p>
              Here's a summary of your idea evaluation.
            </p>
          </div>

          <div className="results-container">

            <div className="result-main-score">
              <p>OVERALL SCORE</p>

              <strong>
                {overallScore}
                <span> / 5</span>
              </strong>
            </div>

            <div className="result-score-grid">

              <div className="result-score-card">
                <span>Feasibility</span>
                <strong>
                  {scores.feasibility} / 5
                </strong>
              </div>

              <div className="result-score-card">
                <span>Impact</span>
                <strong>
                  {scores.impact} / 5
                </strong>
              </div>

              <div className="result-score-card">
                <span>Innovation</span>
                <strong>
                  {scores.innovation} / 5
                </strong>
              </div>

              <div className="result-score-card">
                <span>Scalability</span>
                <strong>
                  {scores.scalability} / 5
                </strong>
              </div>

            </div>

            <div className="swot-summary">

              <h2>SWOT Summary</h2>

              <div className="swot-summary-grid">

                <div>
                  <h3>Strengths</h3>
                  <p>
                    {swot.strengths ||
                      "No strengths entered."}
                  </p>
                </div>

                <div>
                  <h3>Weaknesses</h3>
                  <p>
                    {swot.weaknesses ||
                      "No weaknesses entered."}
                  </p>
                </div>

                <div>
                  <h3>Opportunities</h3>
                  <p>
                    {swot.opportunities ||
                      "No opportunities entered."}
                  </p>
                </div>

                <div>
                  <h3>Threats</h3>
                  <p>
                    {swot.threats ||
                      "No threats entered."}
                  </p>
                </div>

              </div>

            </div>

          </div>

          <div className="evaluation-actions">

            <button
              className="back-evaluation-button"
              onClick={() => setStep(2)}
            >
              ← Back to Scoring
            </button>

            <button
              className="continue-evaluation-button"
              onClick={() => setStep(4)}
            >
              View Feasibility vs Impact →
            </button>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 4 — FEASIBILITY VS IMPACT
          ===================================================== */}

      {step === 4 && (
        <>
          <div className="impact-section">

            <div className="impact-heading">

              <p className="section-label">
                FEASIBILITY VS IMPACT
              </p>

              <h2>Idea Position</h2>

              <p>
                See where your idea falls based on its
                feasibility and potential impact scores.
              </p>

            </div>

            <div className="impact-chart">

              <div className="chart-y-label">
                IMPACT
              </div>

              <div className="chart-area">

                <div className="quadrant quadrant-top-left">
                  High Impact
                  <br />
                  Low Feasibility
                </div>

                <div className="quadrant quadrant-top-right">
                  High Impact
                  <br />
                  High Feasibility
                </div>

                <div className="quadrant quadrant-bottom-left">
                  Low Impact
                  <br />
                  Low Feasibility
                </div>

                <div className="quadrant quadrant-bottom-right">
                  Low Impact
                  <br />
                  High Feasibility
                </div>

                <div
                  className="idea-point"
                  style={{
                    left: `${
                      ((scores.feasibility - 1) / 4) * 90 + 5
                    }%`,
                    bottom: `${
                      ((scores.impact - 1) / 4) * 90 + 5
                    }%`,
                  }}
                >
                  <span className="idea-dot"></span>

                  <div className="idea-point-label">
                    {idea.title || "Your idea"}
                  </div>
                </div>

                <div className="x-axis-ticks">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>

                <div className="y-axis-ticks">
                  <span>5</span>
                  <span>4</span>
                  <span>3</span>
                  <span>2</span>
                  <span>1</span>
                </div>

              </div>

              <div className="chart-x-label">
                FEASIBILITY →
              </div>

            </div>

            <div className="chart-score-summary">

              <div>
                <span>Feasibility</span>

                <strong>
                  {scores.feasibility} / 5
                </strong>
              </div>

              <div>
                <span>Impact</span>

                <strong>
                  {scores.impact} / 5
                </strong>
              </div>

            </div>

          </div>

          <div className="evaluation-actions">

            <button
              className="back-evaluation-button"
              onClick={() => setStep(3)}
            >
              ← Back to Results
            </button>

            <button
              className="continue-evaluation-button"
              onClick={handleOpenRanking}
            >
              View Idea Rankings →
            </button>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 5 — AUTOMATED IDEA RANKING
          ===================================================== */}

      {step === 5 && (
        <>
          <div className="ranking-section">

            <div className="ranking-heading">

              <p className="section-label">
                IDEA RANKING
              </p>

              <h2>
                Automated Idea Ranking
              </h2>

              <p>
                Your idea (scored from your SWOT) compared with the other
                ideas from Ideate, scored by AI on the same four criteria.
                If another idea ranks higher, you can switch to it and
                restart the evaluation from SWOT analysis.
              </p>

            </div>

            {isRankingLoading && (
              <p className="ai-recommendation-text">✦ AI is ranking your idea against the alternatives...</p>
            )}

            {rankingError && (
              <>
                <p className="ai-error-text">{rankingError}</p>
                <button
                  type="button"
                  className="ai-autofill-button"
                  onClick={handleRankIdeas}
                  disabled={isRankingLoading}
                >
                  ↻ Retry ranking
                </button>
              </>
            )}

            {!isRankingLoading && rankedAlternatives && (
              <p className={`ranking-verdict ${higherRankedCount > 0 ? "ranking-verdict-switch" : "ranking-verdict-top"}`}>
                {higherRankedCount > 0
                  ? `${higherRankedCount} idea${higherRankedCount === 1 ? "" : "s"} scored higher than yours. You can switch below — your evaluation will restart from SWOT analysis with the new idea.`
                  : "Your idea ranks highest. Continue to submission when you're ready."}
              </p>
            )}

            <div className="ranking-table-container">

              <table className="ranking-table">

                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Idea</th>
                    <th>Feasibility</th>
                    <th>Impact</th>
                    <th>Innovation</th>
                    <th>Scalability</th>
                    <th>Overall Score</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {rankingRows.map((row, index) => (
                    <tr key={`${row.title}-${index}`} className={row.isCurrent ? "ranking-row-current" : ""}>
                      <td>
                        <span className="rank-number">{index + 1}</span>
                      </td>

                      <td className="idea-name">
                        {row.title || "Your idea"}
                        {row.isCurrent && <span className="ranking-current-tag">Your idea</span>}
                        {!row.isCurrent && row.reason && (
                          <span className="ranking-reason">{row.reason}</span>
                        )}
                      </td>

                      <td>{row.scores.feasibility} / 5</td>
                      <td>{row.scores.impact} / 5</td>
                      <td>{row.scores.innovation} / 5</td>
                      <td>{row.scores.scalability} / 5</td>

                      <td>
                        <span className="overall-ranking-score">
                          {row.overall.toFixed(1)} / 5
                        </span>
                      </td>

                      <td>
                        {!row.isCurrent && row.overall > currentOverall && (
                          <button
                            type="button"
                            className="ranking-switch-button"
                            onClick={() => handleSwitchIdea(row)}
                            disabled={isSwitching}
                          >
                            {isSwitching ? "Switching..." : "Switch to this idea"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          </div>

          <div className="evaluation-actions">

            <button
              className="back-evaluation-button"
              onClick={() => setStep(4)}
            >
              ← Back to Chart
            </button>

            <div className="evaluation-actions-right">
              <button
                className="back-evaluation-button"
                onClick={() => setStep(6)}
              >
                Ask AI Mentor
              </button>

              <button
                className="continue-evaluation-button"
                onClick={handleFinishEvaluation}
                disabled={savingStep === "eval_complete"}
              >
                {savingStep === "eval_complete" ? "Saving..." : "Continue to Submit Project →"}
              </button>
            </div>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 6 — AI MENTOR CHAT DRAWER
          WEEK 3 DAY 4 + DAY 5
          ===================================================== */}

      {step === 6 && (
        <>
          <div className="mentor-page">

            <div className="mentor-header">

              <div>
                <p className="section-label">
                  AI MENTOR
                </p>

                <h1>
                  Your Innovation Mentor
                </h1>

                <p>
                  Ask questions and get guidance while developing
                  your idea.
                </p>
              </div>

              <div className="mentor-status">
                <span className="mentor-status-dot"></span>
                Mentor Ready
              </div>

            </div>

            <div className="mentor-drawer">

              <div className="mentor-drawer-header">

                <div className="mentor-avatar">
                  AI
                </div>

                <div>
                  <h2>AI Mentor</h2>

                  <p>
                    Contextual guidance for your idea
                  </p>
                </div>

              </div>

              <div className="mentor-context">

                <p className="mentor-context-label">
                  CURRENT IDEA
                </p>

                <strong>
                  {idea.title || "Your idea"}
                </strong>

                <div className="mentor-context-scores">

                  <span>
                    Feasibility:{" "}
                    <strong>
                      {scores.feasibility}/5
                    </strong>
                  </span>

                  <span>
                    Impact:{" "}
                    <strong>
                      {scores.impact}/5
                    </strong>
                  </span>

                  <span>
                    Overall:{" "}
                    <strong>
                      {overallScore}/5
                    </strong>
                  </span>

                </div>

              </div>

              <div className="mentor-chat">

                <div className="mentor-message mentor-message-ai">

                  <div className="mentor-message-avatar">
                    AI
                  </div>

                  <div className="mentor-message-content">

                    <span className="mentor-message-name">
                      AI Mentor
                    </span>

                    <p>
                      Hi! I'm here to help you think through
                      your idea. What would you like to explore?
                    </p>

                  </div>

                </div>

                {mentorMessage && (
                  <div className="mentor-message mentor-message-user">

                    <div className="mentor-message-content">

                      <span className="mentor-message-name">
                        You
                      </span>

                      <p>
                        {mentorMessage}
                      </p>

                    </div>

                  </div>
                )}

                {isMentorLoading && (
                  <p className="ai-error-text" style={{ color: "#64748b" }}>Mentor is thinking...</p>
                )}

                {mentorError && <p className="ai-error-text">{mentorError}</p>}

                {mentorReply && (
                  <div className="mentor-message mentor-message-ai">

                    <div className="mentor-message-avatar">
                      AI
                    </div>

                    <div className="mentor-message-content">

                      <span className="mentor-message-name">
                        AI Mentor
                      </span>

                      <p>
                        {mentorReply}
                      </p>

                    </div>

                  </div>
                )}

              </div>

              <div className="mentor-prompts">

                <p>
                  TRY ASKING
                </p>

                <div className="mentor-prompt-list">

                  {mentorPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="mentor-prompt-pill"
                      onClick={() =>
                        handleMentorPrompt(prompt)
                      }
                    >
                      {prompt}
                    </button>
                  ))}

                </div>

              </div>

              <div className="mentor-input-area">

                <input
                  type="text"
                  placeholder="Ask your mentor something..."
                  disabled
                />

                <button
                  className="mentor-send-button"
                  disabled
                >
                  Send
                </button>

              </div>

              <p className="mentor-week3-note">
                Prompt pills above call the real Socratic AI mentor. For
                free-form questions with saved history, use the AI Mentor
                drawer in Level 2 (Ideate).
              </p>

            </div>

          </div>

          <div className="evaluation-actions">

            <button
              className="back-evaluation-button"
              onClick={() => setStep(5)}
            >
              ← Back to Rankings
            </button>

            <button
              className="continue-evaluation-button"
              onClick={handleFinishEvaluation}
              disabled={savingStep === "eval_complete"}
            >
              {savingStep === "eval_complete" ? "Saving..." : "Finish Evaluation → Continue to Submission"}
            </button>

          </div>
        </>
      )}

    </div>
  );
}

export default IdeaEvaluation;
