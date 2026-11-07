// TEMP: placeholder student roster for the Students page, built from the sample classes in
// sampleData.js so the counts match the dashboard. Lives in memory only (lost on reload).
// Replace with API calls once the institution student endpoints exist.

import { getLevelDetailsFromXp } from "../../utils/levelTitles";
import { adjustSampleSectionCount, getSampleGroupOptions, sampleDashboard, sampleGroupSummary } from "./sampleData";

const FIRST_NAMES = [
  "Aarav", "Diya", "Kabir", "Ananya", "Vihaan", "Isha", "Arjun", "Meera", "Rohan", "Sara",
  "Advik", "Kiara", "Reyansh", "Myra", "Ayaan", "Anika", "Vivaan", "Saanvi", "Ishaan", "Tara",
  "Dhruv", "Riya", "Krish", "Aditi", "Neel", "Pari", "Yash", "Navya", "Arnav", "Zoya",
  "Om", "Mahi", "Shaurya", "Ira", "Rudra", "Avni", "Kian", "Nisha", "Dev", "Alia",
];

const LAST_NAMES = [
  "Mehta", "Nair", "Singh", "Rao", "Patel", "Kulkarni", "Desai", "Iyer", "Joshi", "Fernandes",
  "Sharma", "Gupta", "Reddy", "Menon", "Pillai", "Shetty", "Kapoor", "Bose", "Chopra", "Naik",
  "Verma", "Kamath", "Gomes", "Dsouza", "Bhat", "Sawant", "Pai", "Malhotra", "Saxena", "Jain",
];

export const CHALLENGES = [
  "Smart Campus Waste Challenge",
  "Clean Water Access",
  "Safer School Commute",
  "Digital Library Rethink",
  "Canteen Food Waste",
];

export const PHASES = ["Problem canvas", "Ideation", "Evaluation", "Submission"];

export const SKILLS = ["Problem framing", "Creativity", "Feasibility", "Impact", "Communication"];

export const BADGES = {
  "first-submission": { name: "First Submission", description: "Submitted their first project" },
  finisher: { name: "Finisher", description: "Completed three challenges" },
  "canvas-pro": { name: "Canvas Pro", description: "Scored 85+ on problem framing" },
  "idea-machine": { name: "Idea Machine", description: "Generated 10+ ideas in one challenge" },
  streak: { name: "7-Day Streak", description: "Active seven days in a row" },
  "top-ten": { name: "Top 10", description: "Reached the institute's top 10 by XP" },
};

const DAY = 24 * 60 * 60 * 1000;
const EMAIL_DOMAIN = "sunrise.example";

// Small seeded PRNG so the roster is the same on every load.
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Grades with their sections, from the same list the dashboard's Class filter uses.
export function getClassOptions() {
  const grades = [];
  for (const g of getSampleGroupOptions()) {
    if (g.depth === 0) grades.push({ id: g.id, name: g.name, sections: [] });
    else if (g.depth === 1 && grades.length) {
      const grade = grades[grades.length - 1];
      const name = g.name.startsWith(grade.name) ? g.name.slice(grade.name.length).trim() : g.name;
      grade.sections.push({ id: g.id, name });
    }
  }
  return grades;
}

function classNames(gradeId, sectionId) {
  const grade = getClassOptions().find((g) => g.id === gradeId);
  const section = grade?.sections.find((s) => s.id === sectionId);
  return { gradeName: grade?.name ?? "", sectionName: section?.name ?? "" };
}

function makeEmail(name, used) {
  const base = name.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/).join(".");
  let email = `${base}@${EMAIL_DOMAIN}`;
  for (let n = 2; used.has(email); n++) email = `${base}${n}@${EMAIL_DOMAIN}`;
  used.add(email);
  return email;
}

function buildHistory(rand, now, sectionCompletion) {
  const count = 2 + Math.floor(rand() * 3);
  const titles = [...CHALLENGES].sort(() => rand() - 0.5).slice(0, count);
  return titles.map((title, i) => {
    const assignedOn = now - (count - i) * 28 * DAY - Math.floor(rand() * 10) * DAY;
    // Older challenges are more likely to be finished; the section's completion rate sets the odds.
    const finished = i < count - 1 ? rand() < sectionCompletion / 100 + 0.25 : rand() < sectionCompletion / 200;
    if (finished) {
      const score = Math.round(clamp(45 + rand() * 50, 0, 100));
      return { title, assignedOn, status: "completed", phase: "Submission", stepsDone: 4, score, xp: 150 + score * 3 };
    }
    const stepsDone = Math.floor(rand() * 4);
    return {
      title, assignedOn, status: stepsDone ? "in-progress" : "not-started",
      phase: PHASES[stepsDone], stepsDone, score: null, xp: stepsDone * 60,
    };
  });
}

function summarise(history) {
  const done = history.filter((c) => c.status === "completed");
  const steps = history.reduce((sum, c) => sum + c.stepsDone, 0);
  return {
    progress: history.length ? Math.round((steps / (history.length * 4)) * 100) : 0,
    avgScore: done.length ? Math.round(done.reduce((s, c) => s + c.score, 0) / done.length) : null,
    xp: history.reduce((sum, c) => sum + c.xp, 0),
    completed: done.length,
  };
}

