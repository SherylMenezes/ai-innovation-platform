import { useState } from "react";
import "./ProblemCanvas.css";
import {
  scoreProblemStatement,
  scoreWhyAnswers,
  scoreHMW
} from "../../utils/scoreProblem";

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

function ProblemCanvas() {
  // Problem entered by the student
  const [problem, setProblem] = useState("");

  // Five Why answers
  const [whys, setWhys] = useState(["", "", "", "", ""]);

  // 1 = Define Problem
  // 2 = 5 Whys
  // 3 = Reframe
  // 4 = Ideation Board
  const [step, setStep] = useState(1);

  // Validation
  const [error, setError] = useState("");

  // Root cause
  const [rootCause, setRootCause] = useState("");

  // How Might We statement
  const [hmw, setHmw] = useState("");

  // Live heuristic scores for the scored fields
  const [problemScore, setProblemScore] = useState({ score: 0, tips: [] });
  const [whysScore, setWhysScore] = useState({ score: 0, tips: [] });
  const [hmwScore, setHmwScore] = useState({ score: 0, tips: [] });

  // Current ideation method
  const [ideationMethod, setIdeationMethod] = useState("SCAMPER");

  // SCAMPER answers
  const [scamperAnswers, setScamperAnswers] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ]);

  // Mind Map answers
  const [mindMapIdeas, setMindMapIdeas] = useState([
    "",
    "",
    "",
    ""
  ]);

  // Selected AI idea
  const [selectedIdea, setSelectedIdea] = useState(null);

  // Additional mock ideas
  const [extraIdeas, setExtraIdeas] = useState([]);

  // 5 Whys guidance
  const whyQuestions = [
    {
      title: "Why is this problem happening?",
      hint: "Think about the most immediate reason behind the problem.",
      placeholder: "Describe the immediate cause..."
    },
    {
      title: "Why does that happen?",
      hint: "Look at your previous answer and ask what causes it.",
      placeholder: "What causes the reason you identified above?"
    },
    {
      title: "What causes that underlying issue?",
      hint: "Go one level deeper instead of repeating the previous answer.",
      placeholder: "Describe the deeper cause..."
    },
    {
      title: "Why does this deeper issue continue?",
      hint: "Think about systems, resources, processes, or decisions.",
      placeholder: "What allows this issue to continue?"
    },
    {
      title: "What is the fundamental reason?",
      hint: "Identify the deepest cause that could realistically be addressed.",
      placeholder: "Describe the root cause..."
    }
  ];

  // Temporary frontend AI idea suggestions
  // Later these will come from the backend
  const ideaSuggestions = [
    {
      title: "Smart Demand Planning",
      description:
        "Estimate expected demand before food is prepared so businesses can reduce unnecessary production."
    },
    {
      title: "Pre-order System",
      description:
        "Allow customers to place orders in advance so businesses know how much food is actually required."
    },
    {
      title: "Surplus Food Network",
      description:
        "Connect businesses with surplus food to nearby NGOs, shelters, or communities that can use it."
    }
  ];

  // SCAMPER guidance
  const scamperPrompts = [
    {
      letter: "S",
      title: "Substitute",
      question: "What could be replaced or substituted?",
      placeholder:
        "Think about replacing a process, material, user action, or feature..."
    },
    {
      letter: "C",
      title: "Combine",
      question: "What could be combined?",
      placeholder:
        "Could two ideas, services, features, or processes work together?"
    },
    {
      letter: "A",
      title: "Adapt",
      question: "What could be adapted from something that already exists?",
      placeholder:
        "Think about an existing approach that could be adapted..."
    },
    {
      letter: "M",
      title: "Modify",
      question: "What could be changed, improved, enlarged, or simplified?",
      placeholder:
        "How could the idea or process be modified?"
    },
    {
      letter: "P",
      title: "Put to Another Use",
      question: "Could something be used in a different way?",
      placeholder:
        "Could an existing resource, technology, or process serve another purpose?"
    },
    {
      letter: "E",
      title: "Eliminate",
      question: "What could be removed or simplified?",
      placeholder:
        "What unnecessary step, feature, or difficulty could be removed?"
    },
    {
      letter: "R",
      title: "Rearrange",
      question: "What could be reordered or done differently?",
      placeholder:
        "Could the sequence, responsibility, or process be rearranged?"
    }
  ];

  // Update one Why answer
  const handleWhyChange = (index, value) => {
    const updatedWhys = [...whys];
    updatedWhys[index] = value;
    setWhys(updatedWhys);
    setWhysScore(scoreWhyAnswers(updatedWhys));
  };

  // Step 1 → Step 2
  const handleAnalyze = () => {
    if (problem.trim() === "") {
      setError("Please enter a problem before continuing.");
      return;
    }

    setError("");
    setStep(2);
  };

  // Step 2 → Step 3
  const handleContinueToReframe = () => {
    const hasEmptyWhy = whys.some(
      (why) => why.trim() === ""
    );

    if (hasEmptyWhy) {
      setError(
        "Please answer all five Why questions before continuing."
      );
      return;
    }

    setError("");

    // Use Why 5 as the initial root cause
    setRootCause(whys[4]);

    setStep(3);
  };

  // Step 3 → Step 4
  const handleGenerateIdeas = () => {
    if (rootCause.trim() === "") {
      setError(
        "Please review or enter the root cause before continuing."
      );
      return;
    }

    if (hmw.trim() === "") {
      setError(
        "Please write a How Might We statement before continuing."
      );
      return;
    }

    setError("");
    setStep(4);
  };

  // Update SCAMPER answer
  const handleScamperChange = (index, value) => {
    const updatedAnswers = [...scamperAnswers];
    updatedAnswers[index] = value;
    setScamperAnswers(updatedAnswers);
  };

  // Update Mind Map answer
  const handleMindMapChange = (index, value) => {
    const updatedIdeas = [...mindMapIdeas];
    updatedIdeas[index] = value;
    setMindMapIdeas(updatedIdeas);
  };

  // Temporary frontend "Generate More Ideas"
  const handleGenerateMoreIdeas = () => {
    const mockIdeas = [
      {
        title: "Community Meal Reservation",
        description:
          "Let customers reserve meals earlier so food businesses can prepare closer to actual demand."
      },
      {
        title: "Dynamic Discount System",
        description:
          "Offer timely discounts on surplus food so businesses can reduce waste before products expire."
      },
      {
        title: "Daily Demand Dashboard",
        description:
          "Give food businesses a simple dashboard showing expected demand, previous sales, and preparation recommendations."
      }
    ];

    const nextIdea = mockIdeas[extraIdeas.length % mockIdeas.length];

    setExtraIdeas([
      ...extraIdeas,
      nextIdea
    ]);
  };

  return (
    <div className="workspace">

      {/* WORKSPACE HEADER */}

      <header className="workspace-header">
        <p className="workspace-label">
          PROJECT WORKSPACE
        </p>
      </header>


      {/* NAVIGATION */}

      <nav className="workspace-tabs">

        <button
          className={step <= 3 ? "active-tab" : ""}
          onClick={() => setStep(1)}
        >
          Canvas
        </button>

        <button
          className={step === 4 ? "active-tab" : ""}
          onClick={() => setStep(4)}
        >
          Ideate
        </button>

        <button className="tab-disabled" disabled title="Coming soon">
          Evaluate
        </button>

        <button className="tab-disabled" disabled title="Coming soon">
          Tech
        </button>

        <button className="tab-disabled" disabled title="Coming soon">
          Plan
        </button>

      </nav>


      <main className="canvas-content">

        {/* CANVAS INTRO */}

        {step <= 3 && (
          <section className="canvas-intro">

            <p className="section-label">
              PROBLEM FRAMING CANVAS
            </p>

            <h2>
              Understand the problem before jumping to a solution
            </h2>

            <p>
              Break down the challenge, identify the root cause,
              and reframe it into an opportunity.
            </p>

          </section>
        )}


        {/* IDEATION INTRO */}

        {step === 4 && (
          <section className="canvas-intro">

            <p className="section-label">
              CREATIVE IDEATION BOARD
            </p>

            <h2>
              Turn your challenge into possible solutions
            </h2>

            <p>
              Explore different approaches, generate ideas,
              and build on the directions that seem most promising.
            </p>

          </section>
        )}


        {/* =====================================
            SCREEN 1 — DEFINE PROBLEM
           ===================================== */}

        {step === 1 && (
          <section className="problem-card">

            <div className="step-heading">

              <span className="step-number">
                01
              </span>

              <div>
                <h3>
                  Define the Problem
                </h3>

                <p>
                  Start with the challenge you want to understand.
                  Don't worry about the solution yet.
                </p>
              </div>

            </div>


            <label htmlFor="problem">
              What problem are you trying to solve?
            </label>


            <textarea
              id="problem"
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                setProblemScore(scoreProblemStatement(e.target.value));
                setError("");
              }}
              placeholder="Describe the challenge here..."
            />

            <ScoreIndicator
              label="Clarity"
              score={problemScore.score}
              tips={problemScore.tips}
            />


            {error && (
              <p className="error-message">
                {error}
              </p>
            )}


            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={problemScore.score < PASS_THRESHOLD}
              title={
                problemScore.score < PASS_THRESHOLD
                  ? "Add more detail to reach at least 40% clarity before continuing."
                  : undefined
              }
            >
              ✦ Analyze Problem with AI →
            </button>

          </section>
        )}


        {/* =====================================
            SCREEN 2 — 5 WHYS
           ===================================== */}

        {step === 2 && (
          <section className="whys-card">

            <div className="step-heading">

              <span className="step-number">
                02
              </span>

              <div>
                <h3>
                  Explore the Root Cause
                </h3>

                <p>
                  Ask "why" repeatedly to uncover what is really
                  causing the problem.
                </p>
              </div>

            </div>


            <div className="original-problem">

              <span>
                ORIGINAL PROBLEM
              </span>

              <p>
                {problem}
              </p>

            </div>


            <div className="whys-list">

              {whys.map((why, index) => (

                <div
                  className="why-item"
                  key={index}
                >

                  <div className="why-heading">

                    <span className="why-number">
                      WHY {index + 1}
                    </span>

                    <div>

                      <label htmlFor={`why-${index}`}>
                        {whyQuestions[index].title}
                      </label>

                      <p className="why-hint">
                        {whyQuestions[index].hint}
                      </p>

                    </div>

                  </div>


                  <input
                    id={`why-${index}`}
                    type="text"
                    value={why}
                    onChange={(e) => {
                      handleWhyChange(
                        index,
                        e.target.value
                      );

                      setError("");
                    }}
                    placeholder={
                      whyQuestions[index].placeholder
                    }
                  />

                </div>

              ))}

            </div>

            <ScoreIndicator
              label="Depth of analysis"
              score={whysScore.score}
              tips={whysScore.tips}
            />


            {error && (
              <p className="error-message">
                {error}
              </p>
            )}


            <div className="whys-actions">

              <button
                className="back-button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                ← Back
              </button>


              <button
                className="continue-button"
                onClick={handleContinueToReframe}
                disabled={whysScore.score < PASS_THRESHOLD}
                title={
                  whysScore.score < PASS_THRESHOLD
                    ? "Answer the Whys with more depth to reach at least 40% before continuing."
                    : undefined
                }
              >
                Continue to Reframe →
              </button>

            </div>

          </section>
        )}


        {/* =====================================
            SCREEN 3 — REFRAME
           ===================================== */}

        {step === 3 && (
          <section className="reframe-card">

            <div className="step-heading">

              <span className="step-number">
                03
              </span>

              <div>

                <h3>
                  Reframe the Problem
                </h3>

                <p>
                  Turn what you discovered into a clear
                  opportunity for innovation.
                </p>

              </div>

            </div>


            <div className="original-problem">

              <span>
                ORIGINAL PROBLEM
              </span>

              <p>
                {problem}
              </p>

            </div>


            <div className="root-cause-box">

              <label htmlFor="root-cause">
                Review the proposed root cause
              </label>

              <p className="field-hint">
                We've used your fifth Why as a starting point.
                Edit it if needed so it clearly describes the
                underlying cause of the problem.
              </p>


              <textarea
                id="root-cause"
                value={rootCause}
                onChange={(e) => {
                  setRootCause(e.target.value);
                  setError("");
                }}
                placeholder="Describe the root cause you identified..."
              />

            </div>


            <div className="hmw-section">

              <p className="hmw-label">
                HOW MIGHT WE...
              </p>

              <h3>
                Turn the root cause into an opportunity
              </h3>

              <p className="field-hint">
                Phrase the challenge as an open-ended question
                that encourages different possible solutions.
              </p>


              <textarea
                id="hmw"
                value={hmw}
                onChange={(e) => {
                  setHmw(e.target.value);
                  setHmwScore(scoreHMW(e.target.value));
                  setError("");
                }}
                placeholder="How might we help [user/group] achieve [goal] despite [challenge]?"
              />

              <ScoreIndicator
                label="HMW quality"
                score={hmwScore.score}
                tips={hmwScore.tips}
              />


              <div className="hmw-example">

                <strong>
                  Example:
                </strong>{" "}

                How might we help local food businesses
                reduce unnecessary food preparation while
                still meeting customer demand?

              </div>

            </div>


            {error && (
              <p className="error-message">
                {error}
              </p>
            )}


            <div className="whys-actions">

              <button
                className="back-button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
              >
                ← Back to 5 Whys
              </button>


              <button
                className="continue-button"
                onClick={handleGenerateIdeas}
                disabled={
                  rootCause.trim() === "" ||
                  hmwScore.score < PASS_THRESHOLD
                }
                title={
                  hmwScore.score < PASS_THRESHOLD
                    ? "Sharpen your How Might We statement to reach at least 40% before continuing."
                    : undefined
                }
              >
                Generate Ideas →
              </button>

            </div>

          </section>
        )}


        {/* =====================================
            SCREEN 4 — CREATIVE IDEATION BOARD
           ===================================== */}

        {step === 4 && (
          <section className="ideas-card">

            <div className="step-heading">

              <span className="step-number">
                04
              </span>

              <div>

                <h3>
                  Creative Ideation Board
                </h3>

                <p>
                  Explore different approaches before deciding which
                  solution direction to develop.
                </p>

              </div>

            </div>


            {/* HOW MIGHT WE */}

            <div className="original-problem">

              <span>
                HOW MIGHT WE
              </span>

              <p>
                {hmw}
              </p>

            </div>


            {/* IDEATION METHOD */}

            <div className="ideation-tools">

              <div className="ideation-tools-heading">

                <p className="idea-placeholder-label">
                  IDEATION METHOD
                </p>

                <h3>
                  Choose a way to explore your challenge
                </h3>

                <p>
                  Try different thinking methods to discover solution
                  directions you may not have considered initially.
                </p>

              </div>


              <div className="method-tabs">

                <button
                  className={
                    ideationMethod === "SCAMPER"
                      ? "method-active"
                      : ""
                  }
                  onClick={() =>
                    setIdeationMethod("SCAMPER")
                  }
                >
                  SCAMPER
                </button>


                <button
                  className={
                    ideationMethod === "Mind Map"
                      ? "method-active"
                      : ""
                  }
                  onClick={() =>
                    setIdeationMethod("Mind Map")
                  }
                >
                  Mind Map
                </button>

              </div>


              {/* SCAMPER */}

              {ideationMethod === "SCAMPER" && (

                <div className="scamper-section">

                  <div className="method-info">

                    <h4>
                      SCAMPER
                    </h4>

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

                    <h4>
                      Mind Map
                    </h4>

                    <p>
                      Start with your How Might We statement in the
                      centre and branch into different areas that could
                      lead to possible solutions.
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


            {/* =================================
                AI IDEA SUGGESTIONS
               ================================= */}

            <div className="ideas-section">

              <div className="ideas-heading">

                <p className="idea-placeholder-label">
                  ✦ AI IDEA SUGGESTIONS
                </p>

                <h3>
                  Explore possible solution directions
                </h3>

                <p>
                  These are sample suggestions for now.
                  When the AI backend is connected,
                  these cards will be populated using the
                  student's actual problem and ideation work.
                </p>

              </div>


              <div className="idea-grid">

                {[...ideaSuggestions, ...extraIdeas].map(
                  (idea, index) => (

                    <div
                      className={
                        selectedIdea === index
                          ? "idea-card selected-idea"
                          : "idea-card"
                      }
                      key={index}
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
                        onClick={() =>
                          setSelectedIdea(index)
                        }
                      >
                        {selectedIdea === index
                          ? "✓ Selected"
                          : "Explore this idea →"}
                      </button>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* ACTIONS */}

            <div className="ideation-actions">

              <button
                className="back-button"
                onClick={() => setStep(3)}
              >
                ← Back to Reframe
              </button>


              <button
                className="generate-more-button"
                onClick={handleGenerateMoreIdeas}
              >
                ✦ Generate More Ideas
              </button>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default ProblemCanvas;