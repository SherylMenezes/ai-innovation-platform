// TEMP: sample challenge assignments (BRD 12.3, AI082–AI084). In memory only.
// Participation is derived per student from a stable hash so it stays the same between visits.

import { challengeById } from "./challengesData";
import { listTeams } from "./groupsData";
import { DEFAULT_CHANNELS, channelList, sendNotification } from "./notificationsData";
import { getClassOptions, listStudents } from "./studentsData";

const DAY = 24 * 60 * 60 * 1000;

export const TARGET_TYPES = [
  { key: "all", label: "Whole institute" },
  { key: "grade", label: "A grade" },
  { key: "section", label: "A section" },
  { key: "team", label: "A team" },
];

export const REMINDERS = [
  { key: "threeDays", label: "3 days before the deadline" },
  { key: "oneDay", label: "1 day before the deadline" },
  { key: "onDue", label: "On the due date" },
];

export const PARTICIPATION = {
  submitted: { label: "Submitted", tone: "ok" },
  "in-progress": { label: "In progress", tone: "info" },
  "not-started": { label: "Not started", tone: "muted" },
};

export const PHASES = ["Problem canvas", "Ideation", "Evaluation", "Submission"];

let assignments = null;

function seed() {
  const now = Date.now();
  const rows = [
    ["ch-1", { type: "grade", id: "g10" }, -30, 2],
    ["ch-2", { type: "all", id: null }, -12, 9],
    ["ch-3", { type: "section", id: "g9a" }, -26, -5],
    ["ch-4", { type: "grade", id: "g12" }, -8, 16],
    ["ch-5", { type: "grade", id: "g8" }, -10, 5],
    ["ch-6", { type: "team", id: "team-4" }, -6, 20],
    ["ch-7", { type: "section", id: "g11a" }, -3, 4],
    ["ch-9", { type: "grade", id: "g9" }, -1, 13],
  ];
  return rows.map(([challengeId, target, assignedDays, dueDays], i) => ({
    id: `as-${i + 1}`,
    challengeId,
    target,
    assignedOn: now + assignedDays * DAY,
    dueOn: now + dueDays * DAY,
    channels: { ...DEFAULT_CHANNELS },
    reminders: { threeDays: true, oneDay: true, onDue: i % 3 === 0 },
    note: "",
  }));
}

export function listAssignments() {
  if (!assignments) assignments = seed();
  return assignments;
}

export const assignmentById = (id) => listAssignments().find((a) => a.id === id) ?? null;

export function targetLabel(target) {
  if (target.type === "all") return "Whole institute";
  if (target.type === "team") return `Team ${listTeams().find((t) => t.id === target.id)?.name ?? "(removed)"}`;
  for (const g of getClassOptions()) {
    if (target.type === "grade" && g.id === target.id) return g.name;
    const s = g.sections.find((x) => x.id === target.id);
    if (target.type === "section" && s) return `${g.name} · ${s.name}`;
  }
  return "Unknown group";
}

// Students an assignment reaches. Deactivated students are left out.
export function targetStudents(target) {
  const roster = listStudents().filter((s) => s.status !== "deactivated");
  if (target.type === "all") return roster;
  if (target.type === "grade") return roster.filter((s) => s.gradeId === target.id);
  if (target.type === "section") return roster.filter((s) => s.sectionId === target.id);
  const team = listTeams().find((t) => t.id === target.id);
  return team ? roster.filter((s) => team.memberIds.includes(s.id)) : [];
}

