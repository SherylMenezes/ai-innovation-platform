import { forwardRef, useMemo, useState } from "react";

const MAX_STUDENTS = 200;

// groupOptions is depth-ordered: each depth-0 grade is followed by its depth-1 sections.
function buildGrades(groupOptions) {
  const grades = [];
  for (const g of groupOptions) {
    if (g.depth === 0) grades.push({ ...g, sections: [] });
    else if (g.depth === 1 && grades.length) {
      const grade = grades[grades.length - 1];
      const name = g.name.startsWith(grade.name) ? g.name.slice(grade.name.length).trim() : g.name;
      grade.sections.push(name);
    }
  }
  return grades;
}

// "Section A", "Section B" -> "Section C"
function suggestName(sections) {
  const used = new Set(sections.map((s) => s.toLowerCase()));
  for (let i = 0; i < 26; i++) {
    const name = `Section ${String.fromCharCode(65 + i)}`;
    if (!used.has(name.toLowerCase())) return name;
  }
  return "";
}

// onAdd(gradeId, name, studentCount) returns an error message, or nothing on success.
// The parent remounts this (new key) on every open, so the form always starts fresh.
const AddSectionDialog = forwardRef(function AddSectionDialog({ groupOptions, defaultGradeId, onAdd }, ref) {
  const grades = useMemo(() => buildGrades(groupOptions), [groupOptions]);
  const startGrade = grades.find((g) => g.id === defaultGradeId) ?? grades[0];
  const [gradeId, setGradeId] = useState(startGrade?.id ?? "");
  const [name, setName] = useState(() => (startGrade ? suggestName(startGrade.sections) : ""));
  const [students, setStudents] = useState("");
  const [error, setError] = useState("");

  const grade = grades.find((g) => g.id === gradeId);

  const changeGrade = (id) => {
    const next = grades.find((g) => g.id === id);
    setGradeId(id);
    setName(next ? suggestName(next.sections) : "");
    setError("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const count = Number(students);
    if (!grade) return setError("Pick a grade.");
    if (!trimmed) return setError("Enter a section name.");
    if (grade.sections.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`${grade.name} already has ${trimmed}.`);
    }
    if (!Number.isInteger(count) || count < 1 || count > MAX_STUDENTS) {
      return setError(`Number of students must be a whole number from 1 to ${MAX_STUDENTS}.`);
    }
    const failure = onAdd(grade.id, trimmed, count);
    if (failure) return setError(failure);
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog" aria-labelledby="inst-add-section-title">
      <form onSubmit={onSubmit} noValidate>
        <h2 id="inst-add-section-title" className="inst-card-title">Add a section</h2>
        <p className="inst-subtitle">Create a new section under a grade and set how many students it has.</p>

        <div className="inst-invite-fields">
          <label className="inst-field">
            <span>Grade</span>
            <select value={gradeId} onChange={(e) => changeGrade(e.target.value)} disabled={!grades.length}>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="inst-field">
            <span>Section name</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Section C"
            />
          </label>
          <label className="inst-field inst-field--full">
            <span>Number of students</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_STUDENTS}
              step={1}
              value={students}
              onChange={(e) => { setStudents(e.target.value); setError(""); }}
              placeholder="e.g. 30"
            />
          </label>
        </div>

        {grade && (
          <p className="inst-form-hint">
            {grade.name} currently has {grade.sections.length
              ? `${grade.sections.length} section${grade.sections.length === 1 ? "" : "s"}: ${grade.sections.join(", ")}`
              : "no sections"}.
          </p>
        )}

        {error && <p className="inst-form-error" role="alert">{error}</p>}

        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="inst-btn inst-btn--primary">Add section</button>
        </div>
      </form>
    </dialog>
  );
});

export default AddSectionDialog;
