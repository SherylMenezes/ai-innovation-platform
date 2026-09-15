import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getProfile } from "../api/authClient";

const STORAGE_KEY = "auth.tokens";
const AuthContext = createContext(null);

function readStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(readStoredTokens);
  const [user, setUser] = useState(null);
  // Starts true whenever a stored token exists, so the app can show a
  // loading state instead of flashing the login page while the profile
  // fetch below confirms the token is still valid.
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredTokens()));

  useEffect(() => {
    if (!tokens?.access_token) {
      setIsLoading(false);
      return;
    }
    getProfile(tokens.access_token)
      .then(setUser)
      .catch(() => {
        // Token expired/invalid — drop it rather than get stuck logged
        // in with a broken session.
        setTokens(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, [tokens?.access_token]);

  const loginWithTokens = useCallback(async (newTokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
    setTokens(newTokens);
    const profile = await getProfile(newTokens.access_token);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
    setUser(null);
  }, []);

  const value = {
    user,
    accessToken: tokens?.access_token || null,
    isAuthenticated: Boolean(user),
    isLoading,
    loginWithTokens,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