// Stable 0–1 value per (student, assignment) pair.
function unit(a, b) {
  let h = 2166136261;
  for (const ch of `${a}|${b}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

// Per-student participation for one assignment: status, phase reached, score, last activity.
export function participation(assignment) {
  const now = Date.now();
  const span = Math.max(DAY, assignment.dueOn - assignment.assignedOn);
  const elapsed = Math.min(1.2, Math.max(0, (now - assignment.assignedOn) / span));
  return targetStudents(assignment.target).map((student) => {
    if (student.status === "invited") {
      return { student, status: "not-started", phase: 0, score: null, submittedOn: null, lastActivity: null };
    }
    const r = unit(student.id, assignment.id);
    // Stronger students (higher progress) are more likely to be ahead.
    const drive = r * 0.7 + (student.progress / 100) * 0.3;
    // Near the deadline roughly two thirds have submitted; most of the rest are mid-way.
    const submittedCut = 1 - elapsed * 0.62;
    const startedCut = 1 - Math.min(0.92, elapsed * 1.7);
    if (drive >= submittedCut) {
      const score = Math.round(Math.min(98, Math.max(40, (student.avgScore ?? 65) + (unit(assignment.id, student.id) - 0.5) * 24)));
      const submittedOn = assignment.assignedOn + span * Math.min(1, 0.4 + r * 0.6);
      return { student, status: "submitted", phase: 4, score, submittedOn: Math.min(submittedOn, now), lastActivity: Math.min(submittedOn, now) };
    }
    if (drive >= startedCut) {
      const phase = 1 + Math.floor(unit(student.name, assignment.id) * 3);
      return { student, status: "in-progress", phase, score: null, submittedOn: null, lastActivity: now - Math.floor(r * 6) * DAY };
    }
    return { student, status: "not-started", phase: 0, score: null, submittedOn: null, lastActivity: null };
  });
}

export function summarise(rows) {
  const total = rows.length;
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const inProgress = rows.filter((r) => r.status === "in-progress").length;
  return {
    total,
    submitted,
    inProgress,
    notStarted: total - submitted - inProgress,
    participated: submitted + inProgress,
    participationRate: total ? Math.round(((submitted + inProgress) / total) * 100) : 0,
    completionRate: total ? Math.round((submitted / total) * 100) : 0,
  };
}

export function deadlineState(assignment) {
  const days = Math.ceil((assignment.dueOn - Date.now()) / DAY);
  if (days < 0) return { tone: "closed", label: `Closed ${-days} day${days === -1 ? "" : "s"} ago`, days };
  if (days === 0) return { tone: "urgent", label: "Due today", days };
  if (days <= 3) return { tone: "urgent", label: `Due in ${days} day${days === 1 ? "" : "s"}`, days };
  if (days <= 7) return { tone: "soon", label: `Due in ${days} days`, days };
  return { tone: "open", label: `Due in ${days} days`, days };
}

export function createAssignment({ challengeId, target, dueOn, channels, reminders, note }) {
  const assignment = {
    id: `as-${Date.now().toString(36)}`,
    challengeId,
    target,
    assignedOn: Date.now(),
    dueOn,
    channels: { ...channels },
    reminders: { ...reminders },
    note: note?.trim() ?? "",
  };
  assignments = [assignment, ...listAssignments()];
  const reached = targetStudents(target).length;
  if (channelList(channels).length) {
    sendNotification({
      kind: "assigned",
      title: `New challenge: ${challengeById(challengeId)?.title}`,
      audience: targetLabel(target),
      count: reached,
      channels,
      refId: assignment.id,
    });
  }
  return { assignment, reached };
}

export function updateAssignment(id, fields) {
  assignments = listAssignments().map((a) => (a.id === id ? { ...a, ...fields } : a));
}

// Moves the deadline and tells the students who haven't submitted yet.
export function changeDeadline(id, dueOn, notify) {
  const before = assignmentById(id);
  updateAssignment(id, { dueOn });
  const pending = participation({ ...before, dueOn }).filter((r) => r.status !== "submitted").length;
  if (notify && pending && channelList(before.channels).length) {
    sendNotification({
      kind: "deadline",
      title: `Deadline ${dueOn > before.dueOn ? "extended" : "moved"}: ${challengeById(before.challengeId)?.title}`,
      audience: `${targetLabel(before.target)} · not submitted`,
      count: pending,
      channels: before.channels,
      refId: id,
    });
  }
  return pending;
}

// Sends a reminder to everyone in the assignment who hasn't submitted.
export function sendReminder(id) {
  const a = assignmentById(id);
  const pending = participation(a).filter((r) => r.status !== "submitted").length;
  if (!pending) return 0;
  sendNotification({
    kind: "reminder",
    title: `Reminder: ${challengeById(a.challengeId)?.title} is due ${new Date(a.dueOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
    audience: `${targetLabel(a.target)} · not submitted`,
    count: pending,
    channels: a.channels,
    refId: id,
  });
  return pending;
}

export function deleteAssignment(id) {
  assignments = listAssignments().filter((a) => a.id !== id);
}
