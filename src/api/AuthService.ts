import type { ApiUser, AuthResponseData, LoginParams, RegisterParams, UpdateUserParams } from "./types";
import { RestService } from "./RestService";
import { Platform } from "react-native";
import type { PickedImage } from "./AppService";

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

  static updateMe(params: UpdateUserParams, token: string) {
    return RestService.PATCH<UserEnvelope>("/api/v1/me", { user: params }, token);
  }

  static async updateFullBodyImage(image: PickedImage, token: string) {
    const form = new FormData();
    if (Platform.OS === "web") { const blob = await fetch(image.uri).then((response) => response.blob()); form.append("user[full_body_image]", blob, image.name); }
    else form.append("user[full_body_image]", { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob);
    return RestService.PATCH_FORM<UserEnvelope>("/api/v1/me", form, token);
  }

  static deleteFullBodyImage(token: string) {
    return RestService.DELETE<{ message: string }>("/api/v1/me/full_body_image", token);
  }
}
