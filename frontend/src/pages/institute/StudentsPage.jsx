import { useEffect, useMemo, useState } from "react";
import Icon from "./InstituteIcons";
import BulkUploadDialog from "./BulkUploadDialog";
import StudentFormDialog from "./StudentFormDialog";
import StudentProfileDrawer from "./StudentProfileDrawer";
import useModalDialog from "./useModalDialog";
import { sampleDashboard } from "./sampleData";
import {
  addStudent, getClassOptions, importStudents, levelFor, listStudents, resendInvite, setStudentStatus, updateStudent,
} from "./studentsData";
import {
  STATUS_LABELS, avatarTone, formatXp, initials, relativeTime,
} from "./studentFormat";
import "./Students.css";

const PAGE_SIZE = 10;
const WEEK = 7 * 24 * 60 * 60 * 1000;

const COLUMNS = [
  { key: "name", label: "Student" },
  { key: "class", label: "Class" },
  { key: "xp", label: "XP" },
  { key: "progress", label: "Progress" },
  { key: "avgScore", label: "Score" },
  { key: "lastActive", label: "Last active" },
  { key: "status", label: "Status", sortable: false },
];

const STATUS_FILTERS = [
  { key: "all", label: "All students", icon: "students" },
  { key: "active", label: "Active", icon: "completion" },
  { key: "invited", label: "Invited", icon: "mail" },
  { key: "deactivated", label: "Deactivated", icon: "ban" },
];

function scoreTone(score) {
  if (score == null) return "none";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

// Page numbers with gaps, e.g. 1 … 4 5 6 … 25
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ["gap-" + p, p] : [p]));
}

function ConfirmDeactivate({ student, onConfirm, onClose }) {
  const ref = useModalDialog(onClose);
  return (
    <dialog ref={ref} className="inst-dialog stu-dialog" aria-labelledby="stu-confirm-title">
      <span className="stu-confirm-icon" aria-hidden="true"><Icon name="ban" size={22} /></span>
      <h2 id="stu-confirm-title" className="inst-card-title">Deactivate {student.name}?</h2>
      <p className="inst-subtitle">
        They won't be able to sign in or join challenges. Their XP, scores and history are kept,
        and you can reactivate them at any time.
      </p>
      <div className="inst-dialog-actions">
        <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
        <button
          type="button" className="inst-btn stu-btn-danger"
          onClick={() => { onConfirm(student); ref.current?.close(); }}
        >
          Deactivate
        </button>
      </div>
    </dialog>
  );
}

