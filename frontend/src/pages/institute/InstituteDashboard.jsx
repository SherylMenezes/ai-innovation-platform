import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { readCache, writeCache } from "../../utils/cache";
import { getGroupOptions, getInstitutionDashboard } from "../../api/institutionClient";
import PerformanceByClass from "./PerformanceByClass";
import { addSampleSection, getSampleGroupOptions, sampleDashboard, sampleFunnel } from "./sampleData";
import AddSectionDialog from "./AddSectionDialog";
import Icon from "./InstituteIcons";
import StickerArt from "./StickerArt";
import explorerArt from "../../assets/institute-explorer.webp";

function StatCard({ icon, tone, label, value, suffix, note, noteTone }) {
  return (
    <div className="inst-stat">
      <div className="inst-stat-top">
        <span className="inst-stat-label">{label}</span>
        <div className={`inst-stat-icon inst-stat-icon--${tone}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      <span className="inst-stat-value">
        {value}
        {suffix && <span className="inst-stat-suffix">{suffix}</span>}
      </span>
      <span className={`inst-stat-note${noteTone ? ` inst-stat-note--${noteTone}` : ""}`}>{note}</span>
    </div>
  );
}

function WorkflowFunnel({ funnel }) {
  const { stages, student_count: total } = funnel;
  let dropIndex = -1;
  let biggestDrop = 0;
  stages.forEach((stage, i) => {
    if (i === 0) return;
    const drop = stages[i - 1].count - stage.count;
    if (drop > biggestDrop) { biggestDrop = drop; dropIndex = i; }
  });

  return (
    <section className="inst-card" aria-labelledby="inst-funnel-title">
      <div className="inst-card-head inst-card-head--stack">
        <h2 id="inst-funnel-title" className="inst-card-title">Workflow funnel</h2>
        <p className="inst-card-sub">
          {funnel.assignment_title} · {funnel.group_name} · {total} students
        </p>
      </div>
      <ol className="inst-funnel">
        {stages.map((stage, i) => (
          <li key={stage.key}>
            <div className="inst-funnel-label">
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
            </div>
            <div className="inst-funnel-track">
              <div
                className={`inst-funnel-fill${i === dropIndex ? " is-drop" : ""}`}
                style={{ width: `${total ? Math.round((stage.count / total) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
      {dropIndex > 0 && (
        <p className="inst-callout">
          Biggest drop is {stages[dropIndex - 1].label} to {stages[dropIndex].label}: {biggestDrop} students stopped there.
        </p>
      )}
      {stages[0]?.count === 0 && (
        <p className="inst-callout">No one in {funnel.group_name} has started this challenge yet.</p>
      )}
    </section>
  );
}

function NeedsAttention({ items, onNavigate }) {
  return (
    <section className="inst-card" aria-labelledby="inst-attn-title">
      <h2 id="inst-attn-title" className="inst-card-title inst-card-title--spaced">Needs attention</h2>
      {items.length === 0 ? (
        <p className="inst-empty">Nothing needs your attention right now.</p>
      ) : (
        <ul className="inst-list">
          {items.map((item) => (
            <li key={item.id} className="inst-attn-item">
              <span className={`inst-dot inst-dot--${item.severity}`} aria-hidden="true" />
              <div className="inst-attn-text">
                <span className="inst-strong">{item.title}</span>
                <span className="inst-muted">{item.detail}</span>
              </div>
              <button type="button" className="inst-pill-btn" onClick={() => onNavigate(item.action_section)}>
                {item.action_label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopStudents({ students, onNavigate }) {
  return (
    <section className="inst-card" aria-labelledby="inst-top-title">
      <div className="inst-card-head">
        <h2 id="inst-top-title" className="inst-card-title">Top students</h2>
        <button type="button" className="inst-link-btn" onClick={() => onNavigate("leaderboard")}>
          View leaderboard
        </button>
      </div>
      <ol className="inst-list">
        {students.map((s, i) => (
          <li key={s.id} className="inst-top-item">
            <span className={`inst-rank inst-rank--${i < 3 ? i + 1 : "rest"}`}>{i + 1}</span>
            <div className="inst-attn-text">
              <span className="inst-strong">{s.name}</span>
              <span className="inst-muted">{s.section} · {s.title}</span>
            </div>
            <span className="inst-xp">{s.total_xp.toLocaleString("en-IN")} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function InstituteDashboard({ onNavigate, onShowInvite }) {
  const { accessToken, user } = useAuth();
  const [groupId, setGroupId] = useState("");
  const cacheKey = `institute.dashboard.${user?.id}.${groupId || "all"}`;
  const [data, setData] = useState(() => readCache(cacheKey));
  const [isLoading, setIsLoading] = useState(() => !readCache(cacheKey));
  const [error, setError] = useState("");
  const [groupOptions, setGroupOptions] = useState([]);
  // Bumped after a section is added so the class lists and stats reload.
  const [groupsVersion, setGroupsVersion] = useState(0);
  // Each open remounts the add-section form so it starts empty.
  const [addSectionOpens, setAddSectionOpens] = useState(0);
  // The grade/section currently open in Performance by class; the funnel follows it.
  const [focusGroupId, setFocusGroupId] = useState(null);
  const addSectionRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      setGroupOptions(getSampleGroupOptions());
      return;
    }
    getGroupOptions(accessToken)
      .then((d) => setGroupOptions(d.groups))
      .catch(() => setGroupOptions([]));
  }, [accessToken, groupsVersion]);

  useEffect(() => {
    if (!accessToken) {
      setData({ ...sampleDashboard, stats: { ...sampleDashboard.stats } });
      setIsLoading(false);
      return;
    }
    const cached = readCache(cacheKey);
    if (cached) setData(cached);
    setIsLoading(!cached);
    setError("");
    getInstitutionDashboard(accessToken, groupId || undefined)
      .then((d) => { setData(d); writeCache(cacheKey, d); })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [accessToken, cacheKey, groupId, groupsVersion]);

  useEffect(() => {
    if (addSectionOpens) addSectionRef.current?.showModal();
  }, [addSectionOpens]);

  const selectedGroup = groupOptions.find((g) => g.id === groupId) ?? null;
  const stats = data?.stats;
  // With the API, the funnel follows the Class filter (the server scopes it by groupId).
  const funnel = accessToken ? data?.funnel : sampleFunnel(focusGroupId);

  // Start the form on the grade picked in the Class filter (or that section's grade).
  const selectedIndex = groupOptions.findIndex((g) => g.id === groupId);
  const defaultGradeId = groupOptions.slice(0, selectedIndex + 1).findLast((g) => g.depth === 0)?.id;

  const addSection = (gradeId, name, studentCount) => {
    if (accessToken) return "Adding sections isn't connected to the server yet.";
    addSampleSection(gradeId, name, studentCount);
    setGroupsVersion((v) => v + 1);
  };

  return (
    <div className="inst-dashboard">
      <div className="inst-header">
        <div className="inst-header-main">
          <h1 className="inst-title inst-header-name">{data?.institute_name || "Institute Panel"}</h1>
          <div className="inst-header-row">
            <div>
              {data?.institute_name && <p className="inst-header-label">Institute Panel</p>}
              <p className="inst-subtitle">How your students are doing across every active challenge.</p>
            </div>
            <div className="inst-actions">
              <label className="inst-filter">
                <span>Class</span>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">All classes</option>
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {"\u00A0\u00A0".repeat(g.depth)}{g.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="inst-btn inst-btn--outline" onClick={() => onShowInvite(data?.invite_code, groupOptions)}>
                Invite code
              </button>
              <button type="button" className="inst-btn inst-btn--outline" onClick={() => setAddSectionOpens((n) => n + 1)}>
                <Icon name="plus" size={16} strokeWidth={2.4} />
                Add section
              </button>
              <button type="button" className="inst-btn inst-btn--primary" onClick={() => onNavigate("assignments")}>
                <Icon name="plus" size={18} strokeWidth={2.4} />
                Assign challenge
              </button>
            </div>
          </div>
        </div>
        <StickerArt className="inst-header-art" src={explorerArt} />
      </div>

      {error && !data && (
        <p className="inst-error">Couldn't load the dashboard. {error}</p>
      )}

      {isLoading && !data ? (
        <div className="inst-stats">
          {[0, 1, 2, 3].map((i) => <div key={i} className="inst-skeleton" style={{ height: 112 }} />)}
        </div>
      ) : stats && (
        <div className="inst-stats">
          <StatCard
            icon="students" tone="blue" label="Total students"
            value={stats.total_students} note={<><span className="inst-live-dot" />{stats.active_now} active right now</>}
            noteTone="good"
          />
          <StatCard
            icon="assignments" tone="yellow" label="Active assignments"
            value={stats.active_assignments} note={`${stats.due_this_week} due this week`} noteTone="warn"
          />
          <StatCard
            icon="completion" tone="green" label="Completion"
            value={`${stats.completion_percent}%`}
            note={`${stats.completion_change >= 0 ? "Up" : "Down"} ${Math.abs(stats.completion_change)}% from last week`}
            noteTone={stats.completion_change >= 0 ? "good" : "warn"}
          />
          <StatCard
            icon="star" tone="pink" label="Avg AI score"
            value={stats.avg_ai_score} suffix=" / 100" note="Across all submissions"
          />
        </div>
      )}

      <div className="inst-row-split inst-row-split--wide">
        <PerformanceByClass rootGroup={selectedGroup} refreshKey={groupsVersion} onFocusChange={setFocusGroupId} />
        {funnel && <WorkflowFunnel funnel={funnel} />}
      </div>

      {data && (
        <div className="inst-row-split">
          <NeedsAttention items={data.attention} onNavigate={onNavigate} />
          <TopStudents students={data.top_students} onNavigate={onNavigate} />
        </div>
      )}

      {addSectionOpens > 0 && (
        <AddSectionDialog
          key={addSectionOpens}
          ref={addSectionRef}
          groupOptions={groupOptions}
          defaultGradeId={defaultGradeId}
          onAdd={addSection}
        />
      )}
    </div>
  );
}
