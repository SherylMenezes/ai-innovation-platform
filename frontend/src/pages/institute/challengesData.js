// TEMP: sample challenge catalogue for the institute panel (BRD 8.2, 8.3, 6.2). In memory only.
// The institution's assignments use this same catalogue (AI084); replace with the platform's
// challenge API once it is exposed to institutions.

export const CHALLENGE_TYPES = [
  { key: "micro", label: "Micro challenge", plural: "Micro challenges", blurb: "Short, focused tasks you can finish in one or two weeks." },
  { key: "theme", label: "Theme-based", plural: "Theme-based", blurb: "Deeper challenges grouped by subject theme." },
  { key: "industry", label: "Industry use case", plural: "Industry use cases", blurb: "Real problems drawn from industry sectors." },
  { key: "company", label: "Company challenge", plural: "Company challenges", blurb: "Posted by partner companies, often with rewards." },
  { key: "startup", label: "Own idea / Startup", plural: "Own idea / Startup", blurb: "Students bring their own idea and build it out." },
];

export const THEMES = ["AI", "Robotics", "Sustainability", "Design Thinking", "Entrepreneurship", "Science & Technology"];

export const LEVELS = [
  { key: "g8-10", label: "Grade 8–10" },
  { key: "g11-12", label: "Grade 11–12" },
  { key: "graduate", label: "Graduate" },
  { key: "professional", label: "Professional" },
];

export const SUBMISSION_PARTS = ["Problem canvas", "Idea pitch", "Prototype or demo link", "Presentation deck", "Final report"];

export const typeLabel = (key) => CHALLENGE_TYPES.find((t) => t.key === key)?.label ?? key;
export const levelLabel = (key) => LEVELS.find((l) => l.key === key)?.label ?? key;

const DAY = 24 * 60 * 60 * 1000;

const SEED = [
  ["Smart Campus Waste Challenge", "theme", "Sustainability", ["g8-10", "g11-12"], "institution", null, 4, 600,
    "Cut the waste your campus sends to landfill by redesigning how it is sorted, collected and reused."],
  ["Clean Water Access", "theme", "Science & Technology", ["g8-10", "g11-12"], "platform", null, 5, 700,
    "Design a low-cost way for a community to test or purify its drinking water."],
  ["Safer School Commute", "theme", "Design Thinking", ["g8-10"], "platform", null, 3, 500,
    "Map the risks on the way to school and prototype one change that makes the journey safer."],
  ["Digital Library Rethink", "theme", "AI", ["g11-12", "graduate"], "platform", null, 4, 650,
    "Use AI to help students discover the right book or resource faster."],
  ["Canteen Food Waste", "micro", null, ["g8-10"], "institution", null, 2, 250,
    "Measure a week of canteen food waste and propose one fix you can test."],
  ["Line-Following Robot", "theme", "Robotics", ["g11-12"], "platform", null, 4, 650,
    "Build and tune a robot that follows a track, then pitch a real-world use for it."],
  ["Prompt Like a Pro", "micro", "AI", ["g8-10", "g11-12"], "platform", null, 1, 150,
    "Write and test prompts that get an AI assistant to explain a science topic clearly."],
  ["Pitch in 60 Seconds", "micro", "Entrepreneurship", ["g11-12", "graduate"], "platform", null, 1, 150,
    "Record a one-minute pitch for an everyday problem and how you would solve it."],
  ["Energy Audit Sprint", "micro", "Sustainability", ["g8-10", "g11-12"], "platform", null, 2, 250,
    "Audit electricity use in one building and rank three savings by cost and impact."],
  ["Smart Farming Sensors", "industry", "Science & Technology", ["g11-12", "graduate"], "platform", null, 6, 900,
    "Agritech: use low-cost sensors to tell farmers when and how much to irrigate."],
  ["Retail Queue Optimiser", "industry", "AI", ["graduate", "professional"], "platform", null, 6, 900,
    "Retail: predict checkout rush hours and suggest staffing that shortens queues."],
  ["Hospital Wayfinding", "industry", "Design Thinking", ["graduate", "professional"], "platform", null, 5, 800,
    "Healthcare: help patients and visitors find their way around a large hospital."],
  ["EcoPack Redesign", "company", "Sustainability", ["g11-12", "graduate"], "company", "GreenBox Packaging", 6, 1000,
    "Replace single-use plastic in e-commerce packaging with something customers will actually reuse."],
  ["FinLit for Teens", "company", "Entrepreneurship", ["g8-10", "g11-12"], "company", "Sahyadri Bank", 5, 900,
    "Create a tool that teaches teenagers to budget their pocket money."],
  ["Assistive Tech Hack", "company", "Robotics", ["graduate", "professional"], "company", "Ability Labs", 8, 1200,
    "Prototype an affordable device that makes daily tasks easier for people with limited mobility."],
  ["Your Startup Idea", "startup", null, ["g11-12", "graduate", "professional"], "platform", null, 10, 1500,
    "Bring your own idea and take it from problem canvas to a pitch-ready prototype."],
  ["Student Venture Lab", "startup", "Entrepreneurship", ["graduate", "professional"], "platform", null, 12, 1800,
    "Turn a campus problem into a business model, then test it with real users."],
  ["Science Fair Remix", "theme", "Science & Technology", ["g8-10"], "institution", null, 3, 450,
    "Take a classic science-fair experiment and turn it into a product people could use."],
];

let challenges = SEED.map(([title, type, theme, levels, source, company, weeks, xp, summary], i) => ({
  id: `ch-${i + 1}`,
  title,
  type,
  theme,
  levels,
  source,
  company,
  durationWeeks: weeks,
  xp,
  summary,
  objectives: [
    "Understand the problem and who it affects",
    "Generate and compare at least three ideas",
    "Build and test a simple prototype",
  ],
  submission: weeks <= 2 ? ["Problem canvas", "Idea pitch"] : ["Problem canvas", "Idea pitch", "Prototype or demo link", "Presentation deck"],
  eligibility: levels.map(levelLabel).join(", "),
  rewards: `${xp} XP${type === "company" ? " and a certificate from the company" : ""}`,
  platformParticipants: 120 + ((i * 397) % 1900),
  createdOn: Date.now() - (200 - i * 9) * DAY,
}));

export function listChallenges() {
  return challenges;
}

export const challengeById = (id) => challenges.find((c) => c.id === id) ?? null;

export function challengeTitleTaken(title) {
  const key = title.trim().toLowerCase();
  return challenges.some((c) => c.title.toLowerCase() === key);
}

// Institution-level challenge (BRD 6.2). Fields follow the platform's challenge form (AI070).
export function createInstitutionChallenge(fields) {
  const challenge = {
    id: `ch-${Date.now().toString(36)}`,
    title: fields.title.trim(),
    type: fields.type,
    theme: fields.theme || null,
    levels: fields.levels,
    source: "institution",
    company: null,
    durationWeeks: fields.durationWeeks,
    xp: fields.xp,
    summary: fields.summary.trim(),
    objectives: fields.objectives,
    submission: fields.submission,
    eligibility: fields.levels.map(levelLabel).join(", "),
    rewards: fields.rewards.trim() || `${fields.xp} XP`,
    platformParticipants: 0,
    createdOn: Date.now(),
  };
  challenges = [challenge, ...challenges];
  return challenge;
}
