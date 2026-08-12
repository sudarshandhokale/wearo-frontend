export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  code: number;
  fieldErrors: ApiFieldErrors;
  details: unknown;
  retryAfter: number | null;

  constructor(code: number, message: string, fieldErrors: ApiFieldErrors = {}, details?: unknown, retryAfter: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export function normalizeApiFieldErrors(error: unknown): ApiFieldErrors {
  if (!error || typeof error !== "object") {
    return {};
  }

  return Object.entries(error as Record<string, unknown>).reduce<ApiFieldErrors>(
    (fieldErrors, [field, messages]) => {
      if (field === "message" || field === "details") {
        return fieldErrors;
      }

      const normalizedMessages = Array.isArray(messages)
        ? messages.filter((message): message is string => typeof message === "string")
        : typeof messages === "string"
          ? [messages]
          : [];

      if (normalizedMessages.length) {
        fieldErrors[field] = normalizedMessages;
      }

      return fieldErrors;
    },
    {}
  );
}

export function getFirstApiFieldError(fieldErrors: ApiFieldErrors) {
  return Object.values(fieldErrors).find((messages) => messages.length)?.[0];
}
