// Mirrors backend/app/services/xp_rules.py CHALLENGE_PHASES — the four
// Phases of a challenge, and the App page each one lives on.
export const CHALLENGE_PHASES = [
  { number: 1, stage: "canvas", name: "Problem Canvas", page: "canvas" },
  { number: 2, stage: "ideation", name: "Ideate", page: "ideation" },
  { number: 3, stage: "evaluation", name: "Idea Evaluation", page: "evaluation" },
  { number: 4, stage: "submission", name: "Submit Project", page: "submission" },
];

// Backward-compatible alias for any components still referencing CHALLENGE_LEVELS
export const CHALLENGE_LEVELS = CHALLENGE_PHASES;

// Enrollment.current_stage -> App page. "submission" and "completed"
// don't share their page's name, so setPage(stage) alone would land on a
// blank page.
export function pageForStage(stage) {
  if (stage === "completed") return "summary";
  return CHALLENGE_PHASES.find((phase) => phase.stage === stage)?.page || "canvas";
}

// Highest Phase number the student has unlocked for a stage.
export function unlockedPhaseForStage(stage) {
  if (stage === "completed") return CHALLENGE_PHASES.length;
  return CHALLENGE_PHASES.find((phase) => phase.stage === stage)?.number || 1;
}

// Backward-compatible alias for unlockedLevelForStage
export const unlockedLevelForStage = unlockedPhaseForStage;

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
  ideation_complete: "Ideation complete — idea picked",
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
    case "PHASE_CLEARED":
    case "LEVEL_CLEARED":
      return `Phase ${metadata.phase || metadata.level} cleared`;
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