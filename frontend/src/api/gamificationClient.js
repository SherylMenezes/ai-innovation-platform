// Thin client for backend/app/routers/gamification.py.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function authedRequest(path, { method = "GET", token } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Could not reach the backend — is the server running?");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body — fall through with data left null.
  }

  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : detail;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return data;
}

// GET /api/gamification/user-stats
export function getUserStats(token) {
  return authedRequest("/api/gamification/user-stats", { token });
}

// POST /api/gamification/streak/check-in
export function checkIn(token) {
  return authedRequest("/api/gamification/streak/check-in", { method: "POST", token });
}

// GET /api/gamification/badges
export function getBadges(token) {
  return authedRequest("/api/gamification/badges", { token });
}

// GET /api/gamification/leaderboard?scope=&limit=
export function getLeaderboard(token, scope = "global", limit = 20) {
  return authedRequest(`/api/gamification/leaderboard?scope=${scope}&limit=${limit}`, { token });
}

// GET /api/gamification/xp-history?limit=
export function getXpHistory(token, limit = 20) {
  return authedRequest(`/api/gamification/xp-history?limit=${limit}`, { token });
}
