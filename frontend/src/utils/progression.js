// Mirrors backend/app/services/xp_rules.py CHALLENGE_LEVELS — the four
// Levels of a challenge, and the App page each one lives on.
export const CHALLENGE_LEVELS = [
  { number: 1, stage: "canvas", name: "Problem Canvas", page: "canvas" },
  { number: 2, stage: "ideation", name: "Ideation Board", page: "ideation" },
  { number: 3, stage: "evaluation", name: "Idea Evaluation", page: "evaluation" },
  { number: 4, stage: "submission", name: "Submit Project", page: "submit" },
];

// Enrollment.current_stage -> App page. "submission" and "completed"
// don't share their page's name, so setPage(stage) alone would land on a
// blank page.
export function pageForStage(stage) {
  if (stage === "completed") return "summary";
  return CHALLENGE_LEVELS.find((level) => level.stage === stage)?.page || "canvas";
}

// Highest Level number the student has unlocked for a stage.
export function unlockedLevelForStage(stage) {
  if (stage === "completed") return CHALLENGE_LEVELS.length;
  return CHALLENGE_LEVELS.find((level) => level.stage === stage)?.number || 1;
}

export const BADGES = {
  challenge_completer: { icon: "🏁", name: "Challenge Completer", hint: "Complete any challenge" },
  high_achiever: { icon: "🥈", name: "High Achiever", hint: "Score 16/20 or higher" },
  perfectionist: { icon: "🥇", name: "Perfectionist", hint: "Score 19/20 or higher" },
};

export function badgeIcon(slug) {
  return BADGES[slug]?.icon || "🏅";
}

const STEP_LABELS = {
  canvas_step_1: "Read the problem",
  canvas_step_2: "5 Whys",
  canvas_step_3: "Root cause & How Might We",
  canvas_step_4: "Picked an idea",
  ideation_complete: "Ideation complete",
  eval_swot: "AI SWOT analysis",
  eval_scoring: "AI idea scoring",
  eval_complete: "Evaluation complete",
};

export function stepLabel(stepKey) {
  return STEP_LABELS[stepKey] || "Step complete";
}

// Human label for one XPTransaction (workspace `rewards` / xp-history item).
export function describeXpEvent(item) {
  const metadata = item.metadata || {};
  switch (item.source_event) {
    case "WORKSPACE_STEP_COMPLETED":
      return stepLabel(metadata.step);
    case "LEVEL_CLEARED":
      return `Level ${metadata.level} cleared`;
    case "CHALLENGE_SUBMITTED":
      return "Project submitted";
    case "CHALLENGE_EVALUATED":
      return metadata.overall_score != null ? `AI evaluation (${metadata.overall_score}/20)` : "AI evaluation";
    case "BADGE_EARNED":
      return `Badge: ${BADGES[metadata.badge_slug]?.name || metadata.badge_slug}`;
    case "STREAK_CHECKIN":
      return "Daily check-in";
    default:
      return item.source_event;
  }
}
