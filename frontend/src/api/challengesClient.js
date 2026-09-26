// Thin client for backend/app/routers/challenges.py.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, { method = "GET", token, body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

// GET /api/challenges?domain=&difficulty=&tier=&search=
export function listChallenges({ domain, difficulty, tier, search } = {}) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (difficulty) params.set("difficulty", difficulty);
  if (tier) params.set("tier", tier);
  if (search) params.set("search", search);
  const qs = params.toString();
  return request(`/api/challenges${qs ? `?${qs}` : ""}`);
}

// GET /api/challenges/{id}
export function getChallenge(id) {
  return request(`/api/challenges/${id}`);
}

// POST /api/challenges/{id}/enroll
export function enrollInChallenge(token, id) {
  return request(`/api/challenges/${id}/enroll`, { method: "POST", token });
}

// GET /api/challenges/enrolled
export function getEnrolledChallenges(token) {
  return request("/api/challenges/enrolled", { token });
}

// The Level bar and the page under it both load the workspace on mount —
// concurrent identical calls share one in-flight request instead of
// hitting the backend twice.
const inflightWorkspaceRequests = new Map();

// GET /api/challenges/{id}/workspace
export function getWorkspace(token, challengeId) {
  const key = `${token}:${challengeId}`;
  if (!inflightWorkspaceRequests.has(key)) {
    const pending = request(`/api/challenges/${challengeId}/workspace`, { token }).finally(() =>
      inflightWorkspaceRequests.delete(key)
    );
    inflightWorkspaceRequests.set(key, pending);
  }
  return inflightWorkspaceRequests.get(key);
}

// PATCH /api/challenges/{id}/workspace/canvas
export function saveCanvasState(token, challengeId, canvasState, markStepComplete) {
  return request(`/api/challenges/${challengeId}/workspace/canvas`, {
    method: "PATCH",
    token,
    body: { canvas_state: canvasState, mark_step_complete: markStepComplete || null },
  });
}

// PATCH /api/challenges/{id}/workspace/evaluation
export function saveEvaluationState(token, challengeId, evaluationState, markStepComplete) {
  return request(`/api/challenges/${challengeId}/workspace/evaluation`, {
    method: "PATCH",
    token,
    body: { evaluation_state: evaluationState, mark_step_complete: markStepComplete || null },
  });
}

// POST /api/challenges/{id}/workspace/advance-stage
// `stage` is the Level the calling page is finishing — if the student is
// already past it, the backend treats the call as a no-op.
export function advanceStage(token, challengeId, stage) {
  return request(`/api/challenges/${challengeId}/workspace/advance-stage`, {
    method: "POST",
    token,
    body: { stage: stage || null },
  });
}

// POST /api/challenges/{id}/workspace/complete-step
export function completeWorkspaceStep(token, challengeId, stepKey) {
  return request(`/api/challenges/${challengeId}/workspace/complete-step`, {
    method: "POST",
    token,
    body: { step_key: stepKey },
  });
}
