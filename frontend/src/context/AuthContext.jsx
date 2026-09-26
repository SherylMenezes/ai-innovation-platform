import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getProfile } from "../api/authClient";
import { clearCache, readCache, writeCache } from "../utils/cache";

const STORAGE_KEY = "auth.tokens";
const USER_CACHE_KEY = "auth.user";
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
  // With a stored token, start from the cached profile so the app renders
  // immediately instead of blocking on a profile request to a slow
  // backend; the effect below still re-validates the token in the
  // background and signs out if it's no longer valid.
  const [user, setUser] = useState(() => (readStoredTokens() ? readCache(USER_CACHE_KEY) : null));
  // Only show the full-screen loading state when there's a token but no
  // cached profile to render yet.
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredTokens()) && !readCache(USER_CACHE_KEY));
  // Token we just received from login/register along with its profile —
  // no need to re-fetch that profile a moment later.
  const freshTokenRef = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearCache();
    setTokens(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!tokens?.access_token) {
      setIsLoading(false);
      return;
    }
    if (freshTokenRef.current === tokens.access_token) return;
    getProfile(tokens.access_token)
      .then((profile) => {
        setUser(profile);
        writeCache(USER_CACHE_KEY, profile);
      })
      // Token expired/invalid — drop it rather than get stuck logged in
      // with a broken session.
      .catch(clearSession)
      .finally(() => setIsLoading(false));
  }, [tokens?.access_token, clearSession]);

  // `newTokens.user` is the profile the login/register response already
  // carries; older responses without it fall back to fetching it.
  const loginWithTokens = useCallback(async (newTokens) => {
    const { user: includedProfile, ...tokenFields } = newTokens;
    const profile = includedProfile || (await getProfile(tokenFields.access_token));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenFields));
    writeCache(USER_CACHE_KEY, profile);
    freshTokenRef.current = tokenFields.access_token;
    setTokens(tokenFields);
    setUser(profile);
  }, []);

  const value = {
    user,
    accessToken: tokens?.access_token || null,
    isAuthenticated: Boolean(user),
    isLoading,
    loginWithTokens,
    logout: clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
