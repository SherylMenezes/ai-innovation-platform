import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { emailTaken, getClassOptions } from "./studentsData";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEMPLATE = "name,email,grade,section\nAarav Mehta,aarav.mehta@school.edu,Grade 10,Section A\nDiya Nair,diya.nair@school.edu,Grade 9,B\n";

const COLUMN_ALIASES = {
  name: ["name", "fullname", "studentname"],
  email: ["email", "emailaddress", "mail"],
  grade: ["grade", "class", "standard"],
  section: ["section", "division", "div"],
};

// Minimal RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function readRows(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv") return parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (ext === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    return readSheet(file);
  }
  throw new Error(ext === "xls"
    ? "Old .xls files aren't supported. Save it as .xlsx or .csv and try again."
    : "Upload a .csv or .xlsx file.");
}

const normalise = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function findGrade(grades, value) {
  const key = normalise(value);
  return grades.find((g) => normalise(g.name) === key || normalise(g.name).replace("grade", "") === key);
}

function findSection(grade, value) {
  const key = normalise(value);
  return grade?.sections.find((s) => normalise(s.name) === key || normalise(s.name).replace("section", "") === key);
}

// Turns raw sheet rows into checked students: { line, name, email, grade, section, gradeId, sectionId, error }.
function checkRows(rawRows) {
  const [header = [], ...body] = rawRows;
  const columns = {};
  header.forEach((cell, i) => {
    const key = normalise(cell);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(key) && columns[field] === undefined) columns[field] = i;
    }
  });
  const missing = Object.keys(COLUMN_ALIASES).filter((f) => columns[f] === undefined);
  if (missing.length) {
    throw new Error(`The first row needs these column headings: name, email, grade, section. Missing: ${missing.join(", ")}.`);
  }

  const grades = getClassOptions();
  const seen = new Set();
  const checked = [];
  body.forEach((cells, i) => {
    const cell = (field) => String(cells[columns[field]] ?? "").trim();
    const row = { line: i + 2, name: cell("name"), email: cell("email").toLowerCase(), grade: cell("grade"), section: cell("section") };
    if (!row.name && !row.email && !row.grade && !row.section) return;

    const grade = findGrade(grades, row.grade);
    const section = findSection(grade, row.section);
    if (row.name.length < 2) row.error = "Name is missing";
    else if (!EMAIL_PATTERN.test(row.email)) row.error = "Email isn't valid";
    else if (seen.has(row.email)) row.error = "Email appears twice in this file";
    else if (emailTaken(row.email)) row.error = "A student with this email already exists";
    else if (!grade) row.error = `No grade called "${row.grade || "(blank)"}"`;
    else if (!section) row.error = `${grade.name} has no section "${row.section || "(blank)"}"`;
    else {
      row.gradeId = grade.id;
      row.sectionId = section.id;
      row.grade = grade.name;
      row.section = section.name;
    }
    seen.add(row.email);
    checked.push(row);
  });
  if (checked.length > MAX_ROWS) throw new Error(`This file has ${checked.length} students. Upload at most ${MAX_ROWS} at a time.`);
  if (!checked.length) throw new Error("The file has headings but no students under them.");
  return checked;
}

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "students-template.csv" });
  link.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadDialog({ onImport, onClose }) {
  const ref = useModalDialog(onClose);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);

  const ready = rows?.filter((r) => !r.error) ?? [];
  const problems = rows?.filter((r) => r.error) ?? [];
  const shown = onlyProblems ? problems : rows ?? [];

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setRows(null);
    setOnlyProblems(false);
    setFileName(file.name);
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 5 MB. Split it into smaller files.");
      return;
    }
    setBusy(true);
    try {
      setRows(checkRows(await readRows(file)));
    } catch (e) {
      setError(e.message || "We couldn't read that file.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setRows(null);
    setError("");
    setFileName("");
  };

  const importReady = () => {
    onImport(ready, { sendInvite });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="stu-bulk-title">
      <div className="stu-dialog-head">
        <div>
          <h2 id="stu-bulk-title" className="inst-card-title">Bulk upload students</h2>
          <p className="inst-subtitle">Import a CSV or Excel (.xlsx) file. You'll review every row before anything is added.</p>
        </div>
        <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
          <Icon name="close" size={18} />
        </button>
      </div>

      {!rows && (
        <>
          <label
            className={`stu-drop${dragging ? " is-dragging" : ""}${busy ? " is-busy" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input
              type="file" accept=".csv,.xlsx" className="inst-sr-only"
              onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
            />
            <span className="stu-drop-icon"><Icon name="upload" size={24} /></span>
            <strong>{busy ? `Reading ${fileName}…` : "Drop your file here, or click to browse"}</strong>
            <small>.csv or .xlsx · up to 5 MB · up to {MAX_ROWS} students</small>
          </label>

          {error && (
            <p className="inst-form-error stu-inline-icon" role="alert">
              <Icon name="alert" size={16} /> {fileName && <strong>{fileName}:</strong>} {error}
            </p>
          )}

          <div className="stu-template">
            <div>
              <strong>Columns needed</strong>
              <span>name, email, grade, section. Grade can be "Grade 10" or "10"; section can be "Section A" or "A".</span>
            </div>
            <button type="button" className="inst-btn inst-btn--outline" onClick={downloadTemplate}>
              <Icon name="download" size={16} /> Template
            </button>
          </div>
        </>
      )}

      {rows && (
        <>
          <div className="stu-review-bar">
            <span className="stu-file"><Icon name="file" size={16} /> {fileName}</span>
            <span className="stu-chip stu-chip--ok"><Icon name="check" size={14} /> {ready.length} ready</span>
            {problems.length > 0 && (
              <button
                type="button" className={`stu-chip stu-chip--warn${onlyProblems ? " is-on" : ""}`}
                aria-pressed={onlyProblems} onClick={() => setOnlyProblems((v) => !v)}
              >
                <Icon name="alert" size={14} /> {problems.length} need fixing
              </button>
            )}
          </div>

          <div className="stu-review-table" role="region" aria-label="Rows in the file" tabIndex={0}>
            <table>
              <thead>
                <tr><th>Row</th><th>Name</th><th>Email</th><th>Class</th><th>Check</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.line} className={r.error ? "has-error" : undefined}>
                    <td className="stu-muted">{r.line}</td>
                    <td>{r.name || <span className="stu-muted">—</span>}</td>
                    <td>{r.email || <span className="stu-muted">—</span>}</td>
                    <td>{[r.grade, r.section].filter(Boolean).join(" · ") || <span className="stu-muted">—</span>}</td>
                    <td>
                      {r.error
                        ? <span className="stu-row-error"><Icon name="alert" size={14} /> {r.error}</span>
                        : <span className="stu-row-ok"><Icon name="check" size={14} /> Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {problems.length > 0 && (
            <p className="inst-form-hint">
              Rows that need fixing will be skipped. Correct them in your file and upload it again to add them.
            </p>
          )}

          <label className="stu-check">
            <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
            <span>
              <strong>Send invite emails to everyone imported</strong>
              <small>Students appear as Invited until they sign up.</small>
            </span>
          </label>

          <div className="inst-dialog-actions">
            <button type="button" className="inst-btn inst-btn--outline" onClick={reset}>Choose another file</button>
            <button type="button" className="inst-btn inst-btn--primary" disabled={!ready.length} onClick={importReady}>
              Import {ready.length} student{ready.length === 1 ? "" : "s"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
