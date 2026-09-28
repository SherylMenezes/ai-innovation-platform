// Thin client for backend/app/routers/ai.py. Base URL is configurable via
// VITE_API_BASE_URL (see .env.example) since the backend's run port isn't
// fixed by any project convention — defaults to FastAPI/uvicorn's own
// default of 8000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

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

// The backend gives up on a slow model after ~75s in total (see
// llm_service.py); this is slightly longer, so a hung request always ends
// with a message instead of an endless "Asking AI...".
const REQUEST_TIMEOUT_MS = 90_000;

async function requestJson(path, options, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw new Error("Could not reach the AI service — is the backend running?");
    }

    return await handleJsonResponse(response);
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The AI service took too long to respond. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function postJson(path, body, token) {
  return requestJson(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    token
  );
}

function getJson(path, token) {
  return requestJson(path, {}, token);
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
// Interactive 5 Whys: the AI returns the next contextual Why question plus
// 3 thinking hints for activeIndex, reasoning from the student's answers so
// far. Once all 5 answers are sent, it returns the root-cause synthesis.
export function refineProblem(problemStatement, answers = [], activeIndex = 0) {
  return postJson("/api/ai/problem-refine", {
    problem_statement: problemStatement,
    answers,
    active_index: activeIndex,
  });
}

// POST /api/ai/problem-canvas-score — ProblemCanvasScoreRequest -> ProblemCanvasScoreResponse
export function scoreProblemCanvas({
  problemStatement,
  whyAnswers,
  rootCause = "",
  refinedProblemStatement = "",
}) {
  return postJson("/api/ai/problem-canvas-score", {
    problem_statement: problemStatement,
    why_answers: whyAnswers,
    root_cause: rootCause,
    refined_problem_statement: refinedProblemStatement,
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

// POST /api/ai/rank-ideas — RankIdeasRequest -> RankIdeasResponse
export function rankIdeas({ context, currentTitle, currentDescription, currentScores, ideas }) {
  return postJson("/api/ai/rank-ideas", {
    context,
    current_title: currentTitle,
    current_description: currentDescription,
    current_scores: currentScores,
    ideas,
  });
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