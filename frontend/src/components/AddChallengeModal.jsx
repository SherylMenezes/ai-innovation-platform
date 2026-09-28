import { useEffect, useState } from "react";
import "./AddChallengeModal.css";

const DOMAINS = [
  "Healthcare",
  "Sustainability",
  "Agriculture",
  "Finance",
];

const DIFFICULTIES = [
  "Beginner",
  "Medium",
  "Advanced",
];

const IMPACT_LEVELS = [
  "Low",
  "Medium",
  "High",
];

const LEARNING_TIERS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Graduate",
];

export default function AddChallengeModal({
  isOpen,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState({
    title: "",
    domain: "Healthcare",
    difficulty: "Beginner",
    impact: "Medium",
    description: "",
    problem: "",
    why_needed: "",
    who_affected: "",
    goal: "",
    constraints: "",
    learning_tier: "Level 1",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // ESCAPE KEY
  // ---------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // ---------------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------------

  const resetForm = () => {
    setForm({
      title: "",
      domain: "Healthcare",
      difficulty: "Beginner",
      impact: "Medium",
      description: "",
      problem: "",
      why_needed: "",
      who_affected: "",
      goal: "",
      constraints: "",
      learning_tier: "Level 1",
    });

    setError("");
  };

  // ---------------------------------------------------------
  // CLOSE
  // ---------------------------------------------------------

  const handleDismiss = () => {
    if (loading) return;

    setError("");
    onClose();
  };

  // ---------------------------------------------------------
  // INPUT HANDLER
  // ---------------------------------------------------------

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (!form.title.trim()) {
      setError("Please enter a challenge title.");
      setLoading(false);
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a short description.");
      setLoading(false);
      return;
    }

    if (!form.problem.trim()) {
      setError("Please describe the problem.");
      setLoading(false);
      return;
    }

    if (!form.why_needed.trim()) {
      setError("Please explain why this challenge is needed.");
      setLoading(false);
      return;
    }

    if (!form.goal.trim()) {
      setError("Please enter the challenge goal.");
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      domain: form.domain,
      difficulty: form.difficulty,
      impact: form.impact,

      description: form.description.trim(),

      problem: form.problem.trim(),

      why_needed: form.why_needed.trim(),

      who_affected: form.who_affected
        ? form.who_affected
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],

      goal: form.goal.trim(),

      constraints: form.constraints
        ? form.constraints
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],

      learning_tier: form.learning_tier,
    };

    try {
      await onCreated(payload);

      resetForm();
      onClose();
    } catch (err) {
      setError(
        err?.message || "Failed to create challenge. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="challenge-modal-overlay"
      onClick={handleDismiss}
    >
      <div
        className="challenge-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------ */}

        <div className="challenge-modal-header">
          <div>
            <div className="challenge-modal-eyebrow">
              ✦ CHALLENGE CREATOR
            </div>

            <h2>Create New Challenge</h2>

            <p>
              Define a real-world problem and turn it into an
              innovation challenge.
            </p>
          </div>

          <button
            type="button"
            className="challenge-modal-close"
            onClick={handleDismiss}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ------------------------------------------------ */}
        {/* FORM */}
        {/* ------------------------------------------------ */}

        <form
          className="challenge-modal-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="challenge-form-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* ---------------------------------------------- */}
          {/* BASIC INFORMATION */}
          {/* ---------------------------------------------- */}

          <div className="challenge-form-section">
            <div className="challenge-section-heading">
              <span className="section-number">01</span>

              <div>
                <h3>Basic Information</h3>
                <p>Give your challenge a clear identity.</p>
              </div>
            </div>

            <div className="challenge-form-group">
              <label>
                Challenge Title
                <span>*</span>
              </label>

              <input
                type="text"
                value={form.title}
                placeholder="e.g. AI Triage Assistant for Rural Clinics"
                onChange={(event) =>
                  handleChange("title", event.target.value)
                }
              />
            </div>

            <div className="challenge-form-grid">
              <div className="challenge-form-group">
                <label>Domain</label>

                <select
                  value={form.domain}
                  onChange={(event) =>
                    handleChange("domain", event.target.value)
                  }
                >
                  {DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="challenge-form-group">
                <label>Difficulty</label>

                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    handleChange(
                      "difficulty",
                      event.target.value
                    )
                  }
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option
                      key={difficulty}
                      value={difficulty}
                    >
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="challenge-form-group">
                <label>Impact</label>

                <select
                  value={form.impact}
                  onChange={(event) =>
                    handleChange(
                      "impact",
                      event.target.value
                    )
                  }
                >
                  {IMPACT_LEVELS.map((impact) => (
                    <option key={impact} value={impact}>
                      {impact}
                    </option>
                  ))}
                </select>
              </div>

              <div className="challenge-form-group">
                <label>Learning Tier</label>

                <select
                  value={form.learning_tier}
                  onChange={(event) =>
                    handleChange(
                      "learning_tier",
                      event.target.value
                    )
                  }
                >
                  {LEARNING_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------- */}
          {/* CHALLENGE DESCRIPTION */}
          {/* ---------------------------------------------- */}

          <div className="challenge-form-section">
            <div className="challenge-section-heading">
              <span className="section-number">02</span>

              <div>
                <h3>Challenge Definition</h3>
                <p>Explain the problem innovators need to solve.</p>
              </div>
            </div>

            <div className="challenge-form-group">
              <label>
                Short Description
                <span>*</span>
              </label>

              <textarea
                rows={3}
                value={form.description}
                placeholder="Give a short overview that will appear on the challenge card..."
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="challenge-form-group">
              <label>
                Problem
                <span>*</span>
              </label>

              <textarea
                rows={4}
                value={form.problem}
                placeholder="What real-world problem needs to be solved?"
                onChange={(event) =>
                  handleChange(
                    "problem",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="challenge-form-group">
              <label>
                Why Is This Needed?
                <span>*</span>
              </label>

              <textarea
                rows={3}
                value={form.why_needed}
                placeholder="Explain why solving this problem is important..."
                onChange={(event) =>
                  handleChange(
                    "why_needed",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          {/* ---------------------------------------------- */}
          {/* PEOPLE + GOAL */}
          {/* ---------------------------------------------- */}

          <div className="challenge-form-section">
            <div className="challenge-section-heading">
              <span className="section-number">03</span>

              <div>
                <h3>Impact & Goal</h3>
                <p>Define who benefits and what success looks like.</p>
              </div>
            </div>

            <div className="challenge-form-group">
              <label>Who Is Affected?</label>

              <input
                type="text"
                value={form.who_affected}
                placeholder="e.g. Rural patients, Nurses, Small clinics"
                onChange={(event) =>
                  handleChange(
                    "who_affected",
                    event.target.value
                  )
                }
              />

              <small>
                Separate multiple groups with commas.
              </small>
            </div>

            <div className="challenge-form-group">
              <label>
                Challenge Goal
                <span>*</span>
              </label>

              <textarea
                rows={4}
                value={form.goal}
                placeholder="What should the participant ultimately build or achieve?"
                onChange={(event) =>
                  handleChange("goal", event.target.value)
                }
              />
            </div>
          </div>

          {/* ---------------------------------------------- */}
          {/* CONSTRAINTS */}
          {/* ---------------------------------------------- */}

          <div className="challenge-form-section">
            <div className="challenge-section-heading">
              <span className="section-number">04</span>

              <div>
                <h3>Constraints</h3>
                <p>Add the rules or limitations participants should follow.</p>
              </div>
            </div>

            <div className="challenge-form-group">
              <label>Technical / Time Constraints</label>

              <input
                type="text"
                value={form.constraints}
                placeholder="e.g. Must work offline, No PII, Low bandwidth"
                onChange={(event) =>
                  handleChange(
                    "constraints",
                    event.target.value
                  )
                }
              />

              <small>
                Separate multiple constraints with commas.
              </small>
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* ACTIONS */}
          {/* ------------------------------------------------ */}

          <div className="challenge-modal-actions">
            <button
              type="button"
              className="challenge-btn-cancel"
              onClick={handleDismiss}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="challenge-btn-create"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="challenge-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  Create Challenge
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}