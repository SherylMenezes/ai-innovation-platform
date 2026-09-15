// Thin client for backend/app/routers/auth.py and app/routers/user.py.
// Base URL is configurable via VITE_API_BASE_URL (see .env.example).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the backend — is the server running?");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. a plain 500) — fall through with data left null.
  }

  if (!response.ok) {
    const detail = extractErrorDetail(data);
    throw new Error(detail || `Request failed (${response.status}).`);
  }

  return data;
}

// FastAPI validation errors come back as {"detail": [{"msg": "...", ...}, ...]};
// application errors come back as {"detail": "some message"}.
function extractErrorDetail(data) {
  if (!data || !data.detail) return "";
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
  }
  return data.detail;
}

// POST /api/auth/otp/generate
export function generateOtp(identifier, channel, purpose) {
  return request("/api/auth/otp/generate", {
    method: "POST",
    body: { identifier, channel, purpose },
  });
}

// POST /api/auth/otp/verify
export function verifyOtp(identifier, channel, purpose, code) {
  return request("/api/auth/otp/verify", {
    method: "POST",
    body: { identifier, channel, purpose, code },
  });
}

// POST /api/auth/register
export function register({ name, email, phone, channel, code, academicTier, institutionName }) {
  return request("/api/auth/register", {
    method: "POST",
    body: {
      name,
      email: email || null,
      phone: phone || null,
      channel,
      code,
      academic_tier: academicTier,
      institution_name: institutionName || null,
    },
  });
}

// POST /api/auth/login
export function login(identifier, channel, code) {
  return request("/api/auth/login", {
    method: "POST",
    body: { identifier, channel, code },
  });
}

// GET /api/user/profile
export function getProfile(token) {
  return request("/api/user/profile", { token });
}
