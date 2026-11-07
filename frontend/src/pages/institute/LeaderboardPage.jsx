import { useEffect, useEffectEvent, useState } from "react";
import Icon from "./InstituteIcons";
import useToast from "./useToast";
import { ChannelPicker, NotificationLog, PageHero, Tabs, Toast } from "./InstituteShared";
import { deadlineState, listAssignments, participation, summarise, targetLabel } from "./assignmentsData";
import { challengeById } from "./challengesData";
import { SCOPES, rankings } from "./leaderboardData";
import { DEFAULT_CHANNELS, listNotifications, sendNotification } from "./notificationsData";
import { sampleDashboard } from "./sampleData";
import { awardXp, getClassOptions, listStudents } from "./studentsData";
import { avatarTone, formatXp, initials } from "./studentFormat";
import "./Students.css";
import "./Groups.css";
import "./InstituteModules.css";

const TICK_MS = 2800;
const FLASH_MS = 2400;
const PAGE = 20;

function Movement({ delta }) {
  if (!delta) return <span className="lb-move lb-move--flat" aria-label="No change">–</span>;
  const up = delta > 0;
  return (
    <span className={`lb-move lb-move--${up ? "up" : "down"}`} aria-label={`${up ? "Up" : "Down"} ${Math.abs(delta)}`}>
      <Icon name={up ? "sortUp" : "sortDown"} size={14} strokeWidth={2.6} />{Math.abs(delta)}
    </span>
  );
}

