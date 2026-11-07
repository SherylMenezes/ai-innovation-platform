import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { CHALLENGE_TYPES, LEVELS, SUBMISSION_PARTS, THEMES, challengeTitleTaken } from "./challengesData";

// Institution-level challenge (BRD 6.2). The BRD defines no institution form, so the fields follow
// the platform's challenge form (AI070): title, description, category, timeline, eligibility,
// objectives, rewards and submission requirements. Company challenges are posted by companies.
const TYPES = CHALLENGE_TYPES.filter((t) => t.key !== "company");

export default function ChallengeFormDialog({ onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState("theme");
  const [theme, setTheme] = useState(THEMES[0]);
  const [levels, setLevels] = useState(["g8-10"]);
  const [weeks, setWeeks] = useState("3");
  const [xp, setXp] = useState("500");
  const [objectives, setObjectives] = useState(["", "", ""]);
  const [submission, setSubmission] = useState(["Problem canvas", "Idea pitch"]);
  const [rewards, setRewards] = useState("");
  const [error, setError] = useState("");

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const w = Number(weeks);
    const points = Number(xp);
    const goals = objectives.map((o) => o.trim()).filter(Boolean);
    if (title.trim().length < 4) return setError("Give the challenge a title of at least 4 characters.");
    if (challengeTitleTaken(title)) return setError("A challenge with this title already exists.");
    if (summary.trim().length < 20) return setError("Describe the problem in at least 20 characters.");
    if (type === "theme" && !theme) return setError("Choose a theme.");
    if (!levels.length) return setError("Choose at least one level.");
    if (!Number.isInteger(w) || w < 1 || w > 26) return setError("Duration must be 1–26 weeks.");
    if (!Number.isInteger(points) || points < 50 || points > 5000) return setError("XP reward must be between 50 and 5,000.");
    if (!goals.length) return setError("Add at least one objective.");
    if (!submission.length) return setError("Choose at least one thing students must submit.");
    onSubmit({
      title, summary, type, theme: theme || null,
      levels, durationWeeks: w, xp: points, objectives: goals, submission, rewards,
    });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="chl-form-title">
      <form onSubmit={submit} noValidate>
        <div className="stu-dialog-head">
          <div>
            <h2 id="chl-form-title" className="inst-card-title">Create an institution challenge</h2>
            <p className="inst-subtitle">Only your students see it. You can assign it straight away once it's created.</p>
          </div>
          <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="stu-form-grid chl-form">
          <label className="inst-field inst-field--full">
            <span>Title</span>
            <input type="text" value={title} maxLength={80} placeholder="e.g. Plastic-free Canteen" onChange={(e) => { setTitle(e.target.value); setError(""); }} />
          </label>
          <label className="inst-field inst-field--full">
            <span>Problem description</span>
            <textarea rows={3} value={summary} maxLength={400} placeholder="What problem should students solve, and for whom?" onChange={(e) => { setSummary(e.target.value); setError(""); }} />
          </label>

          <label className="inst-field">
            <span>Challenge type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="inst-field">
            <span>Theme {type === "theme" ? "" : "(optional)"}</span>
            <select value={theme ?? ""} onChange={(e) => setTheme(e.target.value)}>
              {type !== "theme" && <option value="">No theme</option>}
              {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <fieldset className="inst-field--full chl-levels">
            <legend>Levels (eligibility)</legend>
            {LEVELS.map((l) => (
              <label key={l.key} className={levels.includes(l.key) ? "is-on" : undefined}>
                <input type="checkbox" checked={levels.includes(l.key)} onChange={() => toggle(levels, setLevels, l.key)} />
                {l.label}
              </label>
            ))}
          </fieldset>

          <label className="inst-field">
            <span>Timeline (weeks)</span>
            <input type="number" min={1} max={26} value={weeks} onChange={(e) => { setWeeks(e.target.value); setError(""); }} />
          </label>
          <label className="inst-field">
            <span>XP reward</span>
            <input type="number" min={50} max={5000} step={50} value={xp} onChange={(e) => { setXp(e.target.value); setError(""); }} />
          </label>

          <fieldset className="inst-field--full chl-objectives">
            <legend>Objectives</legend>
            {objectives.map((o, i) => (
              <input
                key={i} type="text" value={o} maxLength={100} aria-label={`Objective ${i + 1}`}
                placeholder={["Understand who is affected and why", "Compare at least three ideas", "Test a simple prototype"][i]}
                onChange={(e) => setObjectives(objectives.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
          </fieldset>

          <fieldset className="inst-field--full chl-levels">
            <legend>Submission requirements</legend>
            {SUBMISSION_PARTS.map((part) => (
              <label key={part} className={submission.includes(part) ? "is-on" : undefined}>
                <input type="checkbox" checked={submission.includes(part)} onChange={() => toggle(submission, setSubmission, part)} />
                {part}
              </label>
            ))}
          </fieldset>

          <label className="inst-field inst-field--full">
            <span>Other rewards (optional)</span>
            <input type="text" value={rewards} maxLength={120} placeholder="e.g. Winners present at the annual science fair" onChange={(e) => setRewards(e.target.value)} />
          </label>
        </div>

        {error && <p className="inst-form-error" role="alert">{error}</p>}

        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">Create challenge</button>
        </div>
      </form>
    </dialog>
  );
}
