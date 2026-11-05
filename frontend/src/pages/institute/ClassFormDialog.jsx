import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// "Section A", "Section B" -> "Section C"
function nextSectionName(sections) {
  const used = new Set(sections.map((s) => s.name.toLowerCase()));
  for (const letter of LETTERS) {
    if (!used.has(`section ${letter.toLowerCase()}`)) return `Section ${letter}`;
  }
  return "";
}

// mode "grade": a new grade plus 0–10 lettered sections. mode "section": one section in a grade.
// onSubmit returns nothing on success; the dialog then closes itself.
export default function ClassFormDialog({ mode, grades, defaultGradeId, onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const isGrade = mode === "grade";
  const startGrade = grades.find((g) => g.id === defaultGradeId) ?? grades[0];

  const [gradeName, setGradeName] = useState("");
  const [sectionCount, setSectionCount] = useState("2");
  const [gradeId, setGradeId] = useState(startGrade?.id ?? "");
  const [sectionName, setSectionName] = useState(() => (startGrade ? nextSectionName(startGrade.sections) : "Section A"));
  const [error, setError] = useState("");

  const grade = grades.find((g) => g.id === gradeId);

  const submit = (e) => {
    e.preventDefault();
    if (isGrade) {
      const name = gradeName.trim();
      const count = Number(sectionCount);
      if (name.length < 2) return setError("Enter a grade name, for example Grade 7.");
      if (grades.some((g) => g.name.toLowerCase() === name.toLowerCase())) return setError(`${name} already exists.`);
      if (!Number.isInteger(count) || count < 0 || count > 10) return setError("Sections to create must be a whole number from 0 to 10.");
      onSubmit({ gradeName: name, sectionNames: Array.from({ length: count }, (_, i) => `Section ${LETTERS[i]}`) });
    } else {
      const name = sectionName.trim();
      if (!grade) return setError("Choose a grade.");
      if (!name) return setError("Enter a section name.");
      if (grade.sections.some((s) => s.name.toLowerCase() === name.toLowerCase())) return setError(`${grade.name} already has ${name}.`);
      onSubmit({ gradeId: grade.id, sectionName: name });
    }
    ref.current?.close();
  };

  const count = Number(sectionCount);
  const preview = Number.isInteger(count) && count > 0 && count <= 10
    ? Array.from({ length: count }, (_, i) => `Section ${LETTERS[i]}`).join(", ")
    : "";

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog" aria-labelledby="grp-class-title">
      <form onSubmit={submit} noValidate>
        <div className="stu-dialog-head">
          <div>
            <h2 id="grp-class-title" className="inst-card-title">{isGrade ? "Add a grade" : "Add a section"}</h2>
            <p className="inst-subtitle">
              {isGrade ? "Create a new grade and, if you like, its first sections." : "Create a new section inside a grade."}
            </p>
          </div>
          <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="stu-form-grid">
          {isGrade ? (
            <>
              <label className="inst-field">
                <span>Grade name</span>
                <input
                  type="text" value={gradeName} maxLength={40} placeholder="e.g. Grade 7"
                  onChange={(e) => { setGradeName(e.target.value); setError(""); }}
                />
              </label>
              <label className="inst-field">
                <span>Sections to create</span>
                <input
                  type="number" min={0} max={10} step={1} value={sectionCount}
                  onChange={(e) => { setSectionCount(e.target.value); setError(""); }}
                />
              </label>
            </>
          ) : (
            <>
              <label className="inst-field">
                <span>Grade</span>
                <select
                  value={gradeId}
                  onChange={(e) => {
                    setGradeId(e.target.value);
                    setSectionName(nextSectionName(grades.find((g) => g.id === e.target.value)?.sections ?? []));
                    setError("");
                  }}
                >
                  {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="inst-field">
                <span>Section name</span>
                <input
                  type="text" value={sectionName} maxLength={40} placeholder="e.g. Section C"
                  onChange={(e) => { setSectionName(e.target.value); setError(""); }}
                />
              </label>
            </>
          )}
        </div>

        <p className="inst-form-hint grp-form-hint">
          {isGrade
            ? preview ? `Creates ${preview}.` : "No sections yet. You can add them later."
            : grade && `${grade.name} has ${grade.sections.length ? grade.sections.map((s) => s.name).join(", ") : "no sections yet"}.`}
        </p>

        {error && <p className="inst-form-error" role="alert">{error}</p>}

        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">{isGrade ? "Add grade" : "Add section"}</button>
        </div>
      </form>
    </dialog>
  );
}