export default function LeaderboardPage() {
  const grades = getClassOptions();
  const assignments = listAssignments();
  const [scope, setScope] = useState("institution");
  const [metric, setMetric] = useState("xp");
  const [classId, setClassId] = useState(grades[0]?.sections[0]?.id ?? "");
  // Challenge view starts on the assignment with the most students taking part.
  const [assignmentId, setAssignmentId] = useState(() =>
    [...assignments].sort((a, b) => summarise(participation(b)).participated - summarise(participation(a)).participated)[0]?.id ?? "");
  const [live, setLive] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [moves, setMoves] = useState({}); // id -> places moved at its last change
  const [flash, setFlash] = useState({}); // id -> time of last change
  const [feed, setFeed] = useState([]);
  const [lastTick, setLastTick] = useState(() => Date.now());
  const [notify, setNotify] = useState({ enabled: true, channels: DEFAULT_CHANNELS });
  const [toast, showToast] = useToast();

  const params = { metric, classId, assignmentId };
  const entries = rankings(scope, params);
  const shown = showAll ? entries : entries.slice(0, PAGE);
  const podium = entries.slice(0, 3);
  const unit = scope === "challenge" ? "score" : metric;

  // One simulated score update: a random active student earns XP, and every entry whose
  // position changed in the current view gets a movement arrow and a brief highlight.
  // `pick` and `step` are random numbers in [0, 1) supplied by the timer, along with the time.
  const tick = useEffectEvent((pick, step, now) => {
    const roster = listStudents().filter((s) => s.status === "active");
    const student = roster[Math.floor(pick * roster.length)];
    const amount = 20 + Math.floor(step * 10) * 15;
    const before = new Map(rankings(scope, params).map((e) => [e.id, e.rank]));
    const instBefore = rankings("institution", { metric: "xp" }).find((e) => e.id === student.id)?.rank;
    awardXp(student.id, amount);
    const after = rankings(scope, params);
    const instAfter = rankings("institution", { metric: "xp" }).find((e) => e.id === student.id)?.rank;

    const changed = {};
    after.forEach((e) => {
      const prev = before.get(e.id);
      if (prev && prev !== e.rank) changed[e.id] = prev - e.rank;
    });
    setMoves((m) => ({ ...m, ...changed }));
    setFlash((f) => ({ ...f, ...Object.fromEntries(Object.keys(changed).concat(student.id).map((id) => [id, now])) }));

    let notified = false;
    if (notify.enabled && instAfter <= 10 && instBefore > 10) {
      sendNotification({
        kind: "rank",
        title: `${student.name} entered the top 10 (#${instAfter})`,
        audience: student.name,
        count: 1,
        channels: notify.channels,
        refId: "lb",
      });
      notified = true;
    }
    setFeed((items) => [{ id: `${now}-${student.id}`, name: student.name, amount, from: instBefore, to: instAfter, at: now, notified }, ...items].slice(0, 8));
    setLastTick(now);
  });

  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => tick(Math.random(), Math.random(), Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [live]);

  const changeScope = (next) => {
    setScope(next);
    setShowAll(false);
    setMoves({});
  };

  const metricLabel = (e) => (unit === "score" ? (e.score ?? "—") : `${formatXp(e.xp)} XP`);
  const activeAssignments = assignments.filter((a) => deadlineState(a).tone !== "closed" || a.id === assignmentId);
  const scopeTitle = {
    institution: "All students in your institute",
    class: "Students in one class",
    challenge: "Students working on one challenge",
    team: "Teams in your institute",
    global: "Top students across the platform",
  }[scope];

  return (
    <div className="stu-page">
      <PageHero
        eyebrow={`Insights · ${sampleDashboard.institute_name}`}
        title="Leaderboard"
        summary={live ? "Live · rankings update as scores come in" : "Paused · rankings are not updating"}
        description="Rank students by XP and scores across the institute, a class, a challenge or a team."
        actions={
          <button type="button" className="inst-btn inst-btn--outline" aria-pressed={live} onClick={() => setLive((v) => !v)}>
            <span className={`lb-live-dot${live ? " is-live" : ""}`} aria-hidden="true" />
            {live ? "Pause live updates" : "Resume live updates"}
          </button>
        }
      />

      <Tabs tabs={SCOPES} value={scope} onChange={changeScope} label="Leaderboard type" idPrefix="lb" />

      <div className="inst-card grp-team-toolbar lb-toolbar">
        <strong className="lb-scope-title">{scopeTitle}</strong>
        {scope === "class" && (
          <label className="stu-select">
            <span className="inst-sr-only">Class</span>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setMoves({}); }}>
              {grades.map((g) => (
                <optgroup key={g.id} label={g.name}>
                  <option value={g.id}>All of {g.name}</option>
                  {g.sections.map((s) => <option key={s.id} value={s.id}>{g.name} · {s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        {scope === "challenge" && (
          <label className="stu-select">
            <span className="inst-sr-only">Challenge</span>
            <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
              {activeAssignments.map((a) => (
                <option key={a.id} value={a.id}>{challengeById(a.challengeId)?.title} · {targetLabel(a.target)}</option>
              ))}
            </select>
          </label>
        )}
        {scope !== "challenge" && (
          <div className="inst-segmented" role="group" aria-label="Rank by">
            <button type="button" aria-pressed={metric === "xp"} className={metric === "xp" ? "is-on" : ""} onClick={() => { setMetric("xp"); setMoves({}); }}>XP</button>
            <button type="button" aria-pressed={metric === "score"} className={metric === "score" ? "is-on" : ""} onClick={() => { setMetric("score"); setMoves({}); }}>Avg score</button>
          </div>
        )}
        <span className="stu-results">{entries.length} ranked</span>
      </div>

      <div id="lb-panel" role="tabpanel" aria-labelledby={`lb-tab-${scope}`} className="lb-layout">
        <div className="lb-main">
          {podium.length > 0 && (
            <ol className="lb-podium" aria-label="Top three">
              {podium.map((e) => (
                <li key={e.id} className={`lb-podium-${e.rank}${e.ours ? "" : " is-external"}`}>
                  <span className="lb-medal">{e.rank}</span>
                  <span className={`stu-avatar stu-avatar--lg ${e.kind === "team" ? "grp-team-badge" : `stu-avatar--${avatarTone(e.id)}`}`} aria-hidden="true">
                    {initials(e.name)}
                  </span>
                  <strong>{e.name}</strong>
                  <small>{e.detail}</small>
                  <span className="lb-podium-value">{metricLabel(e)}</span>
                </li>
              ))}
            </ol>
          )}

          <section className="inst-card stu-list" aria-label="Rankings">
            <div className="stu-table-wrap">
              <table className="stu-table lb-table">
                <thead>
                  <tr>
                    <th scope="col" className="lb-col-rank">Rank</th>
                    {scope !== "challenge" && <th scope="col" className="lb-col-move">Move</th>}
                    <th scope="col">{scope === "team" ? "Team" : "Student"}</th>
                    {scope === "challenge" ? (
                      <>
                        <th scope="col">Status</th>
                        <th scope="col" className="lb-num">Challenge score</th>
                      </>
                    ) : (
                      <>
                        {scope !== "team" && <th scope="col">Level</th>}
                        <th scope="col" className="lb-num">{scope === "team" ? "Total XP" : "XP"}</th>
                        <th scope="col" className="lb-num">Avg score</th>
                        <th scope="col" className="lb-num">Completed</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id} className={`${lastTick - (flash[e.id] ?? 0) < FLASH_MS ? "is-flash" : ""}${e.ours ? "" : " is-external"}`}>
                      <td className="lb-col-rank"><span className={`lb-rank${e.rank <= 3 ? ` lb-rank--${e.rank}` : ""}`}>{e.rank}</span></td>
                      {scope !== "challenge" && <td className="lb-col-move"><Movement delta={moves[e.id]} /></td>}
                      <td>
                        <div className="stu-person">
                          <span className={`stu-avatar ${e.kind === "team" ? "grp-team-badge" : `stu-avatar--${avatarTone(e.id)}`}`} aria-hidden="true">{initials(e.name)}</span>
                          <div>
                            <strong className="asg-target">{e.name}</strong>
                            <span className="stu-email">{e.detail}</span>
                          </div>
                        </div>
                      </td>
                      {scope === "challenge" ? (
                        <>
                          <td><span className={`stu-tag stu-tag--${e.status === "submitted" ? "ok" : "info"}`}>{e.status === "submitted" ? "Submitted" : `Phase ${e.phase} of 4`}</span></td>
                          <td className="lb-num"><strong className="asg-target">{e.score ?? "—"}</strong></td>
                        </>
                      ) : (
                        <>
                          {scope !== "team" && (
                            <td className="lb-level">
                              {e.level ? <><strong>Level {e.level.level}</strong><small>{e.level.title}</small></> : "—"}
                            </td>
                          )}
                          <td className="lb-num"><strong className="asg-target">{formatXp(e.xp)}</strong></td>
                          <td className="lb-num">{e.score ?? "—"}</td>
                          <td className="lb-num">{e.completed}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!entries.length && (
                <div className="stu-empty">
                  <span className="stu-drop-icon"><Icon name="leaderboard" size={22} /></span>
                  <strong>No rankings yet</strong>
                  <span>{scope === "challenge" ? "Nobody has started this challenge yet." : "No active students here yet."}</span>
                </div>
              )}
            </div>
            {entries.length > PAGE && (
              <div className="stu-pager">
                <span>Showing {shown.length} of {entries.length}</span>
                <button type="button" className="inst-pill-btn" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? `Show top ${PAGE}` : `Show all ${entries.length}`}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="lb-side">
          <section className="inst-card lb-feed" aria-labelledby="lb-feed-title">
            <h2 id="lb-feed-title" className="inst-card-title">
              <span className={`lb-live-dot${live ? " is-live" : ""}`} aria-hidden="true" /> Live activity
            </h2>
            <p className="inst-card-sub">{live ? "New XP appears here as students earn it." : "Paused. Resume to see new activity."}</p>
            {feed.length ? (
              <ol className="lb-feed-list" aria-live="polite">
                {feed.map((f) => (
                  <li key={f.id}>
                    <span className="lb-feed-xp">+{f.amount}</span>
                    <span className="grp-person-text">
                      <strong>{f.name}</strong>
                      <small>
                        {f.from === f.to ? `Holds #${f.to}` : `#${f.from} → #${f.to}`}
                        {f.notified ? " · notified" : ""}
                      </small>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="stu-muted">Waiting for the next update…</p>
            )}
          </section>

          <section className="inst-card lb-notify" aria-labelledby="lb-notify-title">
            <h2 id="lb-notify-title" className="inst-card-title">Ranking notifications</h2>
            <p className="inst-card-sub">Tell students when they move into the institution's top 10.</p>
            <label className="grp-check-all">
              <input
                type="checkbox" checked={notify.enabled}
                onChange={(e) => {
                  setNotify({ ...notify, enabled: e.target.checked });
                  showToast(e.target.checked ? "Ranking notifications turned on." : "Ranking notifications turned off.");
                }}
              />
              Send leaderboard updates
            </label>
            {notify.enabled && <ChannelPicker value={notify.channels} onChange={(channels) => setNotify({ ...notify, channels })} legend="Send by" />}
            <h3 className="asg-log-title">Recently sent</h3>
            <NotificationLog items={listNotifications("lb").slice(0, 4)} empty="No ranking notifications yet." />
          </section>
        </aside>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
