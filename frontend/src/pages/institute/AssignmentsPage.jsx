import { useState } from "react";
import Icon from "./InstituteIcons";
import AssignDialog from "./AssignDialog";
import AssignmentDrawer from "./AssignmentDrawer";
import useToast from "./useToast";
import { ConfirmDialog } from "./GroupsShared";
import { PageHero, Tabs, Toast } from "./InstituteShared";
import {
  deadlineState, deleteAssignment, listAssignments, participation, sendReminder, summarise, targetLabel,
} from "./assignmentsData";
import { challengeById, typeLabel } from "./challengesData";
import { STATUS } from "./chartPalette";
import { sampleDashboard } from "./sampleData";
import { formatDate } from "./studentFormat";
import assignmentsArt from "../../assets/institute-assignments.webp";
import "./Students.css";
import "./Groups.css";
import "./InstituteModules.css";

function Meter({ value, total, color, label }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="asg-meter" role="img" aria-label={`${label}: ${value} of ${total} (${pct}%)`}>
      <span className="asg-meter-track"><span style={{ width: `${pct}%`, background: color }} /></span>
      <span className="asg-meter-text"><strong>{pct}%</strong> {value}/{total}</span>
    </div>
  );
}

export default function AssignmentsPage() {
  const [, setVersion] = useState(0);
  const [view, setView] = useState("active");
  const [query, setQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [toast, showToast] = useToast();

  const refresh = (message) => {
    setVersion((v) => v + 1);
    if (message) showToast(message);
  };

  const rows = listAssignments().map((a) => {
    const stats = summarise(participation(a));
    return { a, challenge: challengeById(a.challengeId), stats, state: deadlineState(a) };
  });
  const active = rows.filter((r) => r.state.tone !== "closed");
  const closed = rows.filter((r) => r.state.tone === "closed");
  const q = query.trim().toLowerCase();
  const shown = (view === "active" ? active : view === "closed" ? closed : rows)
    .filter((r) => !q || r.challenge?.title.toLowerCase().includes(q) || targetLabel(r.a.target).toLowerCase().includes(q))
    .sort((x, y) => x.a.dueOn - y.a.dueOn);
  const dueSoon = active.filter((r) => r.state.days <= 7).length;
  const avg = (key) => (active.length ? Math.round(active.reduce((s, r) => s + r.stats[key], 0) / active.length) : 0);
  const open = listAssignments().find((a) => a.id === openId);

  return (
    <div className="stu-page">
      <PageHero
        eyebrow={`Manage · ${sampleDashboard.institute_name}`}
        title="Assignments"
        art={assignmentsArt}
        summary={`${active.length} active · ${dueSoon} due this week · ${closed.length} closed`}
        description="Assign challenges, set and manage deadlines, and see who has taken part and who has submitted."
        actions={
          <button type="button" className="inst-btn inst-btn--primary" onClick={() => setAssigning(true)}>
            <Icon name="plus" size={18} strokeWidth={2.4} /> Assign challenge
          </button>
        }
      />

      <div className="stu-tiles">
        <div className="stu-tile grp-tile stu-tile--all"><span className="stu-tile-icon"><Icon name="assignments" size={18} /></span>
          <span className="stu-tile-text"><span>Active assignments</span><strong>{active.length}</strong><small>{rows.length} in total</small></span></div>
        <div className="stu-tile grp-tile stu-tile--invited"><span className="stu-tile-icon"><Icon name="calendar" size={18} /></span>
          <span className="stu-tile-text"><span>Due this week</span><strong>{dueSoon}</strong><small>Within the next 7 days</small></span></div>
        <div className="stu-tile grp-tile stu-tile--active"><span className="stu-tile-icon"><Icon name="students" size={18} /></span>
          <span className="stu-tile-text"><span>Avg participation</span><strong>{avg("participationRate")}%</strong><small>Students who have started</small></span></div>
        <div className="stu-tile grp-tile stu-tile--deactivated"><span className="stu-tile-icon"><Icon name="completion" size={18} /></span>
          <span className="stu-tile-text"><span>Avg completion</span><strong>{avg("completionRate")}%</strong><small>Students who have submitted</small></span></div>
      </div>

      <Tabs
        tabs={[
          { key: "active", label: "Active", icon: "assignments", count: active.length },
          { key: "closed", label: "Closed", icon: "completion", count: closed.length },
          { key: "all", label: "All", icon: "groups", count: rows.length },
        ]}
        value={view} onChange={setView} label="Assignments" idPrefix="asg"
      />

      <section id="asg-panel" role="tabpanel" aria-labelledby={`asg-tab-${view}`} className="inst-card stu-list">
        <div className="stu-toolbar">
          <label className="stu-search">
            <Icon name="search" size={18} />
            <span className="inst-sr-only">Search assignments</span>
            <input type="search" value={query} placeholder="Search by challenge or group" onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="ch-legend asg-legend">
            <li><i style={{ background: STATUS["in-progress"] }} aria-hidden="true" />Taking part (started or submitted)</li>
            <li><i style={{ background: STATUS.submitted }} aria-hidden="true" />Submitted</li>
          </ul>
        </div>
        <div className="stu-table-wrap">
          <table className="stu-table asg-table">
            <thead>
              <tr>
                <th scope="col" className="asg-col-challenge">Challenge</th>
                <th scope="col">Assigned to</th>
                <th scope="col">Deadline</th>
                <th scope="col">Participation</th>
                <th scope="col">Completion</th>
                <th scope="col" className="asg-col-actions"><span className="inst-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ a, challenge, stats, state }) => (
                <tr key={a.id} onClick={() => setOpenId(a.id)}>
                  <td>
                    <button type="button" className="stu-name" onClick={(e) => { e.stopPropagation(); setOpenId(a.id); }}>{challenge?.title}</button>
                    <span className="stu-email">{typeLabel(challenge?.type)}{challenge?.theme ? ` · ${challenge.theme}` : ""}</span>
                  </td>
                  <td>
                    <strong className="asg-target">{targetLabel(a.target)}</strong>
                    <span className="stu-email">{stats.total} students</span>
                  </td>
                  <td>
                    <strong className="asg-target">{formatDate(a.dueOn)}</strong>
                    <span className={`asg-due asg-due--${state.tone}`}>{state.label}</span>
                  </td>
                  <td><Meter value={stats.participated} total={stats.total} color={STATUS["in-progress"]} label="Taking part" /></td>
                  <td><Meter value={stats.submitted} total={stats.total} color={STATUS.submitted} label="Submitted" /></td>
                  <td className="stu-col-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="stu-row-actions">
                      {state.tone !== "closed" && (
                        <button
                          type="button" className="stu-icon-btn" title="Send reminder" aria-label={`Remind students about ${challenge?.title}`}
                          onClick={() => {
                            const n = sendReminder(a.id);
                            refresh(n ? `Reminder sent to ${n} students who haven't submitted ${challenge?.title}.` : "Everyone has submitted.");
                          }}
                        >
                          <Icon name="mail" size={16} />
                        </button>
                      )}
                      <button type="button" className="stu-icon-btn" title="Open" aria-label={`Open ${challenge?.title}`} onClick={() => setOpenId(a.id)}>
                        <Icon name="chevron" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && (
            <div className="stu-empty">
              <span className="stu-drop-icon"><Icon name="assignments" size={22} /></span>
              <strong>{q ? "No assignments match" : view === "closed" ? "No closed assignments yet" : "Nothing assigned yet"}</strong>
              {!q && view !== "closed" && (
                <button type="button" className="inst-btn inst-btn--primary" onClick={() => setAssigning(true)}>Assign a challenge</button>
              )}
            </div>
          )}
        </div>
      </section>

      {open && (
        <AssignmentDrawer
          key={open.id}
          assignment={open}
          onChanged={refresh}
          onRemove={setRemoving}
          onClose={() => setOpenId(null)}
        />
      )}
      {assigning && (
        <AssignDialog
          onAssigned={({ assignment, reached }) => {
            setView("active");
            refresh(`${challengeById(assignment.challengeId)?.title} assigned to ${targetLabel(assignment.target)} (${reached} students), due ${formatDate(assignment.dueOn)}.`);
          }}
          onClose={() => setAssigning(false)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${challengeById(removing.challengeId)?.title}?`}
          body="Students will no longer see this assignment. Work they've already submitted is kept in their history."
          confirmLabel="Remove assignment"
          onConfirm={() => {
            deleteAssignment(removing.id);
            setOpenId(null);
            refresh("Assignment removed.");
          }}
          onClose={() => setRemoving(null)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