function generate() {
  const rand = seeded(4821);
  const now = Date.now();
  const used = new Set();
  const list = [];

  for (const grade of getClassOptions()) {
    for (const row of sampleGroupSummary(grade.id).groups) {
      for (let i = 0; i < row.student_count; i++) {
        const name = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`;
        const roll = rand();
        const status = roll < 0.04 ? "invited" : roll < 0.09 ? "deactivated" : "active";
        const base = {
          id: `stu-${list.length + 1}`,
          name,
          email: makeEmail(name, used),
          gradeId: grade.id,
          sectionId: row.id,
          gradeName: grade.name,
          sectionName: row.name,
          status,
        };

        if (status === "invited") {
          list.push({
            ...base, joinedOn: null, invitedOn: now - Math.floor(rand() * 10 + 1) * DAY, lastActive: null,
            history: [], progress: 0, avgScore: null, xp: 0, completed: 0, skills: null, badges: [],
          });
          continue;
        }

        const history = buildHistory(rand, now, row.completion_percent);
        const stats = summarise(history);
        const lastActive = status === "deactivated"
          ? now - (30 + Math.floor(rand() * 60)) * DAY
          : now - Math.floor(rand() * rand() * 21) * DAY - Math.floor(rand() * 20) * 60 * 60 * 1000;
        const centre = stats.avgScore ?? 55;
        const skills = Object.fromEntries(
          SKILLS.map((skill) => [skill, Math.round(clamp(centre + (rand() - 0.5) * 34, 20, 99))]),
        );
        const badges = [];
        if (stats.completed >= 1) badges.push("first-submission");
        if (stats.completed >= 3) badges.push("finisher");
        if (skills["Problem framing"] >= 85) badges.push("canvas-pro");
        if (rand() < 0.35) badges.push("idea-machine");
        if (status === "active" && now - lastActive < 2 * DAY && rand() < 0.5) badges.push("streak");

        list.push({
          ...base,
          joinedOn: now - (60 + Math.floor(rand() * 340)) * DAY,
          invitedOn: null,
          lastActive,
          history,
          ...stats,
          skills,
          badges,
        });
      }
    }
  }

  // Top 10 by XP among active students earn the Top 10 badge.
  [...list].filter((s) => s.status === "active").sort((a, b) => b.xp - a.xp).slice(0, 10)
    .forEach((s) => s.badges.push("top-ten"));
  return list;
}

let students = null;

export function listStudents() {
  if (!students) students = generate();
  return students;
}

export function levelFor(xp) {
  return getLevelDetailsFromXp(xp);
}

export function emailTaken(email, exceptId) {
  const target = email.trim().toLowerCase();
  return listStudents().some((s) => s.id !== exceptId && s.email.toLowerCase() === target);
}

function newStudent({ name, email, gradeId, sectionId }, sendInvite) {
  const now = Date.now();
  return {
    id: `stu-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    gradeId,
    sectionId,
    ...classNames(gradeId, sectionId),
    status: "invited",
    inviteSent: sendInvite,
    joinedOn: null,
    invitedOn: now,
    lastActive: null,
    history: [],
    progress: 0,
    avgScore: null,
    xp: 0,
    completed: 0,
    skills: null,
    badges: [],
  };
}

function countNewStudent(sectionId) {
  adjustSampleSectionCount(sectionId, 1);
  sampleDashboard.stats.total_students += 1;
}

export function addStudent(fields, { sendInvite = true } = {}) {
  const student = newStudent(fields, sendInvite);
  students = [student, ...listStudents()];
  countNewStudent(student.sectionId);
  return student;
}

export function importStudents(rows, { sendInvite = true } = {}) {
  const created = rows.map((row) => newStudent(row, sendInvite));
  students = [...created, ...listStudents()];
  created.forEach((s) => countNewStudent(s.sectionId));
  return created.length;
}

export function updateStudent(id, fields) {
  students = listStudents().map((s) => {
    if (s.id !== id) return s;
    if (s.sectionId !== fields.sectionId) {
      adjustSampleSectionCount(s.sectionId, -1);
      adjustSampleSectionCount(fields.sectionId, 1);
    }
    return { ...s, ...fields, name: fields.name.trim(), email: fields.email.trim().toLowerCase(), ...classNames(fields.gradeId, fields.sectionId) };
  });
}

// Moves students into another section; returns how many actually changed section.
export function moveStudents(ids, sectionId) {
  const grade = getClassOptions().find((g) => g.sections.some((s) => s.id === sectionId));
  if (!grade) return 0;
  const targets = new Set(ids);
  let moved = 0;
  students = listStudents().map((s) => {
    if (!targets.has(s.id) || s.sectionId === sectionId) return s;
    adjustSampleSectionCount(s.sectionId, -1);
    adjustSampleSectionCount(sectionId, 1);
    moved += 1;
    return { ...s, gradeId: grade.id, sectionId, ...classNames(grade.id, sectionId) };
  });
  return moved;
}

// Adds XP to a student (used by the live leaderboard to simulate scores coming in).
export function awardXp(id, amount) {
  students = listStudents().map((s) => (s.id === id ? { ...s, xp: s.xp + amount } : s));
}

export function setStudentStatus(id, status) {
  students = listStudents().map((s) => (s.id === id ? { ...s, status } : s));
}

export function resendInvite(id) {
  students = listStudents().map((s) => (s.id === id ? { ...s, invitedOn: Date.now(), inviteSent: true } : s));
}
