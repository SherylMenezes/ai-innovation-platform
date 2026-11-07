// TEMP: in-memory log of notifications the institute has sent (AI084, AI090, BRD 16).
// In the real system these go out through the notification service; here we only record them.

export const CHANNELS = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
];

export const DEFAULT_CHANNELS = { inApp: true, email: true, push: true };

export const channelList = (channels) => CHANNELS.filter((c) => channels?.[c.key]).map((c) => c.label);

const HOUR = 60 * 60 * 1000;
let log = null;
let nextId = 1;

function seed() {
  const now = Date.now();
  return [
    { kind: "assigned", title: "New challenge: Smart Campus Waste Challenge", audience: "Grade 10", count: 68, refId: "as-1", at: now - 30 * 24 * HOUR },
    { kind: "reminder", title: "3 days left: Smart Campus Waste Challenge", audience: "Grade 10 · not submitted", count: 41, refId: "as-1", at: now - 20 * HOUR },
    { kind: "assigned", title: "New challenge: Clean Water Access", audience: "Whole institute", count: 244, refId: "as-2", at: now - 12 * 24 * HOUR },
    { kind: "award", title: "You've received Innovator of the Term", audience: "Rohan Joshi", count: 1, refId: "aw-1", at: now - 6 * 24 * HOUR },
    { kind: "rank", title: "Leaderboard update: new top 10", audience: "Institution leaderboard", count: 3, refId: "lb", at: now - 2 * HOUR },
  ].map((n) => ({ id: `n-${nextId++}`, channels: { ...DEFAULT_CHANNELS }, ...n }));
}

export function listNotifications(refId) {
  if (!log) log = seed();
  return refId ? log.filter((n) => n.refId === refId) : log;
}

// Records a notification and returns it. `channels` is { inApp, email, push }.
export function sendNotification({ kind, title, audience, count, channels = DEFAULT_CHANNELS, refId }) {
  const entry = { id: `n-${nextId++}`, kind, title, audience, count, channels: { ...channels }, refId, at: Date.now() };
  log = [entry, ...listNotifications()];
  return entry;
}
