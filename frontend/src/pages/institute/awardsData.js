// TEMP: sample awards, recognitions and certificates (BRD 12.5, AI088–AI090). In memory only.

import { listTeams } from "./groupsData";
import { channelList, sendNotification } from "./notificationsData";
import { listStudents } from "./studentsData";

const DAY = 24 * 60 * 60 * 1000;

export const AWARD_TYPES = [
  { key: "innovation", label: "Innovation award", recipient: "student", blurb: "For an outstanding idea, prototype or solution." },
  { key: "top-student", label: "Top student recognition", recipient: "student", blurb: "For consistent performance, XP or scores." },
  { key: "team", label: "Team recognition", recipient: "team", blurb: "For a team's collaboration and results." },
];

export const awardTypeLabel = (key) => AWARD_TYPES.find((t) => t.key === key)?.label ?? key;

const CERT_PREFIX = "SPS";
let awards = null;
let recognitions = null;
let certCounter = 0;

const nextCertificateNo = () => `${CERT_PREFIX}-${new Date().getFullYear()}-${String(++certCounter).padStart(4, "0")}`;

function seed() {
  const now = Date.now();
  awards = [
    { id: "aw-1", name: "Innovator of the Term", type: "innovation", description: "The most original and well-tested solution submitted this term.", criteria: "Highest combined AI score and mentor rating", createdOn: now - 90 * DAY },
    { id: "aw-2", name: "Best Sustainability Idea", type: "innovation", description: "A solution with the clearest impact on waste, water or energy.", criteria: "Judged by the sustainability panel", createdOn: now - 70 * DAY },
    { id: "aw-3", name: "Top Performer", type: "top-student", description: "Recognises the highest-ranked student in a grade.", criteria: "Rank 1 by XP in their grade at term end", createdOn: now - 60 * DAY },
    { id: "aw-4", name: "Rising Star", type: "top-student", description: "The biggest jump in XP and scores over the last month.", criteria: "Largest XP gain in 30 days", createdOn: now - 40 * DAY },
    { id: "aw-5", name: "Team of the Month", type: "team", description: "A team that worked together brilliantly and delivered.", criteria: "Highest team average score this month", createdOn: now - 35 * DAY },
  ];

  const roster = listStudents().filter((s) => s.status === "active").sort((a, b) => b.xp - a.xp);
  const teams = listTeams();
  const rows = [
    ["aw-1", "student", roster[0]?.id, 6, "For the Smart Campus Waste sorting prototype."],
    ["aw-3", "student", roster[1]?.id, 14, "Top of Grade 12 by XP."],
    ["aw-4", "student", roster[7]?.id, 9, ""],
    ["aw-2", "student", roster[4]?.id, 20, "Rainwater reuse plan for the science block."],
    ["aw-5", "team", teams[0]?.id, 4, "Shipped a working sorting bin prototype in two weeks."],
    ["aw-5", "team", teams[4]?.id, 33, ""],
  ];
  recognitions = rows
    .filter(([, , id]) => id)
    .map(([awardId, kind, id, daysAgo, note], i) => ({
      id: `rec-${i + 1}`,
      awardId,
      recipient: { kind, id },
      note,
      awardedOn: now - daysAgo * DAY,
      certificateNo: nextCertificateNo(),
    }));
}

export function listAwards() {
  if (!awards) seed();
  return awards;
}

export function listRecognitions() {
  if (!recognitions) seed();
  return recognitions;
}

export const awardById = (id) => listAwards().find((a) => a.id === id) ?? null;

export function awardNameTaken(name) {
  const key = name.trim().toLowerCase();
  return listAwards().some((a) => a.name.toLowerCase() === key);
}

export function createAward({ name, type, description, criteria }) {
  const award = { id: `aw-${Date.now().toString(36)}`, name: name.trim(), type, description: description.trim(), criteria: criteria.trim(), createdOn: Date.now() };
  awards = [award, ...listAwards()];
  return award;
}

export function deleteAward(id) {
  awards = listAwards().filter((a) => a.id !== id);
  recognitions = listRecognitions().filter((r) => r.awardId !== id);
}

// Who a recognition is for, resolved against the current roster and teams.
export function recipientInfo(recipient) {
  if (recipient.kind === "team") {
    const team = listTeams().find((t) => t.id === recipient.id);
    return { name: team?.name ?? "Removed team", detail: team ? `${team.memberIds.length} members` : "", size: team?.memberIds.length ?? 0 };
  }
  const s = listStudents().find((x) => x.id === recipient.id);
  return { name: s?.name ?? "Removed student", detail: s ? `${s.gradeName} · ${s.sectionName}` : "", size: 1 };
}

// Gives an award, optionally with a certificate and a notification to the recipient(s).
export function giveAward({ awardId, recipient, note, certificate, channels }) {
  const rec = {
    id: `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    awardId,
    recipient,
    note: note?.trim() ?? "",
    awardedOn: Date.now(),
    certificateNo: certificate ? nextCertificateNo() : null,
  };
  recognitions = [rec, ...listRecognitions()];
  const who = recipientInfo(recipient);
  if (channelList(channels).length) {
    sendNotification({
      kind: "award",
      title: `You've received ${awardById(awardId)?.name}${certificate ? " (certificate attached)" : ""}`,
      audience: recipient.kind === "team" ? `Team ${who.name}` : who.name,
      count: who.size,
      channels,
      refId: awardId,
    });
  }
  return rec;
}

export function issueCertificate(recId) {
  let issued = null;
  recognitions = listRecognitions().map((r) => {
    if (r.id !== recId || r.certificateNo) return r;
    issued = { ...r, certificateNo: nextCertificateNo() };
    return issued;
  });
  return issued;
}

export function revokeRecognition(recId) {
  recognitions = listRecognitions().filter((r) => r.id !== recId);
}
