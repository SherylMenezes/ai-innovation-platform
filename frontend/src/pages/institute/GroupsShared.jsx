import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { STAFF, staffById } from "./groupsData";
import { avatarTone, initials } from "./studentFormat";

// One row in a "Staff" block: who holds a role, with a picker to change it.
export function StaffRow({ label, hint, staffId, onChange, id }) {
  const person = staffById(staffId);
  return (
    <div className="grp-staff-row">
      <span className={`stu-avatar ${person ? `stu-avatar--${avatarTone(person.id)}` : "grp-avatar-empty"}`} aria-hidden="true">
        {person ? initials(person.name) : <Icon name="students" size={16} />}
      </span>
      <div className="grp-staff-text">
        <label htmlFor={id}>{label}</label>
        <span>{person ? `${person.name} · ${person.subject}` : hint}</span>
      </div>
      <select id={id} value={staffId ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Not assigned</option>
        {STAFF.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
      </select>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onClose }) {
  const ref = useModalDialog(onClose);
  return (
    <dialog ref={ref} className="inst-dialog stu-dialog" aria-labelledby="grp-confirm-title">
      <span className="stu-confirm-icon" aria-hidden="true"><Icon name="alert" size={22} /></span>
      <h2 id="grp-confirm-title" className="inst-card-title">{title}</h2>
      <p className="inst-subtitle">{body}</p>
      <div className="inst-dialog-actions">
        <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
        <button type="button" className="inst-btn stu-btn-danger" onClick={() => { onConfirm(); ref.current?.close(); }}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

// Section picker grouped by grade; `exclude` hides the section the students are already in.
export function SectionSelect({ grades, value, onChange, exclude, id, placeholder = "Choose a section" }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {grades.map((g) => (
        <optgroup key={g.id} label={g.name}>
          {g.sections.filter((s) => s.id !== exclude).map((s) => (
            <option key={s.id} value={s.id}>{g.name} · {s.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
