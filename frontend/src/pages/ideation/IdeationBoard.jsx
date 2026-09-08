import { useCallback, useEffect, useRef, useState } from "react";
import "./IdeationBoard.css";

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
// drag clamping keeps notes on the board.
const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 170;

const STAGGER_STEP = 28;
const STAGGER_WRAP_AFTER = 6;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getColor(name) {
  return NOTE_COLORS.find((c) => c.name === name) || NOTE_COLORS[0];
}

function IdeationBoard() {
  const [notes, setNotes] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [draggingId, setDraggingId] = useState(null);

  const boardRef = useRef(null);
  const dragInfo = useRef(null); // { id, offsetX, offsetY }

  const handleAddNote = () => {
    const board = boardRef.current;
    const boardWidth = board ? board.clientWidth : 900;
    const boardHeight = board ? board.clientHeight : 520;

    const step = notes.length % STAGGER_WRAP_AFTER;
    const x = clamp(24 + step * STAGGER_STEP, 0, Math.max(0, boardWidth - NOTE_WIDTH));
    const y = clamp(24 + step * STAGGER_STEP, 0, Math.max(0, boardHeight - NOTE_HEIGHT));
    const color = NOTE_COLORS[notes.length % NOTE_COLORS.length].name;

    setNotes((prev) => [...prev, { id: nextId, text: "", color, x, y }]);
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

  // Release listeners if the board unmounts mid-drag (e.g. the App-level
  // page toggle switches away from Ideation Board while dragging).
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="ideation-board">

      <header className="board-header">
        <p className="board-label">IDEATION BOARD</p>
        <h2>Collect and arrange your ideas</h2>
        <p className="board-subtitle">
          Add sticky notes for every direction worth exploring, then drag
          them around to group related ideas together.
        </p>
      </header>

      <div className="board-toolbar">
        <button type="button" className="add-note-button" onClick={handleAddNote}>
          + Add Note
        </button>

        <span className="note-count-badge">
          {notes.length} {notes.length === 1 ? "Note" : "Notes"}
        </span>
      </div>

      <main className="ideation-board-surface" ref={boardRef}>

        {notes.length === 0 && (
          <div className="board-empty-state">
            <div className="board-empty-icon">📝</div>
            <h3>No sticky notes yet</h3>
            <p>Add your first idea to start filling the board.</p>
            <button type="button" className="add-note-button" onClick={handleAddNote}>
              + Add Note
            </button>
          </div>
        )}

        {notes.map((note) => {
          const color = getColor(note.color);
          const isDragging = draggingId === note.id;

          return (
            <div
              key={note.id}
              className={`sticky-note${isDragging ? " sticky-note-dragging" : ""}`}
              style={{
                left: note.x,
                top: note.y,
                background: color.bg,
                borderColor: color.border
              }}
            >
              <div
                className="sticky-note-header"
                onMouseDown={(e) => handlePointerDown(e, note)}
              >
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
                      onClick={() => handleColorChange(note.id, c.name)}
                      aria-label={`Set note color to ${c.name}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="sticky-note-delete"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteNote(note.id)}
                  aria-label="Delete note"
                >
                  ×
                </button>
              </div>

              <textarea
                className="sticky-note-textarea"
                value={note.text}
                onChange={(e) => handleTextChange(note.id, e.target.value)}
                placeholder="Type your idea..."
              />
            </div>
          );
        })}

      </main>
    </div>
  );
}

export default IdeationBoard;
