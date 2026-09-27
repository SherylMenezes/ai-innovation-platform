import { useState, useEffect } from "react";

const DOMAINS = ["Healthcare", "Sustainability", "Agriculture", "Finance"];
const DIFFICULTIES = ["Beginner", "Medium", "Advanced"];

export default function AddChallengeModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    domain: "Healthcare",
    difficulty: "Beginner",
    description: "",
    constraints: "",
    learning_tier: "Level 1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setError(""); // Clear error state
    onClose();    // Call parent close handler
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      domain: form.domain,
      difficulty: form.difficulty,
      description: form.description.trim(),
      constraints: form.constraints
        ? form.constraints.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      learning_tier: form.learning_tier,
    };

    try {
      await onCreated(payload);
      // Reset form on success
      setForm({
        title: "",
        domain: "Healthcare",
        difficulty: "Beginner",
        description: "",
        constraints: "",
        learning_tier: "Level 1",
      });
      handleDismiss();
    } catch (err) {
      setError(err.message || "Failed to create challenge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Clicking the backdrop overlay dismisses the modal */
    <div className="modal-overlay" onClick={handleDismiss}>
      {/* stopPropagation prevents clicks inside the modal from closing it */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Challenge</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
          >
            &times;
          </button>
        </div>

        {error && <p className="catalog-error">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              required
              placeholder="e.g. AI Goal Journal"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the challenge goals..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Constraints (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Less use of AI, Speed"
              value={form.constraints}
              onChange={(e) =>
                setForm({ ...form, constraints: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDismiss}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}