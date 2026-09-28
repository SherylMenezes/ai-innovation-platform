// Thin client for backend/app/routers/ideation.py.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// async function request(path, { method = "GET", body, token } = {}) {
//   let response;
//   try {
//     response = await fetch(`${API_BASE_URL}${path}`, {
//       method,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: body ? JSON.stringify(body) : undefined,
//     });
//   } catch {
//     throw new Error("Could not reach the backend — is the server running?");
//   }

//   if (response.status === 204) return null;

//   let data = null;
//   try {
//     data = await response.json();
//   } catch {
//     // No JSON body — fall through with data left null.
//   }

//   if (!response.ok) {
//     const detail = data?.detail;
//     const message = Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : detail;
//     throw new Error(message || `Request failed (${response.status}).`);
//   }

//   return data;
// }

import { authenticatedRequest } from "./apiClient";


export function listNotes(
  token,
  challengeId
) {
  const qs = challengeId
    ? `?challenge_id=${challengeId}`
    : "";

  return authenticatedRequest(
    `/api/ideation/notes${qs}`,
    { token }
  );
}


export function createNote(
  token,
  note,
  challengeId
) {
  return authenticatedRequest(
    "/api/ideation/notes",
    {
      method: "POST",
      token,
      body: {
        ...note,
        challenge_id: challengeId,
      },
    }
  );
}


export function updateNote(
  token,
  id,
  patch
) {
  return authenticatedRequest(
    `/api/ideation/notes/${id}`,
    {
      method: "PATCH",
      token,
      body: patch,
    }
  );
}


export function deleteNote(
  token,
  id
) {
  return authenticatedRequest(
    `/api/ideation/notes/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}