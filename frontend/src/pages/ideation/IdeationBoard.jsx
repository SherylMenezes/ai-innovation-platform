import { useCallback, useEffect, useRef, useState } from "react";
import "./IdeationBoard.css";
import AiIdeaDrawer from "./AiIdeaDrawer";

// Sticky note color palette. Backgrounds/borders only — note text always
// stays the app's standard dark slate for readability across all colors.
const NOTE_COLORS = [
  { name: "sunshine", bg: "#fef3c7", border: "#fbbf24" },
  { name: "blossom", bg: "#fce7f3", border: "#f9a8d4" },
  { name: "sky", bg: "#dbeafe", border: "#93c5fd" },
  { name: "mint", bg: "#dcfce7", border: "#86efac" },
  { name: "lavender", bg: "#ede9fe", border: "#c4b5fd" }
];

// Kept in sync with the CSS .sticky-note width / approximate height so
// freeform drag clamping keeps notes on the board.
const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 170;

const STAGGER_STEP = 28;
const STAGGER_WRAP_AFTER = 6;

// Technique names match backend/app/schemas/ai.py's ScamperSuggestion.technique
// exactly, so Day 5 can assign notes straight from the API response without
// a remapping layer. Prompts here are static placeholders standing in for
// the per-HMW prompt_question the real endpoint will eventually return.
const SCAMPER_TECHNIQUES = [
  { name: "Substitute", prompt: "What could be substituted or swapped out?" },
  { name: "Combine", prompt: "What ideas, features, or steps could be combined?" },
  { name: "Adapt", prompt: "What else is like this? What could be adapted?" },
  { name: "Modify", prompt: "What could be emphasized, minimized, or changed?" },
  { name: "Put to another use", prompt: "How else could this be used?" },
  { name: "Eliminate", prompt: "What could be removed or simplified?" },
  { name: "Reverse", prompt: "What could be reversed or done in the opposite order?" }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getColor(name) {
  return NOTE_COLORS.find((c) => c.name === name) || NOTE_COLORS[0];
}

// Shared note card. The parent controls positioning (via style/className)
// and how dragging is initiated (via headerDragProps) so the same card
// markup works across freeform (absolute + mouse drag), SCAMPER (flow +
// HTML5 drag-and-drop into a column) and Mind Map (absolute, no drag).
function NoteCard({ note, style, className, headerDragProps, onTextChange, onColorChange, onDelete }) {
  const color = getColor(note.color);

  return (
    <div
      className={`sticky-note${className ? ` ${className}` : ""}`}
      style={{ ...style, background: color.bg, borderColor: color.border }}
    >
      <div className="sticky-note-header" {...headerDragProps}>
        <div className="sticky-note-grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="sticky-note-colors">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`color-dot${note.color === c.name ? " color-dot-active" : ""}`}
              style={{ background: c.bg, borderColor: c.border }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onColorChange(note.id, c.name)}
              aria-label={`Set note color to ${c.name}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="sticky-note-delete"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
        >
          ×
        </button>
      </div>

      <textarea
        className="sticky-note-textarea"
        value={note.text}
        onChange={(e) => onTextChange(note.id, e.target.value)}
        placeholder="Type your idea..."
      />
    </div>
  );
}

const UNSORTED_KEY = "__unsorted__";

function IdeationBoard() {
  const [notes, setNotes] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [draggingId, setDraggingId] = useState(null);
  const [viewMode, setViewMode] = useState("freeform"); // "freeform" | "scamper" | "mindmap"
  const [mindMapCenter, setMindMapCenter] = useState("");
  const [dragOverKey, setDragOverKey] = useState(null); // SCAMPER column currently being dragged over
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  const boardRef = useRef(null);
  const dragInfo = useRef(null); // { id, offsetX, offsetY }

  // Mind Map's radial layout scales down on narrow viewports so satellite
  // notes stay reachable instead of running off-screen.
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mindMapRadius = viewportWidth < 480 ? 110 : viewportWidth < 768 ? 150 : 220;

  const handleAddNote = (initialText = "") => {
    const board = boardRef.current;
    const boardWidth = board ? board.clientWidth : 900;
    const boardHeight = board ? board.clientHeight : 520;

    const step = notes.length % STAGGER_WRAP_AFTER;
    const x = clamp(24 + step * STAGGER_STEP, 0, Math.max(0, boardWidth - NOTE_WIDTH));
    const y = clamp(24 + step * STAGGER_STEP, 0, Math.max(0, boardHeight - NOTE_HEIGHT));
    const color = NOTE_COLORS[notes.length % NOTE_COLORS.length].name;

    setNotes((prev) => [...prev, { id: nextId, text: initialText, color, x, y, technique: null }]);
    setNextId((prev) => prev + 1);
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleTextChange = (id, text) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)));
  };

  const handleColorChange = (id, colorName) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, color: colorName } : note)));
  };

  const handleAssignTechnique = (id, technique) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, technique } : note)));
  };

  // ---- Freeform drag (mouse-based, pixel positions) ----
  // Stable across renders (empty dep arrays) so the mousedown that adds
  // these listeners and the mouseup that removes them always agree on
  // which function reference is attached to `window`.
  const handlePointerMove = useCallback((e) => {
    const drag = dragInfo.current;
    const board = boardRef.current;
    if (!drag || !board) return;

    const boardRect = board.getBoundingClientRect();
    const nextX = clamp(e.clientX - boardRect.left - drag.offsetX, 0, Math.max(0, boardRect.width - NOTE_WIDTH));
    const nextY = clamp(e.clientY - boardRect.top - drag.offsetY, 0, Math.max(0, boardRect.height - NOTE_HEIGHT));

    setNotes((prev) => prev.map((note) => (note.id === drag.id ? { ...note, x: nextX, y: nextY } : note)));
  }, []);

  // Held in refs (rather than referencing handlePointerMove/handlePointerUp
  // by name inside handlePointerUp's own body) so there's no self-reference
  // from a callback back to its own not-yet-finished declaration. Refs are
  // populated in an effect below, after render, per the rules of hooks.
  const moveHandlerRef = useRef(null);
  const upHandlerRef = useRef(null);

  const handlePointerUp = useCallback(() => {
    dragInfo.current = null;
    setDraggingId(null);
    window.removeEventListener("mousemove", moveHandlerRef.current);
    window.removeEventListener("mouseup", upHandlerRef.current);
  }, []);

  useEffect(() => {
    moveHandlerRef.current = handlePointerMove;
    upHandlerRef.current = handlePointerUp;
  }, [handlePointerMove, handlePointerUp]);

  const handlePointerDown = (e, note) => {
    const board = boardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();

    dragInfo.current = {
      id: note.id,
      offsetX: e.clientX - boardRect.left - note.x,
      offsetY: e.clientY - boardRect.top - note.y
    };
    setDraggingId(note.id);

    // Attached to window, not the note/board element, so the drag still
    // releases cleanly on mouseup anywhere in the viewport.
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  };

  // Release listeners if the board unmounts mid-drag (e.g. switching the
  // App-level page toggle away from Ideation Board while dragging).
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ---- SCAMPER drag (native HTML5 drag-and-drop, column assignment) ----
  const handleNoteDragStart = (e, noteId) => {
    e.dataTransfer.setData("text/plain", String(noteId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleColumnDragEnter = (e, key) => {
    e.preventDefault();
    setDragOverKey(key);
  };

  const handleColumnDragLeave = (e, key) => {
    // dragleave also fires when moving between a column's own children —
    // only clear the highlight once we've actually left the column itself.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverKey((prev) => (prev === key ? null : prev));
  };

  const handleColumnDrop = (e, technique, key) => {
    e.preventDefault();
    setDragOverKey((prev) => (prev === key ? null : prev));
    const noteId = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(noteId)) {
      handleAssignTechnique(noteId, technique);
    }
  };

  return (
    <div className="ideation-board">

      <header className="board-header">
        <p className="board-label">IDEATION BOARD</p>
        <h2>Collect and arrange your ideas</h2>
        <p className="board-subtitle">
          Add sticky notes for every direction worth exploring, then switch
          views to organize them with SCAMPER or a mind map.
        </p>
      </header>

      <div className="board-toolbar">
        <button type="button" className="add-note-button" onClick={() => handleAddNote()}>
          + Add Note
        </button>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={viewMode === "freeform" ? "active-tab" : ""}
            onClick={() => setViewMode("freeform")}
          >
            Freeform
          </button>
          <button
            type="button"
            className={viewMode === "scamper" ? "active-tab" : ""}
            onClick={() => setViewMode("scamper")}
          >
            SCAMPER
          </button>
          <button
            type="button"
            className={viewMode === "mindmap" ? "active-tab" : ""}
            onClick={() => setViewMode("mindmap")}
          >
            Mind Map
          </button>
        </div>

        <span className="note-count-badge">
          {notes.length} {notes.length === 1 ? "Note" : "Notes"}
        </span>
      </div>

      <main className={`ideation-board-surface board-surface-${viewMode}`} ref={boardRef}>
        <div key={viewMode} className="board-mode-content">

          {/* ===== FREEFORM ===== */}
          {viewMode === "freeform" && (
            <>
              {notes.length === 0 && (
                <div className="board-empty-state">
                  <div className="board-empty-icon">📝</div>
                  <h3>No sticky notes yet</h3>
                  <p>Add your first idea to start filling the board.</p>
                  <button type="button" className="add-note-button" onClick={() => handleAddNote()}>
                    + Add Note
                  </button>
                </div>
              )}

              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  style={{ left: note.x, top: note.y }}
                  className={`sticky-note-absolute${draggingId === note.id ? " sticky-note-dragging" : ""}`}
                  headerDragProps={{ onMouseDown: (e) => handlePointerDown(e, note) }}
                  onTextChange={handleTextChange}
                  onColorChange={handleColorChange}
                  onDelete={handleDeleteNote}
                />
              ))}
            </>
          )}

          {/* ===== SCAMPER ===== */}
          {viewMode === "scamper" && (
            <div className="scamper-board">

              <div
                className={`scamper-column scamper-column-unsorted${dragOverKey === UNSORTED_KEY ? " scamper-column-dragover" : ""}`}
                onDragOver={handleColumnDragOver}
                onDragEnter={(e) => handleColumnDragEnter(e, UNSORTED_KEY)}
                onDragLeave={(e) => handleColumnDragLeave(e, UNSORTED_KEY)}
                onDrop={(e) => handleColumnDrop(e, null, UNSORTED_KEY)}
              >
                <div className="scamper-column-header">
                  <h4>Unsorted</h4>
                  <p>Drag a note into a technique to sort it.</p>
                </div>
                <div className="scamper-column-notes">
                  {notes.filter((n) => !n.technique).map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      className="sticky-note-flow"
                      headerDragProps={{
                        draggable: true,
                        onDragStart: (e) => handleNoteDragStart(e, note.id),
                        onDragEnd: () => setDragOverKey(null)
                      }}
                      onTextChange={handleTextChange}
                      onColorChange={handleColorChange}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </div>

              {SCAMPER_TECHNIQUES.map((tech) => (
                <div
                  key={tech.name}
                  className={`scamper-column${dragOverKey === tech.name ? " scamper-column-dragover" : ""}`}
                  onDragOver={handleColumnDragOver}
                  onDragEnter={(e) => handleColumnDragEnter(e, tech.name)}
                  onDragLeave={(e) => handleColumnDragLeave(e, tech.name)}
                  onDrop={(e) => handleColumnDrop(e, tech.name, tech.name)}
                >
                  <div className="scamper-column-header">
                    <h4>{tech.name}</h4>
                    <p>{tech.prompt}</p>
                  </div>
                  <div className="scamper-column-notes">
                    {notes.filter((n) => n.technique === tech.name).map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        className="sticky-note-flow"
                        headerDragProps={{
                          draggable: true,
                          onDragStart: (e) => handleNoteDragStart(e, note.id),
                          onDragEnd: () => setDragOverKey(null)
                        }}
                        onTextChange={handleTextChange}
                        onColorChange={handleColorChange}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* ===== MIND MAP ===== */}
          {viewMode === "mindmap" && (
            <div className="mindmap-canvas">

              <input
                type="text"
                className="mindmap-center-node"
                value={mindMapCenter}
                onChange={(e) => setMindMapCenter(e.target.value)}
                placeholder="Central idea or HMW statement..."
              />

              {notes.map((note, index) => {
                const angle = (2 * Math.PI * index) / notes.length - Math.PI / 2;
                const x = mindMapRadius * Math.cos(angle);
                const y = mindMapRadius * Math.sin(angle);
                const distance = Math.sqrt(x * x + y * y);
                const angleDeg = (Math.atan2(y, x) * 180) / Math.PI;

                return (
                  <div key={note.id}>
                    <div
                      className="mindmap-connector"
                      style={{ width: `${distance}px`, transform: `rotate(${angleDeg}deg)` }}
                    />
                    <NoteCard
                      note={note}
                      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                      className="sticky-note-absolute sticky-note-mindmap"
                      headerDragProps={{}}
                      onTextChange={handleTextChange}
                      onColorChange={handleColorChange}
                      onDelete={handleDeleteNote}
                    />
                  </div>
                );
              })}

            </div>
          )}

        </div>
      </main>

      <AiIdeaDrawer notes={notes} onAddNoteFromIdea={(text) => handleAddNote(text)} />

    </div>
  );
}

export default IdeationBoard;
