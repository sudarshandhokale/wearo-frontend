import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { AuthService } from "../api/AuthService";
import type { ApiUser, AuthResponseData, LoginParams, RegisterParams, UpdateUserParams } from "../api/types";
import { parseBearerToken } from "./authToken";
import { tokenStorage } from "./tokenStorage";
import { onUnauthorized } from "./sessionEvents";
import type { PickedImage } from "../api/AppService";

type AuthContextValue = {
  isInitializing: boolean;
  isSubmitting: boolean;
  user: ApiUser | null;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  updateUser: (params: UpdateUserParams) => Promise<ApiUser>;
  updateFullBodyImage: (image: PickedImage) => Promise<ApiUser>;
  deleteFullBodyImage: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractUser(data: AuthResponseData | ApiUser) {
  return "user" in data ? data.user : data;
}

async function persistAuth(authorizationHeader: string | null) {
  const token = parseBearerToken(authorizationHeader);

  if (!token) {
    throw new Error("The server did not include an Authorization token.");
  }

  await tokenStorage.set(token);
  return token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const token = await tokenStorage.get();

        if (!token) {
          return;
        }

        const response = await AuthService.me(token);

        if (isMounted) {
          setUser(extractUser(response.data));
        }
      } catch {
        await tokenStorage.clear();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isInitializing,
      isSubmitting,
      user,
      async login(params) {
        setIsSubmitting(true);
        try {
          const response = await AuthService.login(params);
          await persistAuth(response.authorizationHeader);
          setUser(extractUser(response.data));
        } finally {
          setIsSubmitting(false);
        }
      },
      async register(params) {
        setIsSubmitting(true);
        try {
          const response = await AuthService.register(params);
          await persistAuth(response.authorizationHeader);
          setUser(extractUser(response.data));
        } finally {
          setIsSubmitting(false);
        }
      },
      async updateUser(params) {
        const token = await tokenStorage.get();
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        setIsSubmitting(true);
        try {
          const response = await AuthService.updateMe(params, token);
          const updatedUser = extractUser(response.data);
          setUser(updatedUser);
          return updatedUser;
        } finally {
          setIsSubmitting(false);
        }
      },
      async updateFullBodyImage(image) {
        const token = await tokenStorage.get();
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await AuthService.updateFullBodyImage(image, token);
        const updatedUser = extractUser(response.data); setUser(updatedUser); return updatedUser;
      },
      async deleteFullBodyImage() {
        const token = await tokenStorage.get();
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        await AuthService.deleteFullBodyImage(token);
        setUser((current) => current ? { ...current, full_body_image: null } : current);
      },
      async logout() {
        const token = await tokenStorage.get();
        setUser(null);
        await tokenStorage.clear();

        if (token) {
          try {
            await AuthService.logout(token);
          } catch {
            // Local logout should still complete if the token was already expired.
          }
        }
      }
    }),
    [isInitializing, isSubmitting, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
