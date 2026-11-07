// Report figures for the Reports page (BRD 12.4, BRD 17, AI085–AI087). Assignment, score and
// badge reports come from the same sample roster and assignments as the rest of the panel.
// Weekly trends (participation, AI usage) and the platform benchmark are sample series.

import { listAssignments, participation, summarise, targetLabel } from "./assignmentsData";
import { challengeById } from "./challengesData";
import { BADGES, getClassOptions, listStudents } from "./studentsData";

export const RANGES = [
  { key: "30d", label: "Last 30 days", weeks: 4 },
  { key: "12w", label: "Last 12 weeks", weeks: 12 },
  { key: "term", label: "This term", weeks: 16 },
];

const PLATFORM_COMPLETION = 58; // platform-wide average completion %, for benchmarking
const SCORE_BINS = [[0, 39, "<40"], [40, 59, "40–59"], [60, 69, "60–69"], [70, 79, "70–79"], [80, 89, "80–89"], [90, 100, "90+"]];

const wave = (i, base, amp, trend, phase = 0) => base + trend * i + amp * Math.sin(i * 0.9 + phase);

function weekLabels(weeks) {
  const now = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(now.getTime() - (weeks - 1 - i) * 7 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const inClass = (classId) => (s) => !classId || s.gradeId === classId || s.sectionId === classId;

export function classLabelFor(classId) {
  if (!classId) return "All classes";
  for (const g of getClassOptions()) {
    if (g.id === classId) return g.name;
    const s = g.sections.find((x) => x.id === classId);
    if (s) return `${g.name} · ${s.name}`;
  }
  return "All classes";
}

// Builds every report for one filter selection. Each section carries `table` (columns + rows)
// for the table view and the PDF / Excel exports.
export function buildReport({ range = "12w", classId = "" } = {}) {
  const { weeks, label: rangeLabel } = RANGES.find((r) => r.key === range) ?? RANGES[1];
  const labels = weekLabels(weeks);
  const roster = listStudents().filter((s) => s.status !== "deactivated").filter(inClass(classId));
  const active = roster.filter((s) => s.status === "active");
  const share = Math.max(0.08, roster.length / Math.max(1, listStudents().length));

  // Assignments: only the students in the selected class count.
  const assignmentRows = listAssignments()
    .map((a) => {
      const rows = participation(a).filter((r) => inClass(classId)(r.student));
      return { a, title: challengeById(a.challengeId)?.title ?? "Challenge", stats: summarise(rows), rows };
    })
    .filter((x) => x.stats.total > 0);

  const totals = assignmentRows.reduce((t, x) => ({
    total: t.total + x.stats.total, submitted: t.submitted + x.stats.submitted, participated: t.participated + x.stats.participated,
  }), { total: 0, submitted: 0, participated: 0 });

  // Weekly series (sample), scaled to the selected group's size.
  const offset = 16 - weeks;
  const participationTrend = labels.map((_, i) => Math.round(Math.min(96, wave(i + offset, 52, 5, 1.6))));
  const platformTrend = labels.map((_, i) => Math.round(wave(i + offset, 49, 2, 0.6, 1.4)));
  const mentorSessions = labels.map((_, i) => Math.round(wave(i + offset, 140, 22, 7) * share * 3));
  const aiEvaluations = labels.map((_, i) => Math.round(wave(i + offset, 70, 14, 4, 2) * share * 3));
  const ideasGenerated = labels.map((_, i) => Math.round(wave(i + offset, 210, 30, 9, 0.7) * share * 3));
  const half = Math.max(1, Math.floor(weeks / 2));
  const sum = (a, from, to) => a.slice(from, to).reduce((s, v) => s + v, 0);

  const scored = active.filter((s) => s.avgScore != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, x) => s + x.avgScore, 0) / scored.length) : 0;

  const kpis = [
    { key: "participation", label: "Participation rate", value: `${pct(totals.participated, totals.total)}%`, delta: participationTrend.at(-1) - participationTrend[0], deltaUnit: " pts", note: "Started an assigned challenge" },
    { key: "completion", label: "Completion rate", value: `${pct(totals.submitted, totals.total)}%`, delta: pct(totals.submitted, totals.total) - PLATFORM_COMPLETION, deltaUnit: " pts vs platform", note: `Platform average ${PLATFORM_COMPLETION}%` },
    { key: "score", label: "Avg innovation score", value: `${avgScore}`, delta: null, note: `${scored.length} students scored` },
    { key: "ai", label: "AI mentor sessions", value: sum(mentorSessions, 0, weeks).toLocaleString("en-IN"), delta: sum(mentorSessions, weeks - half, weeks) - sum(mentorSessions, 0, half), deltaUnit: " vs first half", note: rangeLabel },
  ];

  // Completion by grade (or by section when one grade is chosen), benchmarked against the platform.
  const grades = getClassOptions();
  const chosenGrade = grades.find((g) => g.id === classId);
  const groups = chosenGrade
    ? chosenGrade.sections.map((s) => ({ id: s.id, label: `${chosenGrade.name} · ${s.name}` }))
    : classId
      ? [{ id: classId, label: classLabelFor(classId) }]
      : grades.filter((g) => g.sections.length).map((g) => ({ id: g.id, label: g.name }));
  const groupStats = groups.map((g) => {
    const rows = assignmentRows.flatMap((x) => x.rows.filter((r) => r.student.gradeId === g.id || r.student.sectionId === g.id));
    const s = summarise(rows);
    const members = active.filter((st) => st.gradeId === g.id || st.sectionId === g.id);
    const memberScores = members.filter((m) => m.avgScore != null);
    const top = [...members].sort((a, b) => b.xp - a.xp)[0];
    return {
      ...g,
      students: members.length,
      participation: s.participationRate,
      completion: s.completionRate,
      score: memberScores.length ? Math.round(memberScores.reduce((t, m) => t + m.avgScore, 0) / memberScores.length) : null,
      xp: members.length ? Math.round(members.reduce((t, m) => t + m.xp, 0) / members.length) : 0,
      top: top?.name ?? "—",
    };
  }).filter((g) => g.students > 0);

  // Challenge completion: assignments of the same challenge are combined.
  const byChallenge = new Map();
  assignmentRows.forEach((x) => {
    const t = byChallenge.get(x.title) ?? { submitted: 0, total: 0 };
    byChallenge.set(x.title, { submitted: t.submitted + x.stats.submitted, total: t.total + x.stats.total });
  });
  const challengeCompletion = [...byChallenge.entries()]
    .map(([title, t]) => ({ key: title, label: title, value: pct(t.submitted, t.total), submitted: t.submitted, total: t.total }))
    .sort((a, b) => b.value - a.value);

  const scoreBins = SCORE_BINS.map(([lo, hi, label]) => ({ label, value: scored.filter((s) => s.avgScore >= lo && s.avgScore <= hi).length }));

  const badgeCounts = Object.entries(BADGES)
    .map(([key, b]) => ({ key, label: b.name, value: active.filter((s) => s.badges.includes(key)).length }))
    .sort((a, b) => b.value - a.value);

  const institutionAvgScore = avgScore;

  return {
    filters: { rangeLabel, classLabel: classLabelFor(classId), generatedAt: new Date() },
    kpis,
    trend: { labels, participationTrend, platformTrend },
    groupStats,
    platformCompletion: PLATFORM_COMPLETION,
    institutionAvgScore,
    submissions: assignmentRows.map((x) => ({
      key: x.a.id, label: `${x.title} · ${targetLabel(x.a.target)}`,
      values: { submitted: x.stats.submitted, "in-progress": x.stats.inProgress, "not-started": x.stats.notStarted },
    })),
    challengeCompletion,
    scoreBins,
    badgeCounts,
    ai: {
      labels, mentorSessions, aiEvaluations, ideasGenerated,
      totals: {
        sessions: sum(mentorSessions, 0, weeks), evaluations: sum(aiEvaluations, 0, weeks), ideas: sum(ideasGenerated, 0, weeks),
        perStudent: active.length ? (sum(mentorSessions, 0, weeks) / active.length).toFixed(1) : "0",
      },
    },
  };
}

