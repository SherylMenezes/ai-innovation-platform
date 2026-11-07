// Rankings for the Leaderboard page (BRD 10.3, AI055–AI057). Built from the live roster, so XP
// changes show up immediately. The "global" view mixes in sample students from other institutes.

import { participation, assignmentById } from "./assignmentsData";
import { listTeams } from "./groupsData";
import { levelFor, listStudents } from "./studentsData";

export const SCOPES = [
  { key: "institution", label: "Institution", icon: "dashboard" },
  { key: "class", label: "Class", icon: "groups" },
  { key: "challenge", label: "Challenge", icon: "challenges" },
  { key: "team", label: "Team", icon: "students" },
  { key: "global", label: "Global", icon: "leaderboard" },
];

const byMetric = (metric) => (a, b) =>
  (metric === "score" ? (b.score ?? -1) - (a.score ?? -1) || b.xp - a.xp : b.xp - a.xp || (b.score ?? -1) - (a.score ?? -1))
  || a.name.localeCompare(b.name);

const studentEntry = (s) => ({
  id: s.id,
  kind: "student",
  name: s.name,
  detail: `${s.gradeName} · ${s.sectionName}`,
  xp: s.xp,
  score: s.avgScore,
  completed: s.completed,
  level: levelFor(s.xp),
  ours: true,
});

function rank(entries, metric) {
  return [...entries].sort(byMetric(metric)).map((e, i) => ({ ...e, rank: i + 1 }));
}

function institution(metric, classId) {
  const roster = listStudents().filter((s) => s.status === "active");
  const scoped = classId ? roster.filter((s) => s.gradeId === classId || s.sectionId === classId) : roster;
  return rank(scoped.map(studentEntry), metric);
}

function teams(metric) {
  const roster = new Map(listStudents().map((s) => [s.id, s]));
  return rank(listTeams().map((t) => {
    const members = t.memberIds.map((id) => roster.get(id)).filter(Boolean);
    const scored = members.filter((m) => m.avgScore != null);
    return {
      id: t.id,
      kind: "team",
      name: t.name,
      detail: `${members.length} members`,
      xp: members.reduce((s, m) => s + m.xp, 0),
      score: scored.length ? Math.round(scored.reduce((s, m) => s + m.avgScore, 0) / scored.length) : null,
      completed: members.reduce((s, m) => s + m.completed, 0),
      level: null,
      ours: true,
    };
  }), metric);
}

// Challenge-wise: submitted work ranked by its score, then everyone still working on it by phase.
function challenge(assignmentId) {
  const a = assignmentById(assignmentId);
  if (!a) return [];
  const rows = participation(a).filter((r) => r.status !== "not-started");
  return rows
    .map((r) => ({ ...studentEntry(r.student), score: r.score, phase: r.phase, status: r.status, completed: r.status === "submitted" ? 1 : 0 }))
    .sort((x, y) => (y.score ?? -1) - (x.score ?? -1) || y.phase - x.phase || x.name.localeCompare(y.name))
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

const OTHER_SCHOOLS = ["Greenfield Academy", "Lotus Valley School", "Riverdale High", "Hillcrest International", "Bayview Public School"];
const OTHER_NAMES = ["Aditya", "Sneha", "Karan", "Pooja", "Nikhil", "Tanvi", "Rahul", "Shreya", "Varun", "Anjali", "Manav", "Prisha"];
const OTHER_LAST = ["Agarwal", "Bhosale", "Chatterjee", "Dutta", "Ghosh", "Hegde", "Khanna", "Mishra", "Nair", "Pandey"];
let others = null;

function otherInstitutes() {
  if (!others) {
    others = Array.from({ length: 60 }, (_, i) => {
      const xp = Math.round(4200 - i * 55 - ((i * 37) % 90));
      return {
        id: `ext-${i}`,
        kind: "student",
        name: `${OTHER_NAMES[(i * 5) % OTHER_NAMES.length]} ${OTHER_LAST[(i * 3) % OTHER_LAST.length]}`,
        detail: OTHER_SCHOOLS[i % OTHER_SCHOOLS.length],
        xp,
        score: 60 + ((i * 13) % 35),
        completed: 2 + (i % 4),
        level: levelFor(xp),
        ours: false,
      };
    });
  }
  return others;
}

function global(metric) {
  const ours = institution(metric).slice(0, 40).map((e) => ({ ...e, detail: `Your institute · ${e.detail}` }));
  return rank([...ours, ...otherInstitutes()], metric);
}

export function rankings(scope, { metric = "xp", classId = "", assignmentId = "" } = {}) {
  if (scope === "class") return classId ? institution(metric, classId) : [];
  if (scope === "challenge") return challenge(assignmentId);
  if (scope === "team") return teams(metric);
  if (scope === "global") return global(metric);
  return institution(metric);
}
