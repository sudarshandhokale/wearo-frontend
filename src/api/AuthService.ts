import type { ApiUser, AuthResponseData, LoginParams, RegisterParams } from "./types";
import { RestService } from "./RestService";

type UserEnvelope = AuthResponseData | ApiUser;

export class AuthService {
  static register(params: RegisterParams) {
    return RestService.POST<UserEnvelope>("/api/v1/auth/register", { user: params });
  }

  static login(params: LoginParams) {
    return RestService.POST<UserEnvelope>("/api/v1/auth/login", { user: params });
  }

  static refresh(token: string) {
    return RestService.POST<UserEnvelope>("/api/v1/auth/refresh", undefined, token);
  }

  static logout(token: string) {
    return RestService.DELETE<null>("/api/v1/auth/logout", token);
  }

  static me(token: string) {
    return RestService.GET<UserEnvelope>("/api/v1/me", token);
  }
}
