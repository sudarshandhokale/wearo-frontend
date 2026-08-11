export type SafegoSuccess<T> = {
  success: true;
  data: T;
  meta: unknown | null;
};

export type SafegoFailure = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

export type SafegoResponse<T> = SafegoSuccess<T> | SafegoFailure;

export type ApiUser = {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  timezone?: string | null;
  country_code?: string | null;
  preferred_city?: string | null;
};

export type AuthResponseData = {
  user: ApiUser;
};

export type RegisterParams = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  timezone: string;
  country_code: string;
  preferred_city: string;
};

export type LoginParams = {
  email: string;
  password: string;
};
