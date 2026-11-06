import { useEffect, useRef, useState } from "react";
import Icon from "./InstituteIcons";
import ClassFormDialog from "./ClassFormDialog";
import SectionDrawer from "./SectionDrawer";
import TeamDrawer from "./TeamDrawer";
import TeamFormDialog from "./TeamFormDialog";
import { ConfirmDialog, SectionSelect } from "./GroupsShared";
import { addSampleGrade, addSampleSection, sampleDashboard } from "./sampleData";
import {
  average, createTeam, deleteTeam, getSectionStaff, listTeams, staffById, teamInitials, teamScope, updateTeam,
} from "./groupsData";
import { getClassOptions, listStudents } from "./studentsData";
import { avatarTone, initials } from "./studentFormat";
import "./Students.css";
import StickerArt from "./StickerArt";
import groupsArt from "../../assets/institute-groups.webp";
import "./Groups.css";

const TABS = [
  { key: "classes", label: "Classes & sections", icon: "groups" },
  { key: "teams", label: "Teams", icon: "students" },
];

function SummaryTile({ icon, tone, label, value, note }) {
  return (
    <div className={`stu-tile grp-tile stu-tile--${tone}`}>
      <span className="stu-tile-icon"><Icon name={icon} size={18} /></span>
      <span className="stu-tile-text">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </span>
    </div>
  );
}

