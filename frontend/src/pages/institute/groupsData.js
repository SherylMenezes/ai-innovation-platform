// TEMP: sample staff, section staffing and teams for the Groups page. In memory only.
// Replace with API calls once the institution group endpoints exist.

import { getClassOptions, listStudents } from "./studentsData";
import { initials } from "./studentFormat";

export const STAFF = [
  { id: "t1", name: "Anjali Deshpande", subject: "Science" },
  { id: "t2", name: "Rakesh Iyer", subject: "Mathematics" },
  { id: "t3", name: "Farah Khan", subject: "English" },
  { id: "t4", name: "Vikram Rao", subject: "Computer Science" },
  { id: "t5", name: "Sneha Pillai", subject: "Social Studies" },
  { id: "t6", name: "Joseph D'Costa", subject: "Physics" },
  { id: "t7", name: "Meenal Joshi", subject: "Design & Technology" },
  { id: "t8", name: "Arvind Menon", subject: "Entrepreneurship" },
];

export const staffById = (id) => STAFF.find((t) => t.id === id) ?? null;

// sectionId -> { classTeacherId, mentorId }
const sectionStaff = {};
let teams = null;

function seedSectionStaff() {
  if (Object.keys(sectionStaff).length) return;
  let i = 0;
  for (const grade of getClassOptions()) {
    for (const section of grade.sections) {
      // Leave one section without a mentor so the "not assigned" state is visible.
      sectionStaff[section.id] = {
        classTeacherId: STAFF[i % STAFF.length].id,
        mentorId: i === 3 ? null : STAFF[(i + 3) % STAFF.length].id,
      };
      i += 1;
    }
  }
}

export function getSectionStaff(sectionId) {
  seedSectionStaff();
  return sectionStaff[sectionId] ?? { classTeacherId: null, mentorId: null };
}

export function setSectionStaff(sectionId, role, staffId) {
  seedSectionStaff();
  sectionStaff[sectionId] = { ...getSectionStaff(sectionId), [role]: staffId || null };
}

const TEAM_NAMES = ["Green Circuit", "Aqua Minds", "Safe Steps", "Byte Builders", "Zero Waste Squad", "Idea Forge", "Spark Lab", "Future Fixers"];
const TEAM_SECTIONS = ["g10a", "g10a", "g10b", "g9a", "g11a", "g12a", "g12b", "g8a"];

function seedTeams() {
  const roster = listStudents();
  const used = new Set();
  return TEAM_NAMES.map((name, i) => {
    const members = roster
      .filter((s) => s.sectionId === TEAM_SECTIONS[i] && s.status === "active" && !used.has(s.id))
      .slice(0, 3 + (i % 3))
      .map((s) => s.id);
    members.forEach((id) => used.add(id));
    return {
      id: `team-${i + 1}`,
      name,
      memberIds: members,
      leaderId: members[0] ?? null,
      mentorId: i === 5 ? null : STAFF[(i * 3) % STAFF.length].id,
      createdOn: Date.now() - (40 - i * 4) * 24 * 60 * 60 * 1000,
    };
  });
}

export function listTeams() {
  if (!teams) teams = seedTeams();
  return teams;
}

export function teamOf(studentId, exceptTeamId) {
  return listTeams().find((t) => t.id !== exceptTeamId && t.memberIds.includes(studentId)) ?? null;
}

export function teamNameTaken(name, exceptId) {
  const key = name.trim().toLowerCase();
  return listTeams().some((t) => t.id !== exceptId && t.name.toLowerCase() === key);
}

export function createTeam({ name, memberIds, leaderId, mentorId }) {
  const team = {
    id: `team-${Date.now().toString(36)}`,
    name: name.trim(),
    memberIds: [...memberIds],
    leaderId,
    mentorId: mentorId || null,
    createdOn: Date.now(),
  };
  teams = [team, ...listTeams()];
  return team;
}

export function updateTeam(id, fields) {
  teams = listTeams().map((t) => {
    if (t.id !== id) return t;
    const next = { ...t, ...fields };
    if (fields.name !== undefined) next.name = fields.name.trim();
    // A leader who is no longer a member hands over to the first remaining member.
    if (!next.memberIds.includes(next.leaderId)) next.leaderId = next.memberIds[0] ?? null;
    return next;
  });
}

export function deleteTeam(id) {
  teams = listTeams().filter((t) => t.id !== id);
}

export function average(values) {
  const list = values.filter((v) => v != null);
  return list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null;
}

// "Grade 10 · Section A" when every member shares a section, otherwise "Mixed classes".
export function teamScope(members) {
  if (!members.length) return "No members";
  const first = members[0];
  return members.every((m) => m.sectionId === first.sectionId)
    ? `${first.gradeName} · ${first.sectionName}`
    : "Mixed classes";
}

export function teamInitials(name) {
  return initials(name).slice(0, 2);
}
