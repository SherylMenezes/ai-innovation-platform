const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";


// ============================================================
// TOKEN STORAGE
// ============================================================

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";


export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}


export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}


export function storeTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}


export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


// ============================================================
// GENERIC REQUEST HELPER
// ============================================================

async function request(
  path,
  {
    method = "GET",
    body,
    headers = {},
  } = {}
) {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: {
          ...headers,
          ...(body !== undefined
            ? {
                "Content-Type": "application/json",
              }
            : {}),
        },
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch {
    throw new Error(
      "Could not reach the backend — is the server running?"
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // No JSON response.
  }

  if (!response.ok) {
    const detail = extractErrorDetail(data);

    throw new Error(
      detail || `Request failed (${response.status}).`
    );
  }

  return data;
}


function extractErrorDetail(data) {
  if (!data || !data.detail) {
    return "";
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map(
        (item) =>
          item.msg || JSON.stringify(item)
      )
      .join("; ");
  }

  return data.detail;
}


// ============================================================
// OTP
// ============================================================

// POST /api/auth/otp/generate
export function generateOtp(
  identifier,
  channel,
  purpose
) {
  return request(
    "/api/auth/otp/generate",
    {
      method: "POST",
      body: {
        identifier,
        channel,
        purpose,
      },
    }
  );
}


// POST /api/auth/otp/verify
export function verifyOtp(
  identifier,
  channel,
  purpose,
  code
) {
  return request(
    "/api/auth/otp/verify",
    {
      method: "POST",
      body: {
        identifier,
        channel,
        purpose,
        code,
      },
    }
  );
}


// ============================================================
// REGISTRATION
// ============================================================

// POST /api/auth/register
export function register({
  name,
  email,
  password,
  code,
  academicTier,
  institutionName,
}) {
  return request(
    "/api/auth/register",
    {
      method: "POST",
      body: {
        name,
        email,
        password,
        channel: "email",
        code,
        academic_tier: academicTier,
        institution_name:
          institutionName || null,
      },
    }
  );
}


// ============================================================
// LOGIN
// ============================================================

// POST /api/auth/login
export async function login(
  email,
  password
) {
  const data = await request(
    "/api/auth/login",
    {
      method: "POST",
      body: {
        email,
        password,
      },
    }
  );

  // Save the tokens returned by the backend.
  if (
    data?.access_token ||
    data?.refresh_token
  ) {
    storeTokens(
      data.access_token,
      data.refresh_token
    );
  }

  return data;
}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

// POST /api/auth/refresh
export async function refreshAccessToken(
  refreshToken
) {
  if (!refreshToken) {
    throw new Error(
      "No refresh token available."
    );
  }

  const data = await request(
    "/api/auth/refresh",
    {
      method: "POST",
      body: {
        refresh_token: refreshToken,
      },
    }
  );

  // Store the newly issued tokens.
  if (
    data?.access_token ||
    data?.refresh_token
  ) {
    storeTokens(
      data.access_token,
      data.refresh_token || refreshToken
    );
  }

  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {
  clearStoredTokens();
}


// ============================================================
// USER PROFILE
// ============================================================

// GET /api/user/profile
export async function getProfile(token) {
  const accessToken =
    token || getStoredAccessToken();

  return request(
    "/api/user/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}