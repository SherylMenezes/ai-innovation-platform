import { authenticatedRequest } from "./apiClient";


export function getUserStats(token) {
  return authenticatedRequest(
    "/api/gamification/user-stats",
    { token }
  );
}


export function checkIn(token) {
  return authenticatedRequest(
    "/api/gamification/streak/check-in",
    {
      method: "POST",
      token,
    }
  );
}


export function getBadges(token) {
  return authenticatedRequest(
    "/api/gamification/badges",
    { token }
  );
}


export function getLeaderboard(
  token,
  scope = "global",
  limit = 20
) {
  return authenticatedRequest(
    `/api/gamification/leaderboard?scope=${encodeURIComponent(
      scope
    )}&limit=${limit}`,
    { token }
  );
}


export function getXpHistory(
  token,
  limit = 20
) {
  return authenticatedRequest(
    `/api/gamification/xp-history?limit=${limit}`,
    { token }
  );
}