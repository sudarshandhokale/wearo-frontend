import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AppService } from "../api/AppService";
import type { AppMetadata, StyleProfile, StyleProfileInput } from "../api/types";
import { useAuth } from "../auth/AuthContext";

type AppDataContextValue = {
  metadata: AppMetadata | null;
  styleProfile: StyleProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveStyleProfile: (input: StyleProfileInput) => Promise<StyleProfile>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (userId == null) {
      setMetadata(null);
      setStyleProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [metadataResponse, profileResponse] = await Promise.all([
        AppService.metadata(),
        AppService.styleProfile()
      ]);
      setMetadata(metadataResponse.data);
      setStyleProfile(profileResponse.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "WEARO could not load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      metadata,
      styleProfile,
      isLoading,
      error,
      refresh,
      async saveStyleProfile(input) {
        const response = await AppService.updateStyleProfile(input);
        setStyleProfile(response.data);
        return response.data;
      }
    }),
    [error, isLoading, metadata, refresh, styleProfile]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider.");
  return context;
}
