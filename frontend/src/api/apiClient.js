const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STORAGE_KEY = "auth.tokens";

let refreshPromise = null;


function getStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


function storeTokens(tokens) {
  const tokenFields = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || "bearer",
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tokenFields)
  );

  window.dispatchEvent(
    new CustomEvent("auth:tokens-refreshed", {
      detail: tokenFields,
    })
  );

  return tokenFields;
}


function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new Event("auth:session-expired")
  );
}


function extractErrorDetail(data) {
  if (!data || !data.detail) {
    return "";
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg || JSON.stringify(item))
      .join("; ");
  }

  return data.detail;
}


async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // Empty/non-JSON response.
  }

  return data;
}


async function performRefresh() {
  const tokens = getStoredTokens();

  if (!tokens?.refresh_token) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/auth/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: tokens.refresh_token,
      }),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    clearStoredTokens();

    const detail = extractErrorDetail(data);

    throw new Error(
      detail || "Your session has expired. Please log in again."
    );
  }

  return storeTokens(data);
}


export async function refreshSession() {
  /*
   * If several API requests receive 401 at exactly the same time,
   * only one refresh request is sent.
   */
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}


export async function authenticatedRequest(
  path,
  {
    method = "GET",
    token,
    body,
    isFormData = false,
    retry = true,
  } = {}
) {
  let accessToken = token || getStoredTokens()?.access_token;

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: {
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
          ...(body !== undefined && !isFormData
            ? {
                "Content-Type": "application/json",
              }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : isFormData
              ? body
              : JSON.stringify(body),
      }
    );
  } catch {
    throw new Error(
      "Could not reach the backend — is the server running?"
    );
  }

  if (response.status === 401 && retry) {
    try {
      const newTokens = await refreshSession();

      return authenticatedRequest(path, {
        method,
        token: newTokens.access_token,
        body,
        isFormData,
        retry: false,
      });
    } catch {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const detail = extractErrorDetail(data);

    throw new Error(
      detail || `Request failed (${response.status}).`
    );
  }

  return data;
}


export async function authenticatedFetch(
  path,
  {
    method = "GET",
    token,
    body,
    headers = {},
    retry = true,
  } = {}
) {
  let accessToken = token || getStoredTokens()?.access_token;

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: {
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
          ...headers,
        },
        body,
      }
    );
  } catch {
    throw new Error(
      "Could not reach the backend — is the server running?"
    );
  }

  if (response.status === 401 && retry) {
    try {
      const newTokens = await refreshSession();

      return authenticatedFetch(path, {
        method,
        token: newTokens.access_token,
        body,
        headers,
        retry: false,
      });
    } catch {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }
  }

  return response;
}