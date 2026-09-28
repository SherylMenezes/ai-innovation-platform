// Thin client for backend/app/routers/ai.py. Base URL is configurable via
// VITE_API_BASE_URL (see .env.example) since the backend's run port isn't
// fixed by any project convention — defaults to FastAPI/uvicorn's own
// default of 8000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleJsonResponse(response) {
  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) detail = ` (${errorBody.detail})`;
    } catch {
      // Response body wasn't JSON — fall through with no extra detail.
    }
    throw new Error(`AI service returned an error${detail}.`);
  }

  return response.json();
}

async function postJson(path, body, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Could not reach the AI service — is the backend running?");
  }

  return handleJsonResponse(response);
}

async function getJson(path, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error("Could not reach the AI service — is the backend running?");
  }

  return handleJsonResponse(response);
}

// POST /api/ai/generate-ideas — GenerateIdeasRequest -> GenerateIdeasResponse
export function generateIdeas(problemOrHmw, count) {
  return postJson("/api/ai/generate-ideas", { problem_or_hmw: problemOrHmw, count });
}

// POST /api/ai/remix-ideas — RemixIdeasRequest -> RemixIdeasResponse
export function remixIdeas(ideaIds, ideaDescriptions) {
  return postJson("/api/ai/remix-ideas", { idea_ids: ideaIds, idea_descriptions: ideaDescriptions });
}

// POST /api/ai/problem-refine — ProblemRefineRequest -> ProblemRefineResponse
// existingWhys (optional): whys the user has already typed, in order. When
// given, the backend continues that exact chain instead of generating all
// 5 from scratch — see ProblemCanvas.jsx's handleGetAiRootCause.
export function refineProblem(problemStatement, existingWhys) {
  return postJson("/api/ai/problem-refine", {
    problem_statement: problemStatement,
    existing_whys: existingWhys && existingWhys.length > 0 ? existingWhys : undefined,
  });
}

// POST /api/ai/problem-score — ProblemScoreRequest -> ProblemScoreResponse
export function scoreProblemWithAi(problemStatement) {
  return postJson("/api/ai/problem-score", { problem_statement: problemStatement });
}

// POST /api/ai/hmw-generate — HMWGenerateRequest -> HMWGenerateResponse
export function generateHmw(rootCause) {
  return postJson("/api/ai/hmw-generate", { root_cause: rootCause });
}

// POST /api/ai/swot-analysis — SWOTAnalysisRequest -> SWOTAnalysisResponse
export function getSwotAnalysis(title, description) {
  return postJson("/api/ai/swot-analysis", { title, description });
}

// POST /api/ai/score-idea — IdeaScoreRequest -> IdeaScoreResponse
export function scoreIdea(title, description) {
  return postJson("/api/ai/score-idea", { title, description });
}

// POST /api/ai/score-swot — SwotScoreRequest -> SwotScoreResponse
export function scoreIdeaFromSwot(title, description, swot) {
  return postJson("/api/ai/score-swot", { title, description, ...swot });
}

// GET /api/ai/risk-analysis — query params -> RiskAnalysisResponse
export function getRiskAnalysis(title, description) {
  const params = new URLSearchParams({ title, description: description || "" });
  return getJson(`/api/ai/risk-analysis?${params.toString()}`);
}

// POST /api/ai/mentor-coach (authed) — MentorCoachRequest -> MentorCoachResponse
export function mentorCoach(token, workspaceContext, userQuery, currentStage, workspaceId = "default") {
  return postJson(
    "/api/ai/mentor-coach",
    { workspace_context: workspaceContext, user_query: userQuery, current_stage: currentStage, workspace_id: workspaceId },
    token
  );
}

// GET /api/ai/mentor/history (authed) -> MentorHistoryResponse
export function getMentorHistory(token, workspaceId = "default") {
  return getJson(`/api/ai/mentor/history?workspace_id=${encodeURIComponent(workspaceId)}`, token);
}

// POST /api/ai/mentor/stream (authed) — returns the raw fetch Response so
// callers can read the token stream themselves.
export async function streamMentorChat(token, workspaceContext, userQuery, currentStage, workspaceId = "default") {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ai/mentor/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspace_context: workspaceContext,
        user_query: userQuery,
        current_stage: currentStage,
        workspace_id: workspaceId,
      }),
    });
  } catch {
    throw new Error("Could not reach the AI service — is the backend running?");
  }

  if (!response.ok) {
    throw new Error(`Mentor streaming failed (${response.status}).`);
  }

  return response;
}