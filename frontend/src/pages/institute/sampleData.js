// TEMP: placeholder data so the institute panel renders without a login or backend.
// Remove once institute accounts are set up and the panel reads from the API.

const SECTIONS = {
  "g8": { name: "Grade 8", children: ["g8a", "g8b"] },
  "g9": { name: "Grade 9", children: ["g9a", "g9b"] },
  "g10": { name: "Grade 10", children: ["g10a", "g10b"] },
  "g11": { name: "Grade 11", children: ["g11a"] },
  "g12": { name: "Grade 12", children: ["g12a", "g12b"] },
  "g8a": { name: "Section A", stats: [30, 58, 66, 1360] },
  "g8b": { name: "Section B", stats: [29, 52, 61, 1210] },
  "g9a": { name: "Section A", stats: [32, 68, 71, 1840] },
  "g9b": { name: "Section B", stats: [30, 54, 64, 1420] },
  "g10a": { name: "Section A", stats: [35, 81, 78, 2310] },
  "g10b": { name: "Section B", stats: [33, 47, 59, 1180] },
  "g11a": { name: "Section A", stats: [28, 74, 82, 2650] },
  "g12a": { name: "Section A", stats: [26, 86, 84, 3120] },
  "g12b": { name: "Section B", stats: [24, 79, 80, 2890] },
};

const TOP_LEVEL = ["g8", "g9", "g10", "g11", "g12"];

const STUDENT_NAMES = [
  "Aarav Mehta", "Diya Nair", "Kabir Singh", "Ananya Rao", "Vihaan Patel",
  "Isha Kulkarni", "Arjun Desai", "Meera Iyer", "Rohan Joshi", "Sara Fernandes",
];

function leafRow(id) {
  const [student_count, completion_percent, avg_ai_score, avg_xp] = SECTIONS[id].stats;
  return { id, name: SECTIONS[id].name, has_children: false, student_count, completion_percent, avg_ai_score, avg_xp };
}

function groupRow(id) {
  const node = SECTIONS[id];
  if (!node.children) return leafRow(id);
  const leaves = node.children.map(leafRow);
  const students = leaves.reduce((sum, r) => sum + r.student_count, 0);
  // A grade with no students yet (e.g. just created) averages to zero rather than NaN.
  const avg = (key) => (students ? leaves.reduce((sum, r) => sum + r[key] * r.student_count, 0) / students : 0);
  return {
    id,
    name: node.name,
    has_children: true,
    student_count: students,
    completion_percent: avg("completion_percent"),
    avg_ai_score: avg("avg_ai_score"),
    avg_xp: avg("avg_xp"),
  };
}

export function getSampleGroupOptions() {
  return TOP_LEVEL.flatMap((id) => [
    { id, name: SECTIONS[id].name, depth: 0, has_children: true },
    ...SECTIONS[id].children.map((child) => ({
      id: child, name: `${SECTIONS[id].name} ${SECTIONS[child].name}`, depth: 1, has_children: false,
    })),
  ]);
}

// Adds a section in memory only; it is gone after a page reload.
// A new section starts with no progress, so its stats are zero apart from the student count.
export function addSampleSection(gradeId, name, studentCount) {
  const grade = SECTIONS[gradeId];
  let n = grade.children.length;
  let id;
  do id = `${gradeId}-new${++n}`; while (SECTIONS[id]);
  SECTIONS[id] = { name, stats: [studentCount, 0, 0, 0], isNew: true };
  grade.children.push(id);
  sampleDashboard.stats.total_students += studentCount;
  return id;
}

const gradeNumber = (name) => Number(name.match(/\d+/)?.[0] ?? Infinity);

// Adds an empty grade in memory, kept in numeric order ("Grade 7" lands before "Grade 8").
export function addSampleGrade(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "grade";
  let id = `g-${slug}`;
  for (let n = 2; SECTIONS[id]; n++) id = `g-${slug}-${n}`;
  SECTIONS[id] = { name, children: [] };
  const at = TOP_LEVEL.findIndex((g) => gradeNumber(SECTIONS[g].name) > gradeNumber(name));
  TOP_LEVEL.splice(at === -1 ? TOP_LEVEL.length : at, 0, id);
  return id;
}

// Keeps section sizes in step when students move between sections (the total is unchanged).
export function adjustSampleSectionCount(sectionId, delta) {
  const node = SECTIONS[sectionId];
  if (node?.stats) node.stats[0] = Math.max(0, node.stats[0] + delta);
}

export function sampleGroupSummary(parentId) {
  if (!parentId) return { level_label: "Grade", groups: TOP_LEVEL.map(groupRow) };
  return { level_label: "Section", groups: (SECTIONS[parentId]?.children ?? []).map(groupRow) };
}

