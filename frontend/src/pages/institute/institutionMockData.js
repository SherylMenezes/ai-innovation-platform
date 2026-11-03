// Sample data shaped exactly like the planned /api/institution responses.
// Only used while USE_MOCK_INSTITUTION_DATA is true in institutionClient.js.

const leaf = (id, name, student_count, completion_percent, avg_ai_score, avg_xp) => ({
  id, name, kind: "section", student_count, completion_percent, avg_ai_score, avg_xp,
});

const TREE = [
  { id: "g8", name: "Grade 8", kind: "grade", children: [
    leaf("g8a", "8A", 32, 52, 64, 780), leaf("g8b", "8B", 30, 44, 61, 700),
  ] },
  { id: "g9", name: "Grade 9", kind: "grade", children: [
    leaf("g9a", "9A", 20, 82, 78, 1320), leaf("g9b", "9B", 19, 76, 75, 1190),
    leaf("g9c", "9C", 19, 54, 68, 880),
  ] },
  { id: "g10", name: "Grade 10", kind: "grade", children: [
    leaf("g10a", "10A", 28, 63, 71, 1010), leaf("g10b", "10B", 27, 55, 69, 930),
  ] },
  { id: "g11", name: "Grade 11", kind: "grade", children: [
    leaf("g11s", "11 Science", 22, 70, 79, 1380), leaf("g11c", "11 Commerce", 18, 61, 72, 1150),
  ] },
  { id: "g12", name: "Grade 12", kind: "grade", children: [
    leaf("g12s", "12 Science", 24, 58, 81, 1460), leaf("g12c", "12 Commerce", 20, 49, 74, 1090),
  ] },
];

function aggregate(node) {
  if (!node.children) return node;
  let students = 0, completion = 0, score = 0, xp = 0;
  node.children.forEach((child) => {
    aggregate(child);
    students += child.student_count;
    completion += child.completion_percent * child.student_count;
    score += child.avg_ai_score * child.student_count;
    xp += child.avg_xp * child.student_count;
  });
  node.student_count = students;
  node.completion_percent = completion / students;
  node.avg_ai_score = score / students;
  node.avg_xp = xp / students;
  return node;
}

const ROOT = aggregate({ id: null, name: "All grades", kind: "school", children: TREE });

function findGroup(id, nodes = TREE) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findGroup(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

const toRow = (node) => ({
  id: node.id,
  name: node.name,
  student_count: node.student_count,
  completion_percent: Math.round(node.completion_percent),
  avg_ai_score: Math.round(node.avg_ai_score),
  avg_xp: Math.round(node.avg_xp),
  has_children: Boolean(node.children),
});

const LEVEL_LABELS = { school: "Grade", grade: "Section" };

export function mockGroupSummary(parentId) {
  const parent = parentId ? findGroup(parentId) : ROOT;
  return {
    level_label: LEVEL_LABELS[parent?.kind] ?? "Group",
    groups: (parent?.children ?? []).map(toRow),
  };
}

const NAMES = [
  "Aanya Naik", "Rohan Desai", "Mira Fernandes", "Kabir Shetty", "Zara Dsouza",
  "Arjun Kamat", "Isha Prabhu", "Neil Gomes", "Tara Pai", "Vihaan Rao",
];

export function mockGroupStudents(groupId) {
  const group = findGroup(groupId) ?? ROOT;
  let seed = [...String(groupId)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const clamp = (v) => Math.max(0, Math.min(100, v));
  return {
    students: Array.from({ length: 6 }, (_, i) => ({
      id: `${groupId}-s${i}`,
      name: NAMES[(Math.abs(seed) + i * 3) % NAMES.length],
      completion_percent: Math.round(clamp(group.completion_percent + random() * 40 - 20)),
      avg_ai_score: Math.round(clamp(group.avg_ai_score + random() * 24 - 12)),
      avg_xp: Math.round(Math.max(100, group.avg_xp + random() * 600 - 300)),
    })),
  };
}

export function mockGroupOptions() {
  const groups = [];
  const walk = (nodes, depth) =>
    nodes.forEach((node) => {
      groups.push({ id: node.id, name: node.name, depth, has_children: Boolean(node.children) });
      if (node.children) walk(node.children, depth + 1);
    });
  walk(TREE, 0);
  return { groups };
}

export function mockDashboard(groupId) {
  const group = groupId ? findGroup(groupId) ?? ROOT : ROOT;
  return {
    institution_name: "St. Xavier's High School",
    invite_code: "SXC-4821",
    stats: {
      total_students: group.student_count,
      active_now: Math.round(group.student_count * 0.18),
      active_assignments: 6,
      due_this_week: 2,
      completion_percent: Math.round(group.completion_percent),
      completion_change: 8,
      avg_ai_score: Math.round(group.avg_ai_score),
    },
    funnel: {
      assignment_title: "Smart Waste Sorting",
      group_name: "Grade 9",
      student_count: 58,
      stages: [
        { key: "canvas", label: "Problem canvas", count: 52 },
        { key: "ideation", label: "Ideate", count: 46 },
        { key: "evaluation", label: "Evaluate", count: 31 },
        { key: "submission", label: "Submitted", count: 27 },
      ],
    },
    attention: [
      { id: "a1", severity: "high", title: "14 students haven't started Clean Water Access",
        detail: "Due in 3 days", action_label: "Remind", action_section: "assignments" },
      { id: "a2", severity: "medium", title: "5 submissions failed AI evaluation",
        detail: "Students need to resubmit", action_label: "Review", action_section: "assignments" },
      { id: "a3", severity: "medium", title: "38 students inactive for 7+ days",
        detail: "Most are in Grade 8", action_label: "View", action_section: "students" },
      { id: "a4", severity: "info", title: "8B has the lowest completion",
        detail: "44%, against a school average of 60%", action_label: "Open", action_section: "groups" },
    ],
    top_students: [
      { id: "s1", name: "Aanya Naik", section: "9A", title: "Innovator", total_xp: 2340 },
      { id: "s2", name: "Rohan Desai", section: "11 Science", title: "Innovator", total_xp: 2110 },
      { id: "s3", name: "Mira Fernandes", section: "12 Science", title: "Problem Solver", total_xp: 1985 },
      { id: "s4", name: "Kabir Shetty", section: "9B", title: "Problem Solver", total_xp: 1870 },
      { id: "s5", name: "Zara Dsouza", section: "10A", title: "Thinker", total_xp: 1760 },
    ],
  };
}
