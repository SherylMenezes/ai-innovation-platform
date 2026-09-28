import { authenticatedRequest } from "./apiClient";


export function createSubmission(
  token,
  {
    challengeId,
    file,
    repositoryUrl,
  }
) {
  const formData = new FormData();

  formData.append(
    "challenge_id",
    challengeId
  );

  if (repositoryUrl) {
    formData.append(
      "repository_url",
      repositoryUrl
    );
  }

  if (file) {
    formData.append(
      "file",
      file
    );
  }

  return authenticatedRequest(
    "/api/submissions",
    {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    }
  );
}


export function getSubmissionStatus(
  token,
  submissionId
) {
  return authenticatedRequest(
    `/api/submissions/${submissionId}/status`,
    { token }
  );
}


export function evaluateSubmission(
  token,
  submissionId
) {
  return authenticatedRequest(
    `/api/submissions/${submissionId}/evaluate`,
    {
      method: "POST",
      token,
    }
  );
}


export function getSubmissionScorecard(
  token,
  submissionId
) {
  return authenticatedRequest(
    `/api/submissions/${submissionId}/scorecard`,
    { token }
  );
}