import Constants from "expo-constants";

import { ApiError, getFirstApiFieldError, normalizeApiFieldErrors } from "./ApiError";
import type { SafegoResponse } from "./types";
import { notifyUnauthorized } from "../auth/sessionEvents";
import { tokenStorage } from "../auth/tokenStorage";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "http://localhost:3000";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");
export const NGROK_SKIP_BROWSER_WARNING_HEADER = { "ngrok-skip-browser-warning": "true" };

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export type RestResult<T> = {
  data: T;
  authorizationHeader: string | null;
  meta: unknown | null;
};

export class RestService {
  static GET<T>(path: string, token?: string | null) {
    return this.request<T>(path, { method: "GET", token });
  }

  static POST<T>(path: string, body?: unknown, token?: string | null) {
    return this.request<T>(path, { method: "POST", body, token });
  }

  static PATCH<T>(path: string, body?: unknown, token?: string | null) {
    return this.request<T>(path, { method: "PATCH", body, token });
  }

  static DELETE<T>(path: string, token?: string | null) {
    return this.request<T>(path, { method: "DELETE", token });
  }

  static DELETE_WITH_BODY<T>(path: string, body: unknown, token?: string | null) {
    return this.request<T>(path, { method: "DELETE", body, token });
  }

  static POST_FORM<T>(path: string, body: FormData, token?: string | null) {
    return this.request<T>(path, { method: "POST", body, token });
  }

  static PATCH_FORM<T>(path: string, body: FormData, token?: string | null) {
    return this.request<T>(path, { method: "PATCH", body, token });
  }

  private static async request<T>(path: string, options: RequestOptions): Promise<RestResult<T>> {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = { Accept: "application/json", ...NGROK_SKIP_BROWSER_WARNING_HEADER };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined
    });

    return this.handleResponse<T>(response);
  }

  private static async handleResponse<T>(response: Response): Promise<RestResult<T>> {
    let payload: SafegoResponse<T> | null = null;

    try {
      payload = (await response.json()) as SafegoResponse<T>;
    } catch {
      throw new ApiError(response.status, "WEARO could not read the server response.");
    }

    if (response.ok && payload.success) {
      return {
        data: payload.data,
        authorizationHeader: response.headers.get("Authorization") || response.headers.get("authorization"),
        meta: payload.meta
      };
    }

    const fieldErrors = normalizeApiFieldErrors(payload.success ? undefined : payload.error.details);
    const message =
      (!payload.success && payload.error.message) ||
      getFirstApiFieldError(fieldErrors) ||
      `Request failed (${response.status})`;

    if (response.status === 401) {
      await tokenStorage.clear();
      notifyUnauthorized();
    }

    throw new ApiError(
      response.status,
      message,
      fieldErrors,
      payload.success ? undefined : payload.error.details,
      retryAfterSeconds(response.headers.get("Retry-After"))
    );
  }
}

function retryAfterSeconds(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = new Date(value).getTime();
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}