// Plain tables for the table views and exports, one per report.
export function reportTables(r) {
  return [
    {
      id: "trend", title: "Participation trend",
      columns: ["Week of", "Your institute (%)", "Platform average (%)"],
      rows: r.trend.labels.map((l, i) => [l, r.trend.participationTrend[i], r.trend.platformTrend[i]]),
    },
    {
      id: "completion-by-class", title: "Completion rate by class",
      columns: ["Class", "Completion (%)", "Platform average (%)"],
      rows: r.groupStats.map((g) => [g.label, g.completion, r.platformCompletion]),
    },
    {
      id: "submitted", title: "Submitted vs not submitted",
      columns: ["Assignment", "Submitted", "In progress", "Not started"],
      rows: r.submissions.map((s) => [s.label, s.values.submitted, s.values["in-progress"], s.values["not-started"]]),
    },
    {
      id: "challenge-completion", title: "Challenge completion",
      columns: ["Challenge", "Submitted", "Assigned", "Completion (%)"],
      rows: r.challengeCompletion.map((c) => [c.label, c.submitted, c.total, c.value]),
    },
    {
      id: "scores", title: "Innovation score distribution",
      columns: ["Score band", "Students"],
      rows: r.scoreBins.map((b) => [b.label, b.value]),
    },
    {
      id: "performance", title: "Performance analysis",
      columns: ["Class", "Students", "Participation (%)", "Completion (%)", "Avg score", "Avg XP", "Top student"],
      rows: r.groupStats.map((g) => [g.label, g.students, g.participation, g.completion, g.score ?? "—", g.xp, g.top]),
    },
    {
      id: "badges", title: "Badge distribution",
      columns: ["Badge", "Students holding it"],
      rows: r.badgeCounts.map((b) => [b.label, b.value]),
    },
    {
      id: "ai", title: "AI usage",
      columns: ["Week of", "AI mentor sessions", "AI evaluations", "Ideas generated"],
      rows: r.ai.labels.map((l, i) => [l, r.ai.mentorSessions[i], r.ai.aiEvaluations[i], r.ai.ideasGenerated[i]]),
    },
  ];
}
