import { forwardRef, useEffect, useMemo, useState } from "react";

// groupOptions is the flat, depth-ordered list used by the class filter: each depth-0 group
// is a grade and the depth-1 groups that follow it are its sections.
function buildGrades(groupOptions) {
  const grades = [];
  for (const g of groupOptions) {
    if (g.depth === 0) grades.push({ ...g, sections: [] });
    else if (g.depth === 1 && grades.length) {
      const grade = grades[grades.length - 1];
      // Section options are labelled "Grade 10 Section A"; show just "Section A" here.
      const name = g.name.startsWith(grade.name) ? g.name.slice(grade.name.length).trim() : g.name;
      grade.sections.push({ ...g, name });
    }
  }
  return grades;
}

// "Grade 10" -> "10", "Section A" -> "A"
const shortName = (name) => name.replace(/grade|section|class/gi, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is unavailable on plain http or when permission is denied.
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

const InviteDialog = forwardRef(function InviteDialog({ baseCode, groupOptions }, ref) {
  const grades = useMemo(() => buildGrades(groupOptions), [groupOptions]);
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [copyState, setCopyState] = useState("idle");

  const grade = grades.find((g) => g.id === gradeId);
  const section = grade?.sections.find((s) => s.id === sectionId);

  useEffect(() => {
    if (!grade && grades.length) setGradeId(grades[0].id);
  }, [grade, grades]);

  useEffect(() => setCopyState("idle"), [gradeId, sectionId, baseCode]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);

  const code = baseCode && grade
    ? `${baseCode}-${shortName(grade.name)}${section ? shortName(section.name) : ""}`
    : "";

  const onCopy = async () => setCopyState((await copyText(code)) ? "copied" : "failed");

  return (
    <dialog ref={ref} className="inst-dialog" aria-labelledby="inst-invite-title">
      <h2 id="inst-invite-title" className="inst-card-title">Invite students</h2>
      <p className="inst-subtitle">
        Pick a class, then share the code. Students enter it on their profile to join that class.
      </p>

      <div className="inst-invite-fields">
        <label className="inst-field">
          <span>Grade</span>
          <select
            value={gradeId}
            onChange={(e) => {
              setGradeId(e.target.value);
              setSectionId("");
            }}
            disabled={!grades.length}
          >
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <label className="inst-field">
          <span>Section</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!grade?.sections.length}>
            <option value="">All sections</option>
            {grade?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </div>

      <div className="inst-invite-box">
        <div className="inst-invite-meta">
          <span className="inst-invite-for">
            {grade ? `${grade.name} · ${section ? section.name : "All sections"}` : "No classes yet"}
          </span>
          <span className="inst-invite-code">{code || "Not available yet"}</span>
        </div>
        <button
          type="button"
          className={`inst-btn inst-btn--outline inst-copy-btn${copyState === "copied" ? " is-copied" : ""}`}
          onClick={onCopy}
          disabled={!code}
        >
          {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      <p className="inst-sr-only" aria-live="polite">{copyState === "copied" ? "Invite code copied" : ""}</p>

      <form method="dialog" className="inst-dialog-actions">
        <button type="submit" className="inst-btn inst-btn--primary">Done</button>
      </form>
    </dialog>
  );
});

export default InviteDialog;
