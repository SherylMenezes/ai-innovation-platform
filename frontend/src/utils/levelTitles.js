export const LEVEL_TITLES = {
  1: "Explorer",
  2: "Problem Solver",
  3: "Ideation Specialist",
  4: "Product Architect",
  5: "Innovation Lead",
  6: "Master Strategist",
  7: "System Visionary",
  8: "Ecosystem Builder",
  9: "Principal Innovator",
  10: "Grandmaster Architect"
};

export function getLevelTitle(levelNum) {
  const level = Number(levelNum) || 1;
  return LEVEL_TITLES[level] || `Level ${level} Grandmaster`;
}