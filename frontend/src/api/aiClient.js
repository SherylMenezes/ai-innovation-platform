// Thin client for backend/app/routers/ai.py. Base URL is configurable via
// VITE_API_BASE_URL (see .env.example) since the backend's run port isn't
// fixed by any project convention — defaults to FastAPI/uvicorn's own
// default of 8000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Could not reach the AI service — is the backend running?");
  }

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

// POST /api/ai/generate-ideas — GenerateIdeasRequest -> GenerateIdeasResponse
export function generateIdeas(problemOrHmw, count) {
  return postJson("/api/ai/generate-ideas", { problem_or_hmw: problemOrHmw, count });
}

// POST /api/ai/remix-ideas — RemixIdeasRequest -> RemixIdeasResponse
export function remixIdeas(ideaIds, ideaDescriptions) {
  return postJson("/api/ai/remix-ideas", { idea_ids: ideaIds, idea_descriptions: ideaDescriptions });
}
