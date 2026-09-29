// src/utils/levelTitles.js

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

/**
 * Calculates current level and progression details from cumulative XP.
 * Progression: 100 XP for Lvl 2, +200 for Lvl 3, +300 for Lvl 4, etc.
 */
export function getLevelDetailsFromXp(totalXp = 0) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  let xpForNext = 100; // XP needed to step from level 1 to level 2

  // Subtract step-by-step up to Level 10
  while (level < 10 && xp >= xpForNext) {
    xp -= xpForNext;
    level += 1;
    xpForNext = level * 100; // Next step requires (level * 100) XP
  }

  return {
    level,
    title: getLevelTitle(level),
    xpIntoLevel: xp,          // XP accumulated in current level
    xpForNextLevel: xpForNext, // Total XP needed to clear current level
    progressPercent: level >= 10 ? 100 : Math.min(100, Math.round((xp / xpForNext) * 100))
  };
}

/**
 * Quick helper that only returns the level number (useful for tables/leaderboards)
 */
export function calculateLevelFromXp(totalXp = 0) {
  return getLevelDetailsFromXp(totalXp).level;
}