export default function StudentsPage() {
  // The roster lives in studentsData; this copy is re-read after every change.
  const [students, setStudents] = useState(listStudents);
  const [now] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(null); // { mode: "add" | "edit", student? }
  const [bulkOpen, setBulkOpen] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState(null);

  const instituteName = sampleDashboard.institute_name;
  const grades = useMemo(() => getClassOptions(), []);
  const gradeOrder = useMemo(
    () => Object.fromEntries(grades.flatMap((g, gi) => g.sections.map((s, si) => [s.id, gi * 100 + si]))),
    [grades],
  );

  const counts = useMemo(() => {
    const c = { all: students.length, active: 0, invited: 0, deactivated: 0, activeWeek: 0 };
    const weekAgo = now - WEEK;
    for (const s of students) {
      c[s.status] += 1;
      if (s.status === "active" && s.lastActive >= weekAgo) c.activeWeek += 1;
    }
    return c;
  }, [students, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = students.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (classFilter && s.gradeId !== classFilter && s.sectionId !== classFilter) return false;
      return !q || s.name.toLowerCase().includes(q) || s.email.includes(q);
    });
    const value = {
      name: (s) => s.name.toLowerCase(),
      class: (s) => gradeOrder[s.sectionId] ?? 9999,
      xp: (s) => s.xp,
      progress: (s) => s.progress,
      avgScore: (s) => s.avgScore ?? -1,
      lastActive: (s) => s.lastActive ?? 0,
    }[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return a.name.localeCompare(b.name);
    });
  }, [students, query, classFilter, statusFilter, sort, gradeOrder]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const profile = profileId ? students.find((s) => s.id === profileId) : null;
  const hasFilters = query || classFilter || statusFilter !== "all";

  // Any change to what's listed goes back to the first page.
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeQuery = withReset(setQuery);
  const changeClass = withReset(setClassFilter);
  const changeStatus = withReset(setStatusFilter);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = (message) => {
    setStudents(listStudents());
    if (message) setToast((t) => ({ id: (t?.id ?? 0) + 1, message }));
  };

  const toggleSort = (key) => {
    setSort((s) => (s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "name" || key === "class" ? "asc" : "desc" }));
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setClassFilter("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSave = (fields, { sendInvite }) => {
    if (form.mode === "edit") {
      updateStudent(form.student.id, fields);
      refresh(`Saved changes to ${fields.name.trim()}.`);
    } else {
      addStudent(fields, { sendInvite });
      refresh(sendInvite ? `Invite sent to ${fields.email.trim().toLowerCase()}.` : `${fields.name.trim()} added.`);
    }
  };

  const handleImport = (rowsToAdd, { sendInvite }) => {
    const n = importStudents(rowsToAdd, { sendInvite });
    refresh(`Imported ${n} student${n === 1 ? "" : "s"}${sendInvite ? " and sent invites" : ""}.`);
  };

  const toggleStatus = (student) => {
    if (student.status === "deactivated") {
      setStudentStatus(student.id, student.joinedOn ? "active" : "invited");
      refresh(`${student.name} reactivated.`);
    } else {
      setConfirming(student);
    }
  };

  const handleResend = (student) => {
    resendInvite(student.id);
    refresh(`Invite ${student.inviteSent === false ? "sent" : "resent"} to ${student.email}.`);
  };

  return (
    <div className="stu-page">
      <header className="stu-page-head">
        <div>
          <p className="stu-eyebrow">Manage</p>
          <h1 className="inst-title">Students</h1>
          <p className="inst-subtitle">Everyone enrolled at {instituteName}: their progress, scores and access.</p>
        </div>
        <div className="stu-head-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => setBulkOpen(true)}>
            <Icon name="upload" size={16} /> Bulk upload
          </button>
          <button type="button" className="inst-btn inst-btn--primary" onClick={() => setForm({ mode: "add" })}>
            <Icon name="plus" size={18} strokeWidth={2.4} /> Add student
          </button>
        </div>
      </header>

      <div className="stu-tiles" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`stu-tile stu-tile--${f.key}${statusFilter === f.key ? " is-on" : ""}`}
            aria-pressed={statusFilter === f.key}
            onClick={() => changeStatus(f.key)}
          >
            <span className="stu-tile-icon"><Icon name={f.icon} size={18} /></span>
            <span className="stu-tile-text">
              <span>{f.label}</span>
              <strong>{counts[f.key]}</strong>
              <small>
                {f.key === "all" && `Across ${grades.length} grades`}
                {f.key === "active" && `${counts.activeWeek} active this week`}
                {f.key === "invited" && "Waiting to sign up"}
                {f.key === "deactivated" && "Access paused"}
              </small>
            </span>
          </button>
        ))}
      </div>

      <section className="inst-card stu-list" aria-labelledby="stu-list-title">
        <div className="stu-toolbar">
          <h2 id="stu-list-title" className="inst-sr-only">All students</h2>
          <label className="stu-search">
            <Icon name="search" size={18} />
            <span className="inst-sr-only">Search students</span>
            <input
              type="search" value={query} placeholder="Search by name or email"
              onChange={(e) => changeQuery(e.target.value)}
            />
          </label>
          <label className="stu-select">
            <span className="inst-sr-only">Class</span>
            <select value={classFilter} onChange={(e) => changeClass(e.target.value)}>
              <option value="">All classes</option>
              {grades.map((g) => (
                <optgroup key={g.id} label={g.name}>
                  <option value={g.id}>All of {g.name}</option>
                  {g.sections.map((s) => <option key={s.id} value={s.id}>{g.name} · {s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <span className="stu-results" aria-live="polite">
            {filtered.length === students.length ? `${students.length} students` : `${filtered.length} of ${students.length} students`}
          </span>
          {hasFilters && (
            <button type="button" className="stu-clear" onClick={clearFilters}>Clear filters</button>
          )}
        </div>

        <div className="stu-table-wrap">
          <table className="stu-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={`stu-col-${col.key}`}
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {col.sortable === false ? col.label : (
                        <button type="button" className={`stu-sort${active ? " is-active" : ""}`} onClick={() => toggleSort(col.key)}>
                          {col.label}
                          <Icon name={active ? (sort.dir === "asc" ? "sortUp" : "sortDown") : "sort"} size={14} />
                        </button>
                      )}
                    </th>
                  );
                })}
                <th scope="col" className="stu-col-actions"><span className="inst-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const level = levelFor(s.xp);
                return (
                  <tr key={s.id} className={s.status === "deactivated" ? "is-muted" : undefined} onClick={() => setProfileId(s.id)}>
                    <td className="stu-col-name">
                      <div className="stu-person">
                        <span className={`stu-avatar stu-avatar--${avatarTone(s.id)}`} aria-hidden="true">{initials(s.name)}</span>
                        <div>
                          <button
                            type="button" className="stu-name"
                            onClick={(e) => { e.stopPropagation(); setProfileId(s.id); }}
                          >
                            {s.name}
                          </button>
                          <span className="stu-email">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="stu-col-class">
                      <strong>{s.gradeName}</strong>
                      <small>{s.sectionName}</small>
                    </td>
                    <td className="stu-col-xp">
                      <strong>{formatXp(s.xp)}</strong>
                      <small title={level.title}>Level {level.level}</small>
                    </td>
                    <td className="stu-col-progress">
                      <div className="stu-progress">
                        <span className="stu-progress-track"><span style={{ width: `${s.progress}%` }} /></span>
                        <span>{s.progress}%</span>
                      </div>
                    </td>
                    <td className="stu-col-avgScore">
                      <span className={`stu-score stu-score--${scoreTone(s.avgScore)}`}>{s.avgScore ?? "—"}</span>
                    </td>
                    <td className="stu-col-lastActive">
                      {s.status === "invited" ? <span className="stu-muted">Invited {relativeTime(s.invitedOn).toLowerCase()}</span> : relativeTime(s.lastActive)}
                    </td>
                    <td className="stu-col-status">
                      <span className={`stu-status stu-status--${s.status}`}>{STATUS_LABELS[s.status]}</span>
                    </td>
                    <td className="stu-col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="stu-row-actions">
                        {s.status === "invited" && (
                          <button type="button" className="stu-icon-btn" title="Resend invite" aria-label={`Resend invite to ${s.name}`} onClick={() => handleResend(s)}>
                            <Icon name="mail" size={16} />
                          </button>
                        )}
                        <button type="button" className="stu-icon-btn" title="Edit" aria-label={`Edit ${s.name}`} onClick={() => setForm({ mode: "edit", student: s })}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className={`stu-icon-btn${s.status === "deactivated" ? "" : " stu-icon-btn--danger"}`}
                          title={s.status === "deactivated" ? "Reactivate" : "Deactivate"}
                          aria-label={`${s.status === "deactivated" ? "Reactivate" : "Deactivate"} ${s.name}`}
                          onClick={() => toggleStatus(s)}
                        >
                          <Icon name={s.status === "deactivated" ? "restore" : "ban"} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!rows.length && (
            <div className="stu-empty">
              <span className="stu-drop-icon"><Icon name="search" size={22} /></span>
              <strong>No students match these filters</strong>
              <span>Try a different name, class or status.</span>
              {hasFilters && <button type="button" className="inst-btn inst-btn--outline" onClick={clearFilters}>Clear filters</button>}
            </div>
          )}
        </div>

        {filtered.length > PAGE_SIZE && (
          <nav className="stu-pager" aria-label="Pages">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div>
              <button type="button" className="stu-page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <Icon name="chevronLeft" size={16} />
              </button>
              {pageList(currentPage, pageCount).map((p) => (typeof p === "string"
                ? <span key={p} className="stu-page-gap">…</span>
                : (
                  <button
                    key={p} type="button"
                    className={`stu-page-btn${p === currentPage ? " is-current" : ""}`}
                    aria-current={p === currentPage ? "page" : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )))}
              <button type="button" className="stu-page-btn" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <Icon name="chevron" size={16} />
              </button>
            </div>
          </nav>
        )}
      </section>

      {profile && (
        <StudentProfileDrawer
          student={profile}
          onEdit={(s) => setForm({ mode: "edit", student: s })}
          onToggleStatus={toggleStatus}
          onResend={handleResend}
          onClose={() => setProfileId(null)}
        />
      )}
      {form && (
        <StudentFormDialog
          mode={form.mode} student={form.student} instituteName={instituteName}
          onSubmit={handleSave} onClose={() => setForm(null)}
        />
      )}
      {bulkOpen && <BulkUploadDialog onImport={handleImport} onClose={() => setBulkOpen(false)} />}
      {confirming && (
        <ConfirmDeactivate
          student={confirming}
          onConfirm={(s) => { setStudentStatus(s.id, "deactivated"); refresh(`${s.name} deactivated.`); }}
          onClose={() => setConfirming(null)}
        />
      )}

      <div className="stu-toast-region" role="status">
        {toast && (
          <div key={toast.id} className="stu-toast">
            <Icon name="check" size={16} /> {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
