import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { ChannelPicker, NotificationLog } from "./InstituteShared";
import {
  PARTICIPATION, PHASES, REMINDERS, changeDeadline, deadlineState, participation, sendReminder, summarise,
  targetLabel, updateAssignment,
} from "./assignmentsData";
import { challengeById, typeLabel } from "./challengesData";
import { STATUS } from "./chartPalette";
import { listNotifications } from "./notificationsData";
import { avatarTone, formatDate, initials, relativeTime } from "./studentFormat";

const DAY = 24 * 60 * 60 * 1000;
const toInputDate = (ts) => new Date(ts - new Date(ts).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fromInputDate = (value) => new Date(`${value}T23:59:00`).getTime();

const FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "in-progress", label: "In progress" },
  { key: "not-started", label: "Not started" },
];

// Detail view for one assignment: deadline management, participation and completion tracking,
// and notifications (BRD 12.3, AI082–AI084).
export default function AssignmentDrawer({ assignment, onChanged, onRemove, onClose }) {
  const ref = useModalDialog(onClose);
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [due, setDue] = useState(() => toInputDate(assignment.dueOn));
  const [tellStudents, setTellStudents] = useState(true);
  const [dueError, setDueError] = useState("");

  const challenge = challengeById(assignment.challengeId);
  const rows = participation(assignment);
  const stats = summarise(rows);
  const state = deadlineState(assignment);
  const q = query.trim().toLowerCase();
  const shown = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !q || r.student.name.toLowerCase().includes(q))
    .sort((a, b) => ["submitted", "in-progress", "not-started"].indexOf(a.status) - ["submitted", "in-progress", "not-started"].indexOf(b.status) || a.student.name.localeCompare(b.student.name));
  const counts = { all: rows.length, submitted: stats.submitted, "in-progress": stats.inProgress, "not-started": stats.notStarted };
  const pending = stats.total - stats.submitted;

  const saveDeadline = (dueOn) => {
    if (dueOn < now - DAY) return setDueError("Pick today or a later date.");
    setDueError("");
    setDue(toInputDate(dueOn));
    const told = changeDeadline(assignment.id, dueOn, tellStudents);
    onChanged(`Deadline set to ${formatDate(dueOn)}${tellStudents && told ? `; ${told} students notified` : ""}.`);
  };

  const remind = () => {
    const n = sendReminder(assignment.id);
    onChanged(n ? `Reminder sent to ${n} students who haven't submitted.` : "Everyone has submitted, so no reminder was needed.");
  };

  return (
    <dialog ref={ref} className="stu-drawer asg-drawer" aria-labelledby="asg-drawer-title"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head chl-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
          <div className="stu-drawer-id">
            <div className="chl-tags">
              <span className={`chl-type chl-type--${challenge?.type}`}>{typeLabel(challenge?.type)}</span>
              <span className={`asg-due asg-due--${state.tone}`}>{state.label}</span>
            </div>
            <h2 id="asg-drawer-title">{challenge?.title}</h2>
            <p>{targetLabel(assignment.target)} · assigned {formatDate(assignment.assignedOn)}</p>
          </div>
        </header>

        <div className="stu-drawer-body">
          <section className="stu-kpis" aria-label="Summary">
            <div><span>Students</span><strong>{stats.total}</strong><small>Assigned this challenge</small></div>
            <div><span>Taking part</span><strong>{stats.participationRate}%</strong><small>{stats.participated} have started</small></div>
            <div><span>Submitted</span><strong>{stats.completionRate}%</strong><small>{stats.submitted} of {stats.total}</small></div>
            <div><span>Deadline</span><strong>{formatDate(assignment.dueOn)}</strong><small>{state.label}</small></div>
          </section>

          <section className="stu-section">
            <h3>Progress</h3>
            <div className="asg-split" role="img" aria-label={`${stats.submitted} submitted, ${stats.inProgress} in progress, ${stats.notStarted} not started`}>
              {[["submitted", stats.submitted], ["in-progress", stats.inProgress], ["not-started", stats.notStarted]].map(([key, n]) => n > 0 && (
                <span key={key} style={{ flexGrow: n, background: STATUS[key] }} />
              ))}
            </div>
            <ul className="ch-legend asg-split-legend">
              <li><i style={{ background: STATUS.submitted }} aria-hidden="true" />Submitted <strong>{stats.submitted}</strong></li>
              <li><i style={{ background: STATUS["in-progress"] }} aria-hidden="true" />In progress <strong>{stats.inProgress}</strong></li>
              <li><i style={{ background: STATUS["not-started"] }} aria-hidden="true" />Not started <strong>{stats.notStarted}</strong></li>
            </ul>
          </section>

          <section className="stu-section">
            <h3>Deadline</h3>
            <p className="stu-section-sub">Move or extend the due date. Students who haven't submitted can be told about the change.</p>
            <div className="asg-deadline">
              <label className="inst-field">
                <span>Due date</span>
                <input type="date" value={due} min={toInputDate(now)} onChange={(e) => setDue(e.target.value)} />
              </label>
              <button type="button" className="inst-btn inst-btn--primary grp-btn-sm" onClick={() => saveDeadline(fromInputDate(due))} disabled={!due || fromInputDate(due) === assignment.dueOn}>
                Update
              </button>
              <button type="button" className="inst-pill-btn" onClick={() => saveDeadline(Math.max(assignment.dueOn, now) + 3 * DAY)}>+3 days</button>
              <button type="button" className="inst-pill-btn" onClick={() => saveDeadline(Math.max(assignment.dueOn, now) + 7 * DAY)}>+1 week</button>
            </div>
            <label className="grp-check-all asg-tell">
              <input type="checkbox" checked={tellStudents} onChange={(e) => setTellStudents(e.target.checked)} />
              Notify the {pending} student{pending === 1 ? "" : "s"} who haven't submitted
            </label>
            {dueError && <p className="inst-form-error" role="alert">{dueError}</p>}
          </section>

          <section className="stu-section">
            <h3>Students <span className="stu-count">{rows.length}</span></h3>
            <div className="grp-list-tools">
              <div className="inst-segmented" role="group" aria-label="Show">
                {FILTERS.map((f) => (
                  <button key={f.key} type="button" aria-pressed={filter === f.key} className={filter === f.key ? "is-on" : ""} onClick={() => setFilter(f.key)}>
                    {f.label} {counts[f.key]}
                  </button>
                ))}
              </div>
              <label className="stu-search">
                <Icon name="search" size={16} />
                <span className="inst-sr-only">Search students</span>
                <input type="search" value={query} placeholder="Search" onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
            <ul className="grp-members asg-students">
              {shown.map((r) => (
                <li key={r.student.id}>
                  <span className={`stu-avatar stu-avatar--${avatarTone(r.student.id)}`} aria-hidden="true">{initials(r.student.name)}</span>
                  <span className="grp-person-text">
                    <strong>{r.student.name}</strong>
                    <small>
                      {r.student.gradeName} · {r.student.sectionName} ·{" "}
                      {r.status === "submitted" ? `Submitted ${formatDate(r.submittedOn)}` : r.status === "in-progress" ? `At ${PHASES[r.phase - 1]} · active ${relativeTime(r.lastActivity).toLowerCase()}` : "Hasn't opened it yet"}
                    </small>
                  </span>
                  <span className="stu-phases asg-phases" aria-label={`${r.phase} of 4 phases done`}>
                    {PHASES.map((p, i) => <span key={p} className={i < r.phase ? "is-done" : undefined} title={p} />)}
                  </span>
                  <span className="asg-score">{r.score ?? "—"}</span>
                  <span className={`stu-tag stu-tag--${PARTICIPATION[r.status].tone}`}>{PARTICIPATION[r.status].label}</span>
                </li>
              ))}
              {!shown.length && <li className="stu-muted grp-none">No students in this view.</li>}
            </ul>
          </section>

          <section className="stu-section">
            <h3>Notifications</h3>
            <p className="stu-section-sub">How students hear about this assignment, its deadline and reminders.</p>
            <ChannelPicker
              value={assignment.channels}
              onChange={(channels) => { updateAssignment(assignment.id, { channels }); onChanged(); }}
              legend="Send by"
            />
            <div className="asg-reminders asg-reminders--inline">
              <span>Automatic reminders</span>
              {REMINDERS.map((r) => (
                <label key={r.key}>
                  <input
                    type="checkbox" checked={assignment.reminders[r.key]}
                    onChange={(e) => { updateAssignment(assignment.id, { reminders: { ...assignment.reminders, [r.key]: e.target.checked } }); onChanged(); }}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <button type="button" className="inst-btn inst-btn--outline asg-remind" onClick={remind} disabled={!pending}>
              <Icon name="mail" size={16} /> Remind {pending} student{pending === 1 ? "" : "s"} now
            </button>
            <h4 className="asg-log-title">Sent</h4>
            <NotificationLog items={listNotifications(assignment.id)} />
          </section>
        </div>

        <footer className="stu-drawer-foot">
          <button type="button" className="inst-btn stu-btn-danger" onClick={() => onRemove(assignment)}>
            <Icon name="ban" size={16} /> Remove assignment
          </button>
        </footer>
      </div>
    </dialog>
  );
}
