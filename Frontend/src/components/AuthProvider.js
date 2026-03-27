"use client";

import {
  AUTH_EXPIRED_EVENT,
  AUTH_USER_STORAGE_KEY,
} from "@/lib/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCurrentUser } from "@/lib/auth-client";
import { mergeAuthUsers, normalizeAuthUser } from "@/lib/auth-user";

const AuthContext = createContext(null);

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.sessionStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return normalizeAuthUser(JSON.parse(storedUser));
  } catch {
    window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function persistUser(user) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(normalizeAuthUser(user))
  );
}

function clearStoredUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const setCurrentUser = useCallback((nextUser) => {
    const normalizedUser = normalizeAuthUser(nextUser);
    persistUser(normalizedUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const clearCurrentUser = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (seedUser = null) => {
    try {
      const currentUser = await getCurrentUser();
      const mergedUser = mergeAuthUsers(readStoredUser(), seedUser, currentUser);
      setCurrentUser(mergedUser);
      return mergedUser;
    } catch (error) {
      if (error.status === 401) {
        clearCurrentUser();
        return null;
      }

      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  }, [clearCurrentUser, setCurrentUser]);

  useEffect(() => {
    const storedUser = readStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }

    refreshUser(storedUser).catch(() => {
      clearCurrentUser();
    });
  }, [clearCurrentUser, refreshUser]);

  useEffect(() => {
    function handleAuthExpired() {
      clearCurrentUser();
      setIsAuthLoading(false);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [clearCurrentUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      refreshUser,
      setCurrentUser,
      clearCurrentUser,
    }),
    [clearCurrentUser, isAuthLoading, refreshUser, setCurrentUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
