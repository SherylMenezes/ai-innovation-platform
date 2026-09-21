import { useState } from "react";
import "./IdeaEvaluation.css";

function IdeaEvaluation() {
  const [step, setStep] = useState(1);

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

  const handleSwotChange = (field, value) => {
    setSwot((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleScoreChange = (field, value) => {
    setScores((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const overallScore =
    (
      (scores.feasibility +
        scores.impact +
        scores.innovation +
        scores.scalability) /
      4
    ).toFixed(1);

  const mentorPrompts = [
    "Help me improve my idea",
    "What is my biggest weakness?",
    "How can I increase impact?",
    "Is my idea feasible?",
  ];

  const handleMentorPrompt = (prompt) => {
    setMentorMessage(prompt);
  };

  return (
    <div className="evaluation-page">

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
            <button
              className="continue-evaluation-button"
              onClick={() => setStep(2)}
            >
              Continue to Scoring →
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

            <h1>Score Your Idea</h1>

            <p>
              Rate your idea from 1 to 5 across four evaluation
              criteria.
            </p>
          </div>

          <div className="score-section">

            <h2>Evaluation Criteria</h2>

            <p className="score-description">
              Select a score from 1 to 5 for each criterion.
            </p>

            <div className="score-grid">

              <div className="score-card">
                <h3>Feasibility</h3>

                <p>
                  How realistic and practical is the idea to implement?
                </p>

                <div className="score-options">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      key={number}
                      className={`score-option ${
                        scores.feasibility === number
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleScoreChange(
                          "feasibility",
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="score-card">
                <h3>Impact</h3>

                <p>
                  How much value or positive change could the idea create?
                </p>

                <div className="score-options">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      key={number}
                      className={`score-option ${
                        scores.impact === number
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleScoreChange(
                          "impact",
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="score-card">
                <h3>Innovation</h3>

                <p>
                  How original or innovative is the proposed solution?
                </p>

                <div className="score-options">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      key={number}
                      className={`score-option ${
                        scores.innovation === number
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleScoreChange(
                          "innovation",
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="score-card">
                <h3>Scalability</h3>

                <p>
                  How easily could the idea grow to support more users
                  or use cases?
                </p>

                <div className="score-options">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      key={number}
                      className={`score-option ${
                        scores.scalability === number
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleScoreChange(
                          "scalability",
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

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
                    Smart Demand Planning
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
              onClick={() => setStep(5)}
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
                Compare ideas based on their feasibility,
                impact, innovation, and scalability scores.
              </p>

            </div>

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
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>
                      <span className="rank-number">
                        1
                      </span>
                    </td>

                    <td className="idea-name">
                      Smart Demand Planning
                    </td>

                    <td>{scores.feasibility} / 5</td>
                    <td>{scores.impact} / 5</td>
                    <td>{scores.innovation} / 5</td>
                    <td>{scores.scalability} / 5</td>

                    <td>
                      <span className="overall-ranking-score">
                        {overallScore} / 5
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span className="rank-number">
                        2
                      </span>
                    </td>

                    <td className="idea-name">
                      AI Customer Support
                    </td>

                    <td>4 / 5</td>
                    <td>4 / 5</td>
                    <td>4 / 5</td>
                    <td>4 / 5</td>

                    <td>
                      <span className="overall-ranking-score">
                        4.0 / 5
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span className="rank-number">
                        3
                      </span>
                    </td>

                    <td className="idea-name">
                      Automated Inventory Alerts
                    </td>

                    <td>5 / 5</td>
                    <td>3 / 5</td>
                    <td>3 / 5</td>
                    <td>4 / 5</td>

                    <td>
                      <span className="overall-ranking-score">
                        3.8 / 5
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <span className="rank-number">
                        4
                      </span>
                    </td>

                    <td className="idea-name">
                      Predictive Maintenance Assistant
                    </td>

                    <td>3 / 5</td>
                    <td>4 / 5</td>
                    <td>5 / 5</td>
                    <td>3 / 5</td>

                    <td>
                      <span className="overall-ranking-score">
                        3.8 / 5
                      </span>
                    </td>
                  </tr>

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

            <button
              className="continue-evaluation-button"
              onClick={() => setStep(6)}
            >
              Open AI Mentor →
            </button>

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
                  Smart Demand Planning
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
                Mentor responses will be connected to the AI
                engine in Week 4.
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

          </div>
        </>
      )}

    </div>
  );
}

export default IdeaEvaluation;