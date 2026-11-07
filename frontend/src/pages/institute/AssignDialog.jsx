import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { ChannelPicker } from "./InstituteShared";
import { SectionSelect } from "./GroupsShared";
import { REMINDERS, TARGET_TYPES, createAssignment, targetLabel, targetStudents } from "./assignmentsData";
import { CHALLENGE_TYPES, levelLabel, listChallenges, typeLabel } from "./challengesData";
import { listTeams } from "./groupsData";
import { DEFAULT_CHANNELS, channelList } from "./notificationsData";
import { getClassOptions } from "./studentsData";

const DAY = 24 * 60 * 60 * 1000;
const toInputDate = (ts) => new Date(ts - new Date(ts).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
// End of the chosen day, local time, so "due 12 Nov" means all of 12 Nov.
const fromInputDate = (value) => new Date(`${value}T23:59:00`).getTime();

// Assign a challenge to the institute, a grade, a section or a team (BRD 12.3, AI082–AI084).
// onAssigned({ assignment, reached }) is called after saving; the dialog then closes itself.
export default function AssignDialog({ presetChallengeId, onAssigned, onClose }) {
  const ref = useModalDialog(onClose);
  const grades = getClassOptions();
  const teams = listTeams();
  const challenges = listChallenges();
  const [now] = useState(() => Date.now());

  const [challengeId, setChallengeId] = useState(presetChallengeId ?? "");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [targetType, setTargetType] = useState("grade");
  const [targetId, setTargetId] = useState(grades[0]?.id ?? "");
  const [due, setDue] = useState(() => toInputDate(now + 14 * DAY));
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [reminders, setReminders] = useState({ threeDays: true, oneDay: true, onDue: false });
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const chosen = challenges.find((c) => c.id === challengeId);
  const q = query.trim().toLowerCase();
  const options = challenges.filter((c) => (!typeFilter || c.type === typeFilter) && (!q || c.title.toLowerCase().includes(q)));
  const target = { type: targetType, id: targetType === "all" ? null : targetId };
  const reached = targetType === "all" || targetId ? targetStudents(target).length : 0;
  const channelNames = channelList(channels);

  const changeTargetType = (type) => {
    setTargetType(type);
    setTargetId(type === "grade" ? grades[0]?.id ?? "" : type === "team" ? teams[0]?.id ?? "" : "");
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!chosen) return setError("Choose a challenge to assign.");
    if (targetType !== "all" && !targetId) return setError("Choose who to assign it to.");
    if (!reached) return setError("That group has no active students yet.");
    if (!due) return setError("Set a due date.");
    const dueOn = fromInputDate(due);
    if (dueOn < now) return setError("The due date can't be in the past.");
    const result = createAssignment({ challengeId, target, dueOn, channels, reminders, note });
    onAssigned(result);
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="asg-form-title">
      <form onSubmit={submit} noValidate>
        <div className="stu-dialog-head">
          <div>
            <h2 id="asg-form-title" className="inst-card-title">Assign a challenge</h2>
            <p className="inst-subtitle">Pick a challenge, choose who takes part, and set the deadline. Students are notified straight away.</p>
          </div>
          <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="asg-form">
          <fieldset className="asg-step">
            <legend><span>1</span> Challenge</legend>
            {presetChallengeId && chosen ? (
              <div className="asg-chosen">
                <span className={`chl-type chl-type--${chosen.type}`}>{typeLabel(chosen.type)}</span>
                <strong>{chosen.title}</strong>
                <small>{chosen.levels.map(levelLabel).join(" · ")} · {chosen.durationWeeks} weeks · {chosen.xp} XP</small>
              </div>
            ) : (
              <>
                <div className="grp-picker-tools">
                  <label className="stu-search">
                    <Icon name="search" size={16} />
                    <span className="inst-sr-only">Search challenges</span>
                    <input type="search" value={query} placeholder="Search challenges" onChange={(e) => setQuery(e.target.value)} />
                  </label>
                  <label className="stu-select">
                    <span className="inst-sr-only">Type</span>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                      <option value="">All types</option>
                      {CHALLENGE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.plural}</option>)}
                    </select>
                  </label>
                </div>
                <ul className="grp-people grp-people--picker asg-challenge-list" aria-label="Challenges">
                  {options.map((c) => (
                    <li key={c.id}>
                      <label className={c.id === challengeId ? "is-selected" : undefined}>
                        <input type="radio" name="asg-challenge" checked={c.id === challengeId} onChange={() => { setChallengeId(c.id); setError(""); }} />
                        <span className="grp-person-text">
                          <strong>{c.title}</strong>
                          <small>{typeLabel(c.type)}{c.theme ? ` · ${c.theme}` : ""} · {c.levels.map(levelLabel).join(", ")}</small>
                        </span>
                        <span className="asg-xp">{c.xp} XP</span>
                      </label>
                    </li>
                  ))}
                  {!options.length && <li className="stu-muted grp-none">No challenges match.</li>}
                </ul>
              </>
            )}
          </fieldset>

          <div className="asg-side">
            <fieldset className="asg-step">
              <legend><span>2</span> Assign to</legend>
              <div className="inst-segmented asg-target-type" role="radiogroup" aria-label="Assign to">
                {TARGET_TYPES.map((t) => (
                  <button
                    key={t.key} type="button" role="radio" aria-checked={targetType === t.key}
                    className={targetType === t.key ? "is-on" : ""} onClick={() => changeTargetType(t.key)}
                  >
                    {t.key === "all" ? "Everyone" : t.label.replace(/^A /, "")}
                  </button>
                ))}
              </div>
              {targetType === "grade" && (
                <label className="inst-field">
                  <span className="inst-sr-only">Grade</span>
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </label>
              )}
              {targetType === "section" && (
                <label className="inst-field">
                  <span className="inst-sr-only">Section</span>
                  <SectionSelect grades={grades} value={targetId} onChange={setTargetId} />
                </label>
              )}
              {targetType === "team" && (
                <label className="inst-field">
                  <span className="inst-sr-only">Team</span>
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.memberIds.length} members)</option>)}
                  </select>
                </label>
              )}
              <p className="asg-reach"><Icon name="students" size={15} /> {reached} student{reached === 1 ? "" : "s"} will get this challenge</p>
            </fieldset>

            <fieldset className="asg-step">
              <legend><span>3</span> Deadline</legend>
              <label className="inst-field">
                <span>Due date</span>
                <input type="date" value={due} min={toInputDate(now)} onChange={(e) => { setDue(e.target.value); setError(""); }} />
              </label>
              <div className="asg-reminders">
                <span>Send reminders</span>
                {REMINDERS.map((r) => (
                  <label key={r.key}>
                    <input type="checkbox" checked={reminders[r.key]} onChange={(e) => setReminders({ ...reminders, [r.key]: e.target.checked })} />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="asg-step">
              <legend><span>4</span> Notifications</legend>
              <ChannelPicker value={channels} onChange={setChannels} legend="Notify students by" />
              <label className="inst-field">
                <span>Message to students (optional)</span>
                <input type="text" value={note} maxLength={140} placeholder="e.g. Work in your teams; we'll review on Friday." onChange={(e) => setNote(e.target.value)} />
              </label>
            </fieldset>
          </div>
        </div>

        {error && <p className="inst-form-error" role="alert">{error}</p>}

        <div className="inst-dialog-actions asg-actions">
          <p className="inst-form-hint">
            {chosen
              ? `${chosen.title} → ${targetType === "all" || targetId ? targetLabel(target) : "…"}. ${channelNames.length ? `Notified by ${channelNames.join(", ").toLowerCase()}.` : "No notifications will be sent."}`
              : "Choose a challenge to see a summary."}
          </p>
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">Assign challenge</button>
        </div>
      </form>
    </dialog>
  );
}