function ClassesTab({ grades, students, onOpenSection, onAddSection }) {
  const countFor = (sectionId) => students.filter((s) => s.sectionId === sectionId).length;
  const sections = grades.flatMap((g) => g.sections);
  const withoutMentor = sections.filter((s) => !getSectionStaff(s.id).mentorId).length;

  return (
    <>
      <div className="stu-tiles">
        <SummaryTile icon="groups" tone="all" label="Grades" value={grades.length} note={`${sections.length} sections in total`} />
        <SummaryTile icon="students" tone="active" label="Students placed" value={students.length} note="Every student has a section" />
        <SummaryTile icon="completion" tone="invited" label="Avg class size" value={sections.length ? Math.round(students.length / sections.length) : 0} note="Students per section" />
        <SummaryTile icon="alert" tone="deactivated" label="Sections without a mentor" value={withoutMentor} note={withoutMentor ? "Open a section to assign one" : "All sections covered"} />
      </div>

      <div className="grp-grades">
        {grades.map((grade) => {
          const total = grade.sections.reduce((sum, s) => sum + countFor(s.id), 0);
          return (
            <section key={grade.id} className="inst-card grp-grade" aria-labelledby={`grp-grade-${grade.id}`}>
              <header className="grp-grade-head">
                <div>
                  <h2 id={`grp-grade-${grade.id}`}>{grade.name}</h2>
                  <p>{total} student{total === 1 ? "" : "s"} · {grade.sections.length} section{grade.sections.length === 1 ? "" : "s"}</p>
                </div>
                <button type="button" className="inst-btn inst-btn--outline grp-btn-sm" onClick={() => onAddSection(grade.id)}>
                  <Icon name="plus" size={14} strokeWidth={2.4} /> Section
                </button>
              </header>

              {grade.sections.length ? (
                <ul className="grp-sections">
                  {grade.sections.map((section) => {
                    const staff = getSectionStaff(section.id);
                    const teacher = staffById(staff.classTeacherId);
                    const mentor = staffById(staff.mentorId);
                    const count = countFor(section.id);
                    return (
                      <li key={section.id}>
                        <button type="button" className="grp-section" onClick={() => onOpenSection(grade, section)}>
                          <span className="grp-section-badge" aria-hidden="true">{section.name.replace(/^section\s*/i, "").slice(0, 2)}</span>
                          <span className="grp-section-main">
                            <strong>{section.name}</strong>
                            <small>{teacher ? `Class teacher: ${teacher.name}` : "No class teacher"}</small>
                          </span>
                          <span className="grp-section-count"><strong>{count}</strong><small>students</small></span>
                          {mentor ? (
                            <span className={`stu-avatar grp-mini-avatar stu-avatar--${avatarTone(mentor.id)}`} title={`Mentor: ${mentor.name}`}>
                              {initials(mentor.name)}
                            </span>
                          ) : (
                            <span className="stu-tag stu-tag--warn">No mentor</span>
                          )}
                          <Icon name="chevron" size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grp-grade-empty">
                  <span>No sections yet.</span>
                  <button type="button" className="stu-clear" onClick={() => onAddSection(grade.id)}>Add the first section</button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function TeamsTab({ teams, students, grades, onOpenTeam, onCreate }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const byId = new Map(students.map((s) => [s.id, s]));
  const q = query.trim().toLowerCase();

  const shown = teams.filter((t) => {
    const members = t.memberIds.map((id) => byId.get(id)).filter(Boolean);
    if (classFilter && !members.some((m) => m.sectionId === classFilter)) return false;
    return !q || t.name.toLowerCase().includes(q) || members.some((m) => m.name.toLowerCase().includes(q));
  });
  const inTeams = new Set(teams.flatMap((t) => t.memberIds)).size;
  const noMentor = teams.filter((t) => !t.mentorId).length;

  return (
    <>
      <div className="stu-tiles">
        <SummaryTile icon="students" tone="all" label="Teams" value={teams.length} note={`Average ${teams.length ? Math.round(inTeams / teams.length) : 0} members`} />
        <SummaryTile icon="completion" tone="active" label="Students in teams" value={inTeams} note={`${students.filter((s) => s.status === "active").length - inTeams} active students not in a team`} />
        <SummaryTile icon="star" tone="invited" label="Leaders chosen" value={teams.filter((t) => t.leaderId).length} note="One per team" />
        <SummaryTile icon="alert" tone="deactivated" label="Teams without a mentor" value={noMentor} note={noMentor ? "Open a team to assign one" : "All teams covered"} />
      </div>

      <div className="inst-card grp-team-toolbar">
        <label className="stu-search">
          <Icon name="search" size={18} />
          <span className="inst-sr-only">Search teams</span>
          <input type="search" value={query} placeholder="Search teams or members" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="stu-select">
          <span className="inst-sr-only">Class</span>
          <SectionSelect grades={grades} value={classFilter} onChange={setClassFilter} placeholder="All classes" />
        </label>
        <span className="stu-results" aria-live="polite">{shown.length} of {teams.length} teams</span>
      </div>

      <div className="grp-teams">
        {shown.map((team) => {
          const members = team.memberIds.map((id) => byId.get(id)).filter(Boolean);
          const leader = byId.get(team.leaderId);
          const mentor = staffById(team.mentorId);
          return (
            <button key={team.id} type="button" className="inst-card grp-team" onClick={() => onOpenTeam(team.id)}>
              <span className="grp-team-head">
                <span className="grp-team-badge" aria-hidden="true">{teamInitials(team.name)}</span>
                <span className="grp-team-title">
                  <strong>{team.name}</strong>
                  <small>{teamScope(members)}</small>
                </span>
              </span>
              <span className="grp-avatars" aria-label={`${members.length} members`}>
                {members.slice(0, 5).map((m) => (
                  <span key={m.id} className={`stu-avatar grp-mini-avatar stu-avatar--${avatarTone(m.id)}`} title={m.name} aria-hidden="true">
                    {initials(m.name)}
                  </span>
                ))}
                {members.length > 5 && <span className="stu-avatar grp-mini-avatar grp-avatar-more" aria-hidden="true">+{members.length - 5}</span>}
                <span className="grp-member-count">{members.length} members</span>
              </span>
              <span className="grp-team-roles">
                <span><Icon name="star" size={14} /> <em>Leader</em> {leader ? leader.name : "Not chosen"}</span>
                <span className={mentor ? undefined : "is-missing"}>
                  <Icon name="students" size={14} /> <em>Mentor</em> {mentor ? mentor.name : "Not assigned"}
                </span>
              </span>
              <span className="grp-team-foot">
                <span>Avg score <strong>{average(members.map((m) => m.avgScore)) ?? "—"}</strong></span>
                <span>Avg progress <strong>{average(members.map((m) => m.progress)) ?? "—"}%</strong></span>
              </span>
            </button>
          );
        })}
        {!q && !classFilter && (
          <button type="button" className="grp-team-new" onClick={onCreate}>
            <span className="stu-drop-icon"><Icon name="plus" size={22} /></span>
            <strong>Create a team</strong>
            <small>Group students and pick a leader</small>
          </button>
        )}
      </div>
      {!shown.length && (q || classFilter) && (
        <div className="stu-empty inst-card">
          <span className="stu-drop-icon"><Icon name="search" size={22} /></span>
          <strong>No teams match</strong>
          <span>Try another name or class.</span>
        </div>
      )}
    </>
  );
}

export default function GroupsPage() {
  const [tab, setTab] = useState("classes");
  // Data lives in the sample modules; bumping this re-reads it after a change.
  const [, setVersion] = useState(0);
  const [classForm, setClassForm] = useState(null); // { mode: "grade" | "section", gradeId? }
  const [openSection, setOpenSection] = useState(null); // { grade, section }
  const [teamForm, setTeamForm] = useState(null); // { team? }
  const [openTeamId, setOpenTeamId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const tabRefs = useRef({});

  const grades = getClassOptions();
  const students = listStudents();
  const teams = listTeams();
  const sectionCount = grades.reduce((sum, g) => sum + g.sections.length, 0);
  const openTeam = teams.find((t) => t.id === openTeamId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = (message) => {
    setVersion((v) => v + 1);
    if (message) setToast((t) => ({ id: (t?.id ?? 0) + 1, message }));
  };

  // Arrow keys move between tabs, as in a standard tablist.
  const onTabKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].key;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const saveClass = (fields) => {
    if (classForm.mode === "grade") {
      const gradeId = addSampleGrade(fields.gradeName);
      fields.sectionNames.forEach((name) => addSampleSection(gradeId, name, 0));
      refresh(`${fields.gradeName} added${fields.sectionNames.length ? ` with ${fields.sectionNames.length} section${fields.sectionNames.length === 1 ? "" : "s"}` : ""}.`);
    } else {
      addSampleSection(fields.gradeId, fields.sectionName, 0);
      refresh(`${fields.sectionName} added to ${grades.find((g) => g.id === fields.gradeId).name}.`);
    }
  };

  const saveTeam = (fields) => {
    if (teamForm.team) {
      updateTeam(teamForm.team.id, fields);
      refresh(`Saved ${fields.name.trim()}.`);
    } else {
      const team = createTeam(fields);
      refresh(`Created ${team.name} with ${team.memberIds.length} members.`);
    }
  };

  return (
    <div className="stu-page grp-page">
      <header className="inst-header stu-hero">
        <div className="inst-header-main">
          <div>
            <p className="stu-hero-eyebrow">Manage · {sampleDashboard.institute_name}</p>
            <h1 className="inst-title inst-header-name">Groups</h1>
          </div>
          <div className="inst-header-row">
            <div>
              <p className="inst-header-label">
                {grades.length} grades · {sectionCount} sections · {teams.length} teams
              </p>
              <p className="inst-subtitle">Organise students into classes, sections and teams, and choose who mentors each one.</p>
            </div>
            <div className="inst-actions">
              {tab === "classes" ? (
                <>
                  <button type="button" className="inst-btn inst-btn--outline" onClick={() => setClassForm({ mode: "section" })}>
                    <Icon name="plus" size={16} strokeWidth={2.4} /> Add section
                  </button>
                  <button type="button" className="inst-btn inst-btn--primary" onClick={() => setClassForm({ mode: "grade" })}>
                    <Icon name="plus" size={18} strokeWidth={2.4} /> Add grade
                  </button>
                </>
              ) : (
                <button type="button" className="inst-btn inst-btn--primary" onClick={() => setTeamForm({})}>
                  <Icon name="plus" size={18} strokeWidth={2.4} /> Create team
                </button>
              )}
            </div>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={groupsArt} baseRotate={-4} />
      </header>

      <div className="grp-tabs" role="tablist" aria-label="Group type">
        {TABS.map((t) => (
          <button
            key={t.key}
            ref={(el) => { tabRefs.current[t.key] = el; }}
            type="button"
            role="tab"
            id={`grp-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`grp-panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            className={tab === t.key ? "is-on" : undefined}
            onClick={() => setTab(t.key)}
            onKeyDown={onTabKey}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            <span className="grp-tab-count">{t.key === "classes" ? sectionCount : teams.length}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`grp-panel-${tab}`} aria-labelledby={`grp-tab-${tab}`} className="stu-page">
        {tab === "classes" ? (
          <ClassesTab
            grades={grades} students={students}
            onOpenSection={(grade, section) => setOpenSection({ grade, section })}
            onAddSection={(gradeId) => setClassForm({ mode: "section", gradeId })}
          />
        ) : (
          <TeamsTab
            teams={teams} students={students} grades={grades}
            onOpenTeam={setOpenTeamId} onCreate={() => setTeamForm({})}
          />
        )}
      </div>

      {openSection && (
        <SectionDrawer
          grade={openSection.grade} section={openSection.section} grades={grades} students={students}
          onChanged={refresh} onClose={() => setOpenSection(null)}
        />
      )}
      {openTeam && (
        <TeamDrawer
          team={openTeam} students={students}
          onChanged={refresh}
          onEdit={(team) => setTeamForm({ team })}
          onDelete={setDeleting}
          onClose={() => setOpenTeamId(null)}
        />
      )}
      {classForm && (
        <ClassFormDialog
          mode={classForm.mode} grades={grades} defaultGradeId={classForm.gradeId}
          onSubmit={saveClass} onClose={() => setClassForm(null)}
        />
      )}
      {teamForm && (
        <TeamFormDialog
          team={teamForm.team} students={students} grades={grades}
          onSubmit={saveTeam} onClose={() => setTeamForm(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          body="The team is removed and its members become free to join another team. Their XP, scores and history are not affected."
          confirmLabel="Delete team"
          onConfirm={() => {
            deleteTeam(deleting.id);
            setOpenTeamId(null);
            refresh(`Deleted ${deleting.name}.`);
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      <div className="stu-toast-region" role="status">
        {toast && (
          <div key={toast.id} className="stu-toast">
            <Icon name="check" size={16} /> {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
