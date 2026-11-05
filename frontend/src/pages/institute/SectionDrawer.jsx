import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { SectionSelect, StaffRow } from "./GroupsShared";
import { average, getSectionStaff, setSectionStaff, staffById } from "./groupsData";
import { moveStudents } from "./studentsData";
import { STATUS_LABELS, avatarTone, initials } from "./studentFormat";

// Detail view for one section: its staff, its students, and moving students elsewhere.
export default function SectionDrawer({ grade, section, grades, students, onChanged, onClose }) {
  const ref = useModalDialog(onClose);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [target, setTarget] = useState("");

  const staff = getSectionStaff(section.id);
  const members = students.filter((s) => s.sectionId === section.id).sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const shown = q ? members.filter((s) => s.name.toLowerCase().includes(q) || s.email.includes(q)) : members;
  const allShownSelected = shown.length > 0 && shown.every((s) => selected.has(s.id));
  const label = `${grade.name} · ${section.name}`;

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    shown.forEach((s) => (allShownSelected ? next.delete(s.id) : next.add(s.id)));
    return next;
  });

  const changeStaff = (role, staffId) => {
    setSectionStaff(section.id, role, staffId);
    const who = staffById(staffId);
    const roleName = role === "classTeacherId" ? "class teacher" : "mentor";
    onChanged(who ? `${who.name} is now ${label}'s ${roleName}.` : `Removed ${label}'s ${roleName}.`);
  };

  const move = () => {
    const destination = grades.flatMap((g) => g.sections.map((s) => ({ ...s, grade: g }))).find((s) => s.id === target);
    const moved = moveStudents([...selected], target);
    setSelected(new Set());
    setTarget("");
    onChanged(`Moved ${moved} student${moved === 1 ? "" : "s"} to ${destination.grade.name} · ${destination.name}.`);
  };

  return (
    <dialog
      ref={ref} className="stu-drawer" aria-labelledby="grp-section-title"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}
    >
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
          <span className="grp-section-badge grp-section-badge--lg" aria-hidden="true">{section.name.replace(/^section\s*/i, "").slice(0, 2)}</span>
          <div className="stu-drawer-id">
            <h2 id="grp-section-title">{label}</h2>
            <p>{members.length} student{members.length === 1 ? "" : "s"}</p>
          </div>
        </header>

        <div className="stu-drawer-body">
          <section className="stu-kpis" aria-label="Summary">
            <div><span>Students</span><strong>{members.length}</strong><small>{members.filter((s) => s.status === "invited").length} invited</small></div>
            <div><span>Active</span><strong>{members.filter((s) => s.status === "active").length}</strong><small>{members.filter((s) => s.status === "deactivated").length} deactivated</small></div>
            <div><span>Avg progress</span><strong>{average(members.map((s) => s.status === "invited" ? null : s.progress)) ?? "—"}{members.length ? "%" : ""}</strong><small>Across assigned challenges</small></div>
            <div><span>Avg score</span><strong>{average(members.map((s) => s.avgScore)) ?? "—"}</strong><small>AI evaluation</small></div>
          </section>

          <section className="stu-section">
            <h3>Staff</h3>
            <p className="stu-section-sub">The class teacher manages the section; the mentor guides students through challenges.</p>
            <div className="grp-staff">
              <StaffRow
                id="grp-class-teacher" label="Class teacher" hint="No class teacher yet"
                staffId={staff.classTeacherId} onChange={(id) => changeStaff("classTeacherId", id)}
              />
              <StaffRow
                id="grp-section-mentor" label="Mentor" hint="No mentor yet"
                staffId={staff.mentorId} onChange={(id) => changeStaff("mentorId", id)}
              />
            </div>
          </section>

          <section className="stu-section">
            <h3>Students <span className="stu-count">{members.length}</span></h3>
            {members.length ? (
              <>
                <div className="grp-list-tools">
                  <label className="stu-search">
                    <Icon name="search" size={16} />
                    <span className="inst-sr-only">Search this section</span>
                    <input type="search" value={query} placeholder="Search this section" onChange={(e) => setQuery(e.target.value)} />
                  </label>
                  <label className="grp-check-all">
                    <input type="checkbox" checked={allShownSelected} onChange={toggleAll} disabled={!shown.length} />
                    Select all{q ? " shown" : ""}
                  </label>
                </div>
                <ul className="grp-people">
                  {shown.map((s) => (
                    <li key={s.id}>
                      <label className={selected.has(s.id) ? "is-selected" : undefined}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                        <span className={`stu-avatar stu-avatar--${avatarTone(s.id)}`} aria-hidden="true">{initials(s.name)}</span>
                        <span className="grp-person-text">
                          <strong>{s.name}</strong>
                          <small>{s.email}</small>
                        </span>
                        <span className={`stu-status stu-status--${s.status}`}>{STATUS_LABELS[s.status]}</span>
                      </label>
                    </li>
                  ))}
                  {!shown.length && <li className="stu-muted grp-none">No students match "{query}".</li>}
                </ul>
              </>
            ) : (
              <p className="stu-muted">No students in this section yet. Move students here from another section, or add them from the Students page.</p>
            )}
          </section>
        </div>

        <footer className="stu-drawer-foot grp-move-bar">
          {selected.size ? (
            <>
              <span className="grp-selected">{selected.size} selected</span>
              <label className="inst-sr-only" htmlFor="grp-move-target">Move to</label>
              <SectionSelect id="grp-move-target" grades={grades} value={target} onChange={setTarget} exclude={section.id} placeholder="Move to…" />
              <button type="button" className="inst-btn inst-btn--primary" disabled={!target} onClick={move}>Move</button>
            </>
          ) : (
            <span className="stu-muted">Select students to move them to another section.</span>
          )}
        </footer>
      </div>
    </dialog>
  );
}
