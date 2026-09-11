import { useState } from "react";
import "./AiIdeaDrawer.css";
import { generateIdeas, remixIdeas } from "../../api/aiClient";

function AiIdeaDrawer({ notes, onAddNoteFromIdea }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextText, setContextText] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [generateError, setGenerateError] = useState("");

  const [selectedNoteIds, setSelectedNoteIds] = useState(() => new Set());
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixResult, setRemixResult] = useState(null);
  const [remixError, setRemixError] = useState("");

  const toggleNoteSelected = (id) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!contextText.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerateError("");
    setGeneratedIdeas([]);

    try {
      const response = await generateIdeas(contextText.trim(), count);
      setGeneratedIdeas(response.ideas);
      if (response.ideas.length === 0) {
        setGenerateError("The AI service didn't return any ideas for this prompt.");
      }
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemix = async () => {
    if (selectedNoteIds.size < 2 || isRemixing) return;

    setIsRemixing(true);
    setRemixError("");
    setRemixResult(null);

    const selected = notes.filter((n) => selectedNoteIds.has(n.id));
    const ideaIds = selected.map((n) => String(n.id));
    const ideaDescriptions = selected.map((n) => n.text.trim() || "Untitled idea");

    try {
      const response = await remixIdeas(ideaIds, ideaDescriptions);
      setRemixResult(response);
    } catch (err) {
      setRemixError(err.message);
    } finally {
      setIsRemixing(false);
    }
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

          {generateError && <p className="ai-drawer-error">{generateError}</p>}

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

          {remixError && <p className="ai-drawer-error">{remixError}</p>}

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
