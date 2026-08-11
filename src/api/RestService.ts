import Constants from "expo-constants";

import { ApiError, getFirstApiFieldError, normalizeApiFieldErrors } from "./ApiError";
import type { SafegoResponse } from "./types";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "http://localhost:3000";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export type RestResult<T> = {
  data: T;
  authorizationHeader: string | null;
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

  private static async request<T>(path: string, options: RequestOptions): Promise<RestResult<T>> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
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
        authorizationHeader: response.headers.get("Authorization") || response.headers.get("authorization")
      };
    }

    const fieldErrors = normalizeApiFieldErrors(payload.success ? undefined : payload.error.details);
    const message =
      (!payload.success && payload.error.message) ||
      getFirstApiFieldError(fieldErrors) ||
      `Request failed (${response.status})`;

    throw new ApiError(
      response.status,
      message,
      fieldErrors,
      payload.success ? undefined : payload.error.details
    );
  }
}
