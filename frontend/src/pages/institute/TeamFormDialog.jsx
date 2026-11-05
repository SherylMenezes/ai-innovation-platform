import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { SectionSelect } from "./GroupsShared";
import { STAFF, teamNameTaken, teamOf } from "./groupsData";
import { avatarTone, initials } from "./studentFormat";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 8;

// Create or edit a team: name, members (one team per student), leader and mentor.
// onSubmit({ name, memberIds, leaderId, mentorId }) saves; the dialog then closes itself.
export default function TeamFormDialog({ team, students, grades, onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const isEdit = Boolean(team);
  const firstMember = team ? students.find((s) => s.id === team.memberIds[0]) : null;

  const [name, setName] = useState(team?.name ?? "");
  const [memberIds, setMemberIds] = useState(() => team?.memberIds ?? []);
  const [leaderId, setLeaderId] = useState(team?.leaderId ?? "");
  const [mentorId, setMentorId] = useState(team?.mentorId ?? "");
  // Editing starts on the team's own section; a new team starts with every class listed.
  const [classFilter, setClassFilter] = useState(firstMember?.sectionId ?? "");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const byId = new Map(students.map((s) => [s.id, s]));
  const members = memberIds.map((id) => byId.get(id)).filter(Boolean);
  const q = query.trim().toLowerCase();
  const candidates = students
    .filter((s) => s.status === "active")
    .filter((s) => !classFilter || s.sectionId === classFilter)
    .filter((s) => !q || s.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (id) => {
    setError("");
    if (memberIds.includes(id)) {
      const next = memberIds.filter((x) => x !== id);
      setMemberIds(next);
      if (leaderId === id) setLeaderId(next[0] ?? "");
      return;
    }
    if (memberIds.length >= MAX_MEMBERS) {
      setError(`A team can have at most ${MAX_MEMBERS} members.`);
      return;
    }
    setMemberIds([...memberIds, id]);
    if (!leaderId) setLeaderId(id);
  };

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Give the team a name.");
    if (teamNameTaken(name, team?.id)) return setError(`There's already a team called ${name.trim()}.`);
    if (memberIds.length < MIN_MEMBERS) return setError(`Pick at least ${MIN_MEMBERS} members.`);
    if (!memberIds.includes(leaderId)) return setError("Choose a team leader from the members.");
    onSubmit({ name, memberIds, leaderId, mentorId: mentorId || null });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="grp-team-form-title">
      <form onSubmit={submit} noValidate>
        <div className="stu-dialog-head">
          <div>
            <h2 id="grp-team-form-title" className="inst-card-title">{isEdit ? "Edit team" : "Create a team"}</h2>
            <p className="inst-subtitle">Pick {MIN_MEMBERS}–{MAX_MEMBERS} students, choose a leader, and assign a mentor. Each student can be in one team.</p>
          </div>
          <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="grp-team-form">
          <div className="grp-team-picker">
            <label className="inst-field">
              <span>Team name</span>
              <input
                type="text" value={name} maxLength={40} placeholder="e.g. Green Circuit"
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </label>

            <div className="grp-picker-tools">
              <label className="stu-search">
                <Icon name="search" size={16} />
                <span className="inst-sr-only">Search students</span>
                <input type="search" value={query} placeholder="Search students" onChange={(e) => setQuery(e.target.value)} />
              </label>
              <label className="stu-select">
                <span className="inst-sr-only">Class</span>
                <SectionSelect grades={grades} value={classFilter} onChange={setClassFilter} placeholder="All classes" />
              </label>
            </div>

            <ul className="grp-people grp-people--picker" aria-label="Students">
              {candidates.map((s) => {
                const otherTeam = teamOf(s.id, team?.id);
                const checked = memberIds.includes(s.id);
                return (
                  <li key={s.id}>
                    <label className={`${checked ? "is-selected" : ""}${otherTeam ? " is-disabled" : ""}`}>
                      <input type="checkbox" checked={checked} disabled={Boolean(otherTeam)} onChange={() => toggle(s.id)} />
                      <span className={`stu-avatar stu-avatar--${avatarTone(s.id)}`} aria-hidden="true">{initials(s.name)}</span>
                      <span className="grp-person-text">
                        <strong>{s.name}</strong>
                        <small>{otherTeam ? `Already in ${otherTeam.name}` : `${s.gradeName} · ${s.sectionName}`}</small>
                      </span>
                    </label>
                  </li>
                );
              })}
              {!candidates.length && <li className="stu-muted grp-none">No active students match.</li>}
            </ul>
          </div>

          <div className="grp-team-summary">
            <h3>Members <span className="stu-count">{members.length}/{MAX_MEMBERS}</span></h3>
            {members.length ? (
              <ul className="grp-chips">
                {members.map((m) => (
                  <li key={m.id}>
                    <span className={`stu-avatar stu-avatar--${avatarTone(m.id)}`} aria-hidden="true">{initials(m.name)}</span>
                    {m.name}
                    {m.id === leaderId && <Icon name="star" size={14} />}
                    <button type="button" aria-label={`Remove ${m.name}`} onClick={() => toggle(m.id)}><Icon name="close" size={14} /></button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="stu-muted">Tick students on the left to add them.</p>
            )}

            <label className="inst-field">
              <span>Team leader</span>
              <select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} disabled={!members.length}>
                {!members.length && <option value="">Add members first</option>}
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>

            <label className="inst-field">
              <span>Mentor</span>
              <select value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
                <option value="">Not assigned</option>
                {STAFF.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
            </label>
          </div>
        </div>

        {error && <p className="inst-form-error" role="alert">{error}</p>}

        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">{isEdit ? "Save team" : "Create team"}</button>
        </div>
      </form>
    </dialog>
  );
}
