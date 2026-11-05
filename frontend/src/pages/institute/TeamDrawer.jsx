import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { StaffRow } from "./GroupsShared";
import { average, staffById, teamInitials, teamScope, updateTeam } from "./groupsData";
import { avatarTone, formatDate, formatXp, initials } from "./studentFormat";

// Detail view for one team: leader, mentor and members, with edit/delete in the footer.
export default function TeamDrawer({ team, students, onChanged, onEdit, onDelete, onClose }) {
  const ref = useModalDialog(onClose);
  const byId = new Map(students.map((s) => [s.id, s]));
  const members = team.memberIds.map((id) => byId.get(id)).filter(Boolean);
  const leader = byId.get(team.leaderId);

  const setLeader = (id) => {
    updateTeam(team.id, { leaderId: id });
    onChanged(`${byId.get(id).name} now leads ${team.name}.`);
  };

  const setMentor = (staffId) => {
    updateTeam(team.id, { mentorId: staffId });
    const who = staffById(staffId);
    onChanged(who ? `${who.name} is now mentoring ${team.name}.` : `Removed ${team.name}'s mentor.`);
  };

  const remove = (member) => {
    updateTeam(team.id, { memberIds: team.memberIds.filter((id) => id !== member.id) });
    onChanged(`Removed ${member.name} from ${team.name}.`);
  };

  return (
    <dialog
      ref={ref} className="stu-drawer" aria-labelledby="grp-team-title"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}
    >
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
          <span className="grp-team-badge grp-team-badge--lg" aria-hidden="true">{teamInitials(team.name)}</span>
          <div className="stu-drawer-id">
            <h2 id="grp-team-title">{team.name}</h2>
            <p>{teamScope(members)}</p>
            <div className="stu-drawer-meta">
              <span>{members.length} member{members.length === 1 ? "" : "s"}</span>
              <span>Created {formatDate(team.createdOn)}</span>
            </div>
          </div>
        </header>

        <div className="stu-drawer-body">
          <section className="stu-kpis" aria-label="Summary">
            <div><span>Members</span><strong>{members.length}</strong><small>Up to 8 per team</small></div>
            <div><span>Total XP</span><strong>{formatXp(members.reduce((sum, m) => sum + m.xp, 0))}</strong><small>Combined</small></div>
            <div><span>Avg progress</span><strong>{average(members.map((m) => m.progress)) ?? "—"}%</strong><small>Across challenges</small></div>
            <div><span>Avg score</span><strong>{average(members.map((m) => m.avgScore)) ?? "—"}</strong><small>AI evaluation</small></div>
          </section>

          <section className="stu-section">
            <h3>Leadership</h3>
            <p className="stu-section-sub">The leader coordinates the team; the mentor reviews their work and gives feedback.</p>
            <div className="grp-staff">
              <div className="grp-staff-row">
                <span className={`stu-avatar ${leader ? `stu-avatar--${avatarTone(leader.id)}` : "grp-avatar-empty"}`} aria-hidden="true">
                  {leader ? initials(leader.name) : <Icon name="star" size={16} />}
                </span>
                <div className="grp-staff-text">
                  <label htmlFor="grp-team-leader">Team leader</label>
                  <span>{leader ? `${leader.name} · ${leader.gradeName} · ${leader.sectionName}` : "No leader yet"}</span>
                </div>
                <select id="grp-team-leader" value={team.leaderId ?? ""} onChange={(e) => setLeader(e.target.value)} disabled={!members.length}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <StaffRow id="grp-team-mentor" label="Mentor" hint="No mentor yet" staffId={team.mentorId} onChange={setMentor} />
            </div>
          </section>

          <section className="stu-section">
            <h3>Members <span className="stu-count">{members.length}</span></h3>
            <ul className="grp-members">
              {members.map((m) => (
                <li key={m.id}>
                  <span className={`stu-avatar stu-avatar--${avatarTone(m.id)}`} aria-hidden="true">{initials(m.name)}</span>
                  <span className="grp-person-text">
                    <strong>
                      {m.name}
                      {m.id === team.leaderId && <span className="stu-tag stu-tag--info grp-leader-tag"><Icon name="star" size={12} /> Leader</span>}
                    </strong>
                    <small>{m.gradeName} · {m.sectionName} · {formatXp(m.xp)} XP</small>
                  </span>
                  {m.id !== team.leaderId && (
                    <button type="button" className="stu-icon-btn" title="Make leader" aria-label={`Make ${m.name} the leader`} onClick={() => setLeader(m.id)}>
                      <Icon name="star" size={16} />
                    </button>
                  )}
                  <button
                    type="button" className="stu-icon-btn stu-icon-btn--danger"
                    title={members.length <= 2 ? "A team needs at least 2 members" : "Remove from team"}
                    aria-label={`Remove ${m.name} from ${team.name}`}
                    disabled={members.length <= 2}
                    onClick={() => remove(m)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="stu-drawer-foot">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => onEdit(team)}>
            <Icon name="edit" size={16} /> Edit team
          </button>
          <button type="button" className="inst-btn stu-btn-danger" onClick={() => onDelete(team)}>
            <Icon name="ban" size={16} /> Delete team
          </button>
        </footer>
      </div>
    </dialog>
  );
}
