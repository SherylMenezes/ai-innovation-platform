import { useState } from "react";
import Icon from "./InstituteIcons";
import AssignDialog from "./AssignDialog";
import ChallengeFormDialog from "./ChallengeFormDialog";
import useModalDialog from "./useModalDialog";
import useToast from "./useToast";
import { PageHero, Tabs, Toast } from "./InstituteShared";
import { deadlineState, listAssignments, participation, summarise, targetLabel } from "./assignmentsData";
import {
  CHALLENGE_TYPES, LEVELS, THEMES, createInstitutionChallenge, levelLabel, listChallenges, typeLabel,
} from "./challengesData";
import { sampleDashboard } from "./sampleData";
import { formatDate } from "./studentFormat";
import challengesArt from "../../assets/institute-challenges.webp";
import "./Students.css";
import "./Groups.css";
import "./InstituteModules.css";

const SOURCES = [
  { key: "", label: "All sources" },
  { key: "institution", label: "Created by us" },
  { key: "platform", label: "Platform library" },
  { key: "company", label: "Companies" },
];

function ChallengeDrawer({ challenge, onAssign, onClose }) {
  const ref = useModalDialog(onClose);
  const ours = listAssignments().filter((a) => a.challengeId === challenge.id);
  return (
    <dialog ref={ref} className="stu-drawer" aria-labelledby="chl-drawer-title"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head chl-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
          <div className="stu-drawer-id">
            <div className="chl-tags">
              <span className={`chl-type chl-type--${challenge.type}`}>{typeLabel(challenge.type)}</span>
              {challenge.theme && <span className="chl-theme">{challenge.theme}</span>}
              {challenge.source === "institution" && <span className="stu-tag stu-tag--info">Created by us</span>}
            </div>
            <h2 id="chl-drawer-title">{challenge.title}</h2>
            <p>{challenge.company ? `Posted by ${challenge.company}` : challenge.source === "institution" ? sampleDashboard.institute_name : "Platform challenge library"}</p>
          </div>
        </header>
        <div className="stu-drawer-body">
          <section className="stu-kpis" aria-label="Summary">
            <div><span>Timeline</span><strong>{challenge.durationWeeks} wk</strong><small>Suggested duration</small></div>
            <div><span>Reward</span><strong>{challenge.xp} XP</strong><small>{challenge.type === "company" ? "Plus company certificate" : "On submission"}</small></div>
            <div><span>Levels</span><strong>{challenge.levels.length}</strong><small>{challenge.levels.map(levelLabel).join(", ")}</small></div>
            <div><span>Taking part</span><strong>{challenge.platformParticipants.toLocaleString("en-IN")}</strong><small>Across the platform</small></div>
          </section>
          <section className="stu-section">
            <h3>The problem</h3>
            <p className="chl-summary">{challenge.summary}</p>
          </section>
          <section className="stu-section">
            <h3>Objectives</h3>
            <ul className="chl-list">{challenge.objectives.map((o) => <li key={o}><Icon name="target" size={15} /> {o}</li>)}</ul>
          </section>
          <section className="stu-section">
            <h3>Students submit</h3>
            <ul className="chl-list">{challenge.submission.map((s) => <li key={s}><Icon name="check" size={15} /> {s}</li>)}</ul>
            <p className="stu-section-sub chl-reward">Rewards: {challenge.rewards}</p>
          </section>
          <section className="stu-section">
            <h3>Assigned in your institute <span className="stu-count">{ours.length}</span></h3>
            {ours.length ? (
              <ul className="grp-members">
                {ours.map((a) => {
                  const s = summarise(participation(a));
                  return (
                    <li key={a.id}>
                      <span className="grp-person-text">
                        <strong>{targetLabel(a.target)}</strong>
                        <small>{deadlineState(a).label} · {s.completionRate}% submitted · {s.participationRate}% taking part</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="stu-muted">Not assigned to anyone yet.</p>}
          </section>
        </div>
        <footer className="stu-drawer-foot">
          <button type="button" className="inst-btn inst-btn--primary" onClick={() => onAssign(challenge)}>
            <Icon name="assignments" size={16} /> Assign to students
          </button>
        </footer>
      </div>
    </dialog>
  );
}

export default function ChallengesPage() {
  const [, setVersion] = useState(0);
  const [type, setType] = useState("all");
  const [theme, setTheme] = useState("");
  const [level, setLevel] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [assigning, setAssigning] = useState(null); // challenge id
  const [creating, setCreating] = useState(false);
  const [toast, showToast] = useToast();

  const challenges = listChallenges();
  const assignedIds = new Set(listAssignments().map((a) => a.challengeId));
  const q = query.trim().toLowerCase();
  const shown = challenges.filter((c) =>
    (type === "all" || c.type === type)
    && (!theme || c.theme === theme)
    && (!level || c.levels.includes(level))
    && (!source || c.source === source)
    && (!q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)));
  const open = challenges.find((c) => c.id === openId);
  const hasFilters = theme || level || source || q;

  const tabs = [
    { key: "all", label: "All", count: challenges.length },
    ...CHALLENGE_TYPES.map((t) => ({ key: t.key, label: t.plural, count: challenges.filter((c) => c.type === t.key).length })),
  ];

  return (
    <div className="stu-page">
      <PageHero
        eyebrow={`Explore · ${sampleDashboard.institute_name}`}
        title="Challenges"
        art={challengesArt}
        summary={`${challenges.length} challenges · ${challenges.filter((c) => c.source === "institution").length} created by you · ${assignedIds.size} assigned`}
        description="Browse the platform's challenges by type and level, create your own, and assign them to your students."
        actions={
          <button type="button" className="inst-btn inst-btn--primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} strokeWidth={2.4} /> Create challenge
          </button>
        }
      />

      <Tabs tabs={tabs} value={type} onChange={(t) => { setType(t); if (t !== "theme" && t !== "all") setTheme(""); }} label="Challenge type" idPrefix="chl" />

      <div className="inst-card grp-team-toolbar">
        <label className="stu-search">
          <Icon name="search" size={18} />
          <span className="inst-sr-only">Search challenges</span>
          <input type="search" value={query} placeholder="Search challenges" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="stu-select">
          <span className="inst-sr-only">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All levels</option>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </label>
        <label className="stu-select">
          <span className="inst-sr-only">Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="">All themes</option>
            {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="stu-select">
          <span className="inst-sr-only">Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <span className="stu-results" aria-live="polite">{shown.length} of {challenges.length}</span>
        {hasFilters && (
          <button type="button" className="stu-clear" onClick={() => { setTheme(""); setLevel(""); setSource(""); setQuery(""); }}>Clear filters</button>
        )}
      </div>

      {type !== "all" && <p className="chl-type-blurb">{CHALLENGE_TYPES.find((t) => t.key === type)?.blurb}</p>}

      <div id="chl-panel" role="tabpanel" aria-labelledby={`chl-tab-${type}`} className="chl-grid">
        {shown.map((c) => (
          <article key={c.id} className="inst-card chl-card">
            <div className="chl-tags">
              <span className={`chl-type chl-type--${c.type}`}>{typeLabel(c.type)}</span>
              {c.theme && <span className="chl-theme">{c.theme}</span>}
              {c.source === "institution" && <span className="stu-tag stu-tag--info">Ours</span>}
            </div>
            <h2 className="chl-title">
              <button type="button" onClick={() => setOpenId(c.id)}>{c.title}</button>
            </h2>
            <p className="chl-card-summary">{c.summary}</p>
            <div className="chl-levels-row" aria-label="Levels">
              {c.levels.map((l) => <span key={l}>{levelLabel(l)}</span>)}
            </div>
            <div className="chl-meta">
              <span><Icon name="calendar" size={14} /> {c.durationWeeks} wk</span>
              <span><Icon name="bolt" size={14} /> {c.xp} XP</span>
              {c.company ? <span title="Company">{c.company}</span> : <span>{assignedIds.has(c.id) ? "Assigned" : "Not assigned"}</span>}
            </div>
            <div className="chl-actions">
              <button type="button" className="inst-pill-btn" onClick={() => setOpenId(c.id)}>Details</button>
              <button type="button" className="inst-btn inst-btn--primary grp-btn-sm" onClick={() => setAssigning(c.id)}>
                <Icon name="assignments" size={14} /> Assign
              </button>
            </div>
          </article>
        ))}
      </div>

      {!shown.length && (
        <div className="stu-empty inst-card">
          <span className="stu-drop-icon"><Icon name="search" size={22} /></span>
          <strong>No challenges match</strong>
          <span>Try another type, level or theme.</span>
        </div>
      )}

      {open && (
        <ChallengeDrawer challenge={open} onAssign={(c) => setAssigning(c.id)} onClose={() => setOpenId(null)} />
      )}
      {assigning && (
        <AssignDialog
          presetChallengeId={assigning}
          onAssigned={({ assignment, reached }) => {
            setVersion((v) => v + 1);
            showToast(`Assigned to ${targetLabel(assignment.target)} (${reached} students), due ${formatDate(assignment.dueOn)}.`);
            setOpenId(null);
          }}
          onClose={() => setAssigning(null)}
        />
      )}
      {creating && (
        <ChallengeFormDialog
          onSubmit={(fields) => {
            const c = createInstitutionChallenge(fields);
            setType("all");
            setSource("");
            setVersion((v) => v + 1);
            showToast(`Created ${c.title}. It's now in your library.`);
          }}
          onClose={() => setCreating(false)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
