// Thin client for backend/app/routers/submissions.py.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function authedRequest(path, { method = "GET", token, body, isFormData = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
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

// POST /api/submissions (multipart/form-data)
export function createSubmission(token, { challengeId, file, repositoryUrl }) {
  const formData = new FormData();
  formData.append("challenge_id", challengeId);
  if (repositoryUrl) formData.append("repository_url", repositoryUrl);
  if (file) formData.append("file", file);
  return authedRequest("/api/submissions", { method: "POST", token, body: formData, isFormData: true });
}

// GET /api/submissions/{id}/status
export function getSubmissionStatus(token, submissionId) {
  return authedRequest(`/api/submissions/${submissionId}/status`, { token });
}

// POST /api/submissions/{id}/evaluate
export function evaluateSubmission(token, submissionId) {
  return authedRequest(`/api/submissions/${submissionId}/evaluate`, { method: "POST", token });
}

// GET /api/submissions/{id}/scorecard
export function getSubmissionScorecard(token, submissionId) {
  return authedRequest(`/api/submissions/${submissionId}/scorecard`, { token });
}
