import type { ApiUser, AuthResponseData, ConsentInput, LoginParams, RegisterParams, RegistrationResult, UpdateUserParams } from "./types";
import { API_BASE_URL, NGROK_SKIP_BROWSER_WARNING_HEADER, RestService } from "./RestService";
import { Platform } from "react-native";
import type { PickedImage } from "./AppService";

type UserEnvelope = AuthResponseData | ApiUser;

export class AuthService {
  static register(params: RegisterParams) {
    return RestService.POST<RegistrationResult>("/api/v1/auth/register", { user: params });
  }

  static resendConfirmation(email: string) { return RestService.POST<{ message: string }>("/api/v1/auth/confirmations", { user: { email } }); }
  static verifyConfirmation(token: string) { return RestService.POST<UserEnvelope>("/api/v1/auth/confirmations/verify", { token }); }
  static forgotPassword(email: string) { return RestService.POST<{ message: string }>("/api/v1/auth/password/forgot", { user: { email } }); }
  static resetPassword(token: string, password: string, passwordConfirmation: string) { return RestService.POST<{ message: string }>("/api/v1/auth/password/reset", { token, user: { password, password_confirmation: passwordConfirmation } }); }

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

  static updateMe(params: UpdateUserParams, token: string) {
    return RestService.PATCH<UserEnvelope>("/api/v1/me", { user: params }, token);
  }

  static async updateFullBodyImage(image: PickedImage, token: string) {
    const form = new FormData();
    form.append("user[full_body_image_consent]", "true");
    if (Platform.OS === "web") { const blob = await fetch(image.uri).then((response) => response.blob()); form.append("user[full_body_image]", blob, image.name); }
    else form.append("user[full_body_image]", { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob);
    return RestService.PATCH_FORM<UserEnvelope>("/api/v1/me", form, token);
  }

  static deleteFullBodyImage(token: string) {
    return RestService.DELETE<{ message: string }>("/api/v1/me/full_body_image", token);
  }

  static updateConsents(input: ConsentInput, token: string) { return RestService.PATCH<UserEnvelope>("/api/v1/me/consents", { consents: input }, token); }
  static deleteAccount(password: string, token: string) { return RestService.DELETE_WITH_BODY<{ message: string }>("/api/v1/me", { account: { password, confirmation: "DELETE" } }, token); }
  static async exportAccount(token: string) { const response = await fetch(`${API_BASE_URL}/api/v1/me/export`, { headers: { Accept: "application/json", ...NGROK_SKIP_BROWSER_WARNING_HEADER, Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message || "Your data export could not be downloaded."); return data; }
}
