import { useState } from "react";
import "./AiIdeaDrawer.css";

// Placeholder idea bank standing in for POST /api/ai/generate-ideas
// (backend/app/routers/ai.py) until Day 5 wires the real call. Shapes
// match GeneratedIdea: { id, title, description, category }.
const MOCK_IDEA_TEMPLATES = [
  {
    title: "Smart Demand Forecasting",
    description: "Predict expected demand ahead of time so preparation better matches actual need.",
    category: "Data & Prediction"
  },
  {
    title: "Community Sharing Network",
    description: "Connect surplus directly with people or groups who can use it nearby.",
    category: "Logistics"
  },
  {
    title: "Incentivized Pre-Commitment",
    description: "Let people commit early in exchange for a small reward, improving planning accuracy.",
    category: "Behavioral"
  },
  {
    title: "Transparent Feedback Loop",
    description: "Show the real-time impact of a choice back to the person making it.",
    category: "Engagement"
  },
  {
    title: "Tiered Flexible Options",
    description: "Offer several smaller options instead of one fixed one, reducing excess.",
    category: "Product Design"
  }
];

const MOCK_DELAY_MS = 700;

function AiIdeaDrawer({ notes, onAddNoteFromIdea }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextText, setContextText] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);

  const [selectedNoteIds, setSelectedNoteIds] = useState(() => new Set());
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixResult, setRemixResult] = useState(null);

  const toggleNoteSelected = (id) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    if (!contextText.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedIdeas([]);

    // Simulated response only — POST /api/ai/generate-ideas wiring lands Day 5.
    setTimeout(() => {
      const ideas = Array.from({ length: count }, (_, i) => ({
        id: `mock-gen-${Date.now()}-${i}`,
        ...MOCK_IDEA_TEMPLATES[i % MOCK_IDEA_TEMPLATES.length]
      }));
      setGeneratedIdeas(ideas);
      setIsGenerating(false);
    }, MOCK_DELAY_MS);
  };

  const handleRemix = () => {
    if (selectedNoteIds.size < 2 || isRemixing) return;

    setIsRemixing(true);
    setRemixResult(null);

    // Simulated response only — POST /api/ai/remix-ideas wiring lands Day 5.
    setTimeout(() => {
      const selectedTexts = notes
        .filter((n) => selectedNoteIds.has(n.id))
        .map((n) => n.text.trim() || "Untitled idea");

      setRemixResult({
        remixed_title: "Combined Concept (preview)",
        remixed_concept: `A blended direction pulling elements from: ${selectedTexts.join(" + ")}.`,
        combined_elements: selectedTexts
      });
      setIsRemixing(false);
    }, MOCK_DELAY_MS);
  };

  return (
    <>
      <button
        type="button"
        className="ai-drawer-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI idea generation drawer"
      >
        ✦ AI Ideas
      </button>

      {isOpen && <div className="ai-drawer-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`ai-drawer${isOpen ? " ai-drawer-open" : ""}`}>

        <div className="ai-drawer-header">
          <h3>✦ AI Ideation</h3>
          <button
            type="button"
            className="ai-drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI idea generation drawer"
          >
            ×
          </button>
        </div>

        <p className="ai-drawer-disclaimer">
          Sample preview only — live AI generation connects on Day 5.
        </p>

        <section className="ai-drawer-section">
          <h4>Generate Ideas</h4>
          <p className="ai-drawer-hint">Describe your problem or HMW statement.</p>

          <textarea
            className="ai-drawer-textarea"
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            placeholder="e.g. How might we help local restaurants reduce food waste?"
          />

          <div className="ai-drawer-count-row">
            <label htmlFor="idea-count">Number of ideas</label>
            <input
              id="idea-count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(clampCount(e.target.value))}
            />
          </div>

          <button
            type="button"
            className="ai-drawer-action-button"
            onClick={handleGenerate}
            disabled={!contextText.trim() || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Ideas"}
          </button>

          {generatedIdeas.length > 0 && (
            <div className="ai-drawer-results">
              {generatedIdeas.map((idea) => (
                <div className="ai-idea-card" key={idea.id}>
                  <span className="ai-idea-category">{idea.category}</span>
                  <h5>{idea.title}</h5>
                  <p>{idea.description}</p>
                  <button
                    type="button"
                    className="ai-idea-add-button"
                    onClick={() => onAddNoteFromIdea(`${idea.title}\n\n${idea.description}`)}
                  >
                    + Add to board
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ai-drawer-section">
          <h4>Remix Ideas</h4>
          <p className="ai-drawer-hint">Select at least two notes to blend into a new direction.</p>

          <div className="ai-drawer-note-list">
            {notes.length === 0 && <p className="ai-drawer-empty">Add some sticky notes first.</p>}

            {notes.map((note) => (
              <label className="ai-drawer-note-option" key={note.id}>
                <input
                  type="checkbox"
                  checked={selectedNoteIds.has(note.id)}
                  onChange={() => toggleNoteSelected(note.id)}
                />
                <span>{note.text.trim() || "(empty note)"}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            className="ai-drawer-action-button"
            onClick={handleRemix}
            disabled={selectedNoteIds.size < 2 || isRemixing}
          >
            {isRemixing ? "Remixing..." : "Remix Selected"}
          </button>

          {remixResult && (
            <div className="ai-idea-card ai-remix-card">
              <h5>{remixResult.remixed_title}</h5>
              <p>{remixResult.remixed_concept}</p>
              <button
                type="button"
                className="ai-idea-add-button"
                onClick={() => onAddNoteFromIdea(`${remixResult.remixed_title}\n\n${remixResult.remixed_concept}`)}
              >
                + Add to board
              </button>
            </div>
          )}
        </section>

      </aside>
    </>
  );
}

function clampCount(rawValue) {
  const value = Number(rawValue);
  if (Number.isNaN(value)) return 1;
  return Math.min(10, Math.max(1, Math.round(value)));
}

export default AiIdeaDrawer;
