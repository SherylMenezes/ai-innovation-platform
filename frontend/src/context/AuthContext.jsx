import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useContext,
  useState,
} from "react";

import {
  getProfile,
} from "../api/authClient";

import {
  refreshSession,
} from "../api/apiClient";

import {
  clearCache,
  readCache,
  writeCache,
} from "../utils/cache";


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
  const [tokens, setTokens] = useState(
    readStoredTokens
  );

  const [user, setUser] = useState(() =>
    readStoredTokens()
      ? readCache(USER_CACHE_KEY)
      : null
  );

  const [isLoading, setIsLoading] = useState(
    () =>
      Boolean(readStoredTokens()) &&
      !readCache(USER_CACHE_KEY)
  );

  const freshTokenRef = useRef(null);


  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearCache();

    setTokens(null);
    setUser(null);
  }, []);


  /*
   * When apiClient refreshes the token, update React state too.
   */
  useEffect(() => {
    const handleTokensRefreshed = (event) => {
      const newTokens = event.detail;

      if (!newTokens?.access_token) {
        return;
      }

      setTokens(newTokens);
      freshTokenRef.current =
        newTokens.access_token;
    };


    const handleSessionExpired = () => {
      clearSession();
    };


    window.addEventListener(
      "auth:tokens-refreshed",
      handleTokensRefreshed
    );

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired
    );


    return () => {
      window.removeEventListener(
        "auth:tokens-refreshed",
        handleTokensRefreshed
      );

      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired
      );
    };
  }, [clearSession]);


  /*
   * Restore the session when the page is loaded.
   */
  useEffect(() => {
    if (!tokens?.access_token) {
      setIsLoading(false);
      return;
    }


    if (
      freshTokenRef.current ===
      tokens.access_token
    ) {
      setIsLoading(false);
      return;
    }


    getProfile(tokens.access_token)
      .then((profile) => {
        setUser(profile);
        writeCache(
          USER_CACHE_KEY,
          profile
        );
      })
      .catch(async () => {
        /*
         * Access token may simply have expired.
         * Try the refresh token before logging out.
         */
        try {
          const newTokens =
            await refreshSession();

          const profile =
            newTokens.user ||
            (await getProfile(
              newTokens.access_token
            ));

          setTokens(newTokens);
          setUser(profile);

          writeCache(
            USER_CACHE_KEY,
            profile
          );

          freshTokenRef.current =
            newTokens.access_token;
        } catch {
          clearSession();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    tokens?.access_token,
    clearSession,
  ]);


  const loginWithTokens =
    useCallback(async (newTokens) => {
      const {
        user: includedProfile,
        ...tokenFields
      } = newTokens;


      const profile =
        includedProfile ||
        (await getProfile(
          tokenFields.access_token
        ));


      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          access_token:
            tokenFields.access_token,
          refresh_token:
            tokenFields.refresh_token,
          token_type:
            tokenFields.token_type ||
            "bearer",
        })
      );


      writeCache(
        USER_CACHE_KEY,
        profile
      );


      freshTokenRef.current =
        tokenFields.access_token;


      setTokens({
        access_token:
          tokenFields.access_token,
        refresh_token:
          tokenFields.refresh_token,
        token_type:
          tokenFields.token_type ||
          "bearer",
      });


      setUser(profile);
    }, []);


  const value = {
    user,

    accessToken:
      tokens?.access_token || null,

    refreshToken:
      tokens?.refresh_token || null,

    isAuthenticated:
      Boolean(user),

    isLoading,

    loginWithTokens,

    logout: clearSession,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return ctx;
}