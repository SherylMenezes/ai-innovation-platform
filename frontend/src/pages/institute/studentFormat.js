const DAY = 24 * 60 * 60 * 1000;

export const STATUS_LABELS = { active: "Active", invited: "Invited", deactivated: "Deactivated" };

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Avatar colours cycle through the palette tiles, fixed per student.
const AVATAR_TONES = ["blue", "pink", "lavender", "green", "yellow"];

export function avatarTone(id) {
  const sum = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

export function relativeTime(timestamp) {
  if (!timestamp) return "Never";
  const days = Math.floor((Date.now() - timestamp) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk${days < 14 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} mo${months === 1 ? "" : "s"} ago`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const formatXp = (xp) => xp.toLocaleString("en-IN");

export function classLabel(student) {
  return [student.gradeName, student.sectionName].filter(Boolean).join(" · ");
}