export function sampleGroupStudents(groupId) {
  const node = SECTIONS[groupId];
  if (node?.isNew) {
    return {
      students: Array.from({ length: node.stats[0] }, (_, i) => ({
        id: `${groupId}-s${i}`, name: `Student ${i + 1}`, completion_percent: 0, avg_ai_score: 0, avg_xp: 0,
      })),
    };
  }
  const [, completion, score, xp] = node?.stats ?? [0, 60, 70, 1500];
  return {
    students: STUDENT_NAMES.map((name, i) => ({
      id: `${groupId}-s${i}`,
      name,
      completion_percent: Math.max(0, Math.min(100, completion + (i % 5) * 7 - 14)),
      avg_ai_score: Math.max(0, Math.min(100, score + (i % 4) * 5 - 8)),
      avg_xp: Math.max(0, xp + (i % 6) * 220 - 550),
    })),
  };
}

const FUNNEL_STAGES = [
  { key: "started", label: "Started" },
  { key: "canvas", label: "Problem canvas" },
  { key: "ideation", label: "Ideation" },
  { key: "evaluation", label: "Evaluation" },
  { key: "submitted", label: "Submitted" },
];

// How the drop between "started" and "submitted" splits across the four steps.
// Each section gets one (picked from its id) so the biggest drop differs between classes.
const DROP_PATTERNS = [
  [0.15, 0.2, 0.45, 0.2],
  [0.1, 0.45, 0.25, 0.2],
  [0.35, 0.2, 0.25, 0.2],
  [0.15, 0.25, 0.2, 0.4],
];

const hash = (s) => [...s].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

function sectionFunnelCounts(id) {
  const { stats: [students, completion], isNew } = SECTIONS[id];
  if (isNew || !students) return FUNNEL_STAGES.map(() => 0);
  const h = hash(id);
  const started = Math.round(students * (0.9 + (h % 5) * 0.02));
  const submitted = Math.min(started, Math.round(students * (completion / 100) * 0.9));
  const pattern = DROP_PATTERNS[h % DROP_PATTERNS.length];
  let dropped = 0;
  return [started, ...pattern.map((share) => {
    dropped += share;
    return Math.round(started - (started - submitted) * dropped);
  })];
}

function leafIds(id) {
  if (!id) return TOP_LEVEL.flatMap(leafIds);
  const node = SECTIONS[id];
  return node?.children ? node.children : node ? [id] : [];
}

function groupLabel(id) {
  if (!id) return "All classes";
  const parent = TOP_LEVEL.find((g) => SECTIONS[g].children.includes(id));
  return parent ? `${SECTIONS[parent].name} ${SECTIONS[id].name}` : SECTIONS[id]?.name ?? "";
}

// Funnel for a grade, a section, or the whole institution (no id): section counts are summed.
export function sampleFunnel(groupId) {
  const leaves = leafIds(groupId);
  const totals = FUNNEL_STAGES.map(() => 0);
  for (const id of leaves) sectionFunnelCounts(id).forEach((n, i) => (totals[i] += n));
  return {
    assignment_title: "Smart Campus Waste Challenge",
    group_name: groupLabel(groupId),
    student_count: leaves.reduce((sum, id) => sum + SECTIONS[id].stats[0], 0),
    stages: FUNNEL_STAGES.map((stage, i) => ({ ...stage, count: totals[i] })),
  };
}

export const sampleDashboard = {
  institute_name: "Sunrise Public School",
  invite_code: "DEMO-4821",
  stats: {
    total_students: 267,
    active_now: 38,
    active_assignments: 8,
    due_this_week: 3,
    completion_percent: 67,
    completion_change: 4,
    avg_ai_score: 71,
  },
  attention: [
    {
      id: "a1", severity: "high", title: "Grade 10 Section B is falling behind",
      detail: "47% completion, lowest in the institution", action_label: "View class", action_section: "groups",
    },
    {
      id: "a2", severity: "medium", title: "Assignment due in 2 days",
      detail: "Smart Campus Waste Challenge · 41 not submitted", action_label: "Open", action_section: "assignments",
    },
    {
      id: "a3", severity: "info", title: "5 submissions waiting for review",
      detail: "AI scored, mentor feedback pending", action_label: "Review", action_section: "reports",
    },
  ],
  top_students: [
    { id: "t1", name: "Rohan Joshi", section: "Grade 12 A", title: "Visionary", total_xp: 5240 },
    { id: "t2", name: "Meera Iyer", section: "Grade 11 A", title: "Innovator", total_xp: 4820 },
    { id: "t3", name: "Kabir Singh", section: "Grade 10 A", title: "Innovator", total_xp: 4510 },
    { id: "t4", name: "Sara Fernandes", section: "Grade 12 B", title: "Builder", total_xp: 4105 },
    { id: "t5", name: "Ananya Rao", section: "Grade 11 A", title: "Builder", total_xp: 3975 },
  ],
};
