import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { BADGES, PHASES, levelFor } from "./studentsData";
import {
  STATUS_LABELS, avatarTone, classLabel, formatDate, formatXp, initials, relativeTime,
} from "./studentFormat";

const CHALLENGE_STATUS = {
  completed: { label: "Submitted", tone: "ok" },
  "in-progress": { label: "In progress", tone: "info" },
  "not-started": { label: "Not started", tone: "muted" },
};

function Strengths({ skills }) {
  const ranked = Object.entries(skills).sort((a, b) => b[1] - a[1]);
  const top = new Set(ranked.slice(0, 2).map(([k]) => k));
  const growth = ranked[ranked.length - 1][0];
  return (
    <ul className="stu-skills">
      {ranked.map(([skill, score]) => (
        <li key={skill}>
          <div className="stu-skill-label">
            <span>{skill}</span>
            {top.has(skill) && <span className="stu-tag stu-tag--ok">Strength</span>}
            {skill === growth && <span className="stu-tag stu-tag--warn">Growth area</span>}
            <strong>{score}</strong>
          </div>
          <div className="stu-skill-track">
            <span
              className={`stu-skill-fill${top.has(skill) ? " is-top" : skill === growth ? " is-growth" : ""}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StudentProfileDrawer({ student, onEdit, onToggleStatus, onResend, onClose }) {
  const ref = useModalDialog(onClose);
  const level = levelFor(student.xp);
  const isInvited = student.status === "invited";

  return (
    <dialog
      ref={ref}
      className="stu-drawer"
      aria-labelledby="stu-drawer-name"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}
    >
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close profile" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
          <span className={`stu-avatar stu-avatar--lg stu-avatar--${avatarTone(student.id)}`} aria-hidden="true">
            {initials(student.name)}
          </span>
          <div className="stu-drawer-id">
            <h2 id="stu-drawer-name">{student.name}</h2>
            <p>{student.email}</p>
            <div className="stu-drawer-meta">
              <span className={`stu-status stu-status--${student.status}`}>{STATUS_LABELS[student.status]}</span>
              <span>{classLabel(student)}</span>
              <span>
                {isInvited ? `Invited ${formatDate(student.invitedOn)}` : `Joined ${formatDate(student.joinedOn)}`}
              </span>
            </div>
          </div>
        </header>

        <div className="stu-drawer-body">
          {isInvited ? (
            <section className="stu-empty-profile">
              <span className="stu-drop-icon"><Icon name="mail" size={22} /></span>
              <h3>Waiting for {student.name.split(" ")[0]} to join</h3>
              <p>
                {student.inviteSent === false
                  ? "No invite email has been sent yet."
                  : `An invite was sent ${relativeTime(student.invitedOn).toLowerCase()}.`}{" "}
                Their challenge history, scores and badges will appear here once they sign up.
              </p>
              <button type="button" className="inst-btn inst-btn--outline" onClick={() => onResend(student)}>
                <Icon name="mail" size={16} /> {student.inviteSent === false ? "Send invite" : "Resend invite"}
              </button>
            </section>
          ) : (
            <>
              <section className="stu-kpis" aria-label="Summary">
                <div>
                  <span>Level</span>
                  <strong>{level.level}</strong>
                  <small>{level.title}</small>
                </div>
                <div>
                  <span>Total XP</span>
                  <strong>{formatXp(student.xp)}</strong>
                  <small>{level.level >= 10 ? "Max level" : `${formatXp(level.xpForNextLevel - level.xpIntoLevel)} to next level`}</small>
                </div>
                <div>
                  <span>Avg score</span>
                  <strong>{student.avgScore ?? "—"}</strong>
                  <small>{student.completed} challenge{student.completed === 1 ? "" : "s"} scored</small>
                </div>
                <div>
                  <span>Progress</span>
                  <strong>{student.progress}%</strong>
                  <small>Last active {relativeTime(student.lastActive).toLowerCase()}</small>
                </div>
              </section>

              <section className="stu-section">
                <h3>Strengths</h3>
                <p className="stu-section-sub">Average AI rubric score per skill across their submissions.</p>
                <Strengths skills={student.skills} />
              </section>

              <section className="stu-section">
                <h3>Badges <span className="stu-count">{student.badges.length}</span></h3>
                {student.badges.length ? (
                  <ul className="stu-badges">
                    {student.badges.map((key) => (
                      <li key={key}>
                        <span className="stu-badge-icon" aria-hidden="true"><Icon name="awards" size={18} /></span>
                        <div>
                          <strong>{BADGES[key].name}</strong>
                          <small>{BADGES[key].description}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="stu-muted">No badges yet.</p>
                )}
              </section>

              <section className="stu-section">
                <h3>Challenge history <span className="stu-count">{student.history.length}</span></h3>
                <ol className="stu-history">
                  {[...student.history].reverse().map((c) => {
                    const status = CHALLENGE_STATUS[c.status];
                    return (
                      <li key={c.title}>
                        <div className="stu-history-top">
                          <strong>{c.title}</strong>
                          <span className={`stu-tag stu-tag--${status.tone}`}>{status.label}</span>
                        </div>
                        <div className="stu-phases" aria-label={`${c.stepsDone} of ${PHASES.length} phases done`}>
                          {PHASES.map((p, i) => <span key={p} className={i < c.stepsDone ? "is-done" : undefined} title={p} />)}
                        </div>
                        <div className="stu-history-meta">
                          <span><Icon name="calendar" size={14} /> Assigned {formatDate(c.assignedOn)}</span>
                          <span>{c.status === "completed" ? "Submitted" : `At ${c.phase}`}</span>
                          <span className="stu-history-score">
                            {c.score != null ? <>Score <strong>{c.score}</strong></> : "Not scored"}
                          </span>
                          <span><Icon name="bolt" size={14} /> {c.xp} XP</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </>
          )}
        </div>

        <footer className="stu-drawer-foot">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => onEdit(student)}>
            <Icon name="edit" size={16} /> Edit details
          </button>
          <button
            type="button"
            className={`inst-btn ${student.status === "deactivated" ? "inst-btn--outline" : "stu-btn-danger"}`}
            onClick={() => onToggleStatus(student)}
          >
            <Icon name={student.status === "deactivated" ? "restore" : "ban"} size={16} />
            {student.status === "deactivated" ? "Reactivate" : "Deactivate"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
