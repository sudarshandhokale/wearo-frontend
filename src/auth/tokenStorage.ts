import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "wearo.authToken";

function getWebStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export const tokenStorage = {
  get() {
    if (Platform.OS === "web") {
      return Promise.resolve(getWebStorage()?.getItem(AUTH_TOKEN_KEY) ?? null);
    }

    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },
  set(token: string) {
    if (Platform.OS === "web") {
      getWebStorage()?.setItem(AUTH_TOKEN_KEY, token);
      return Promise.resolve();
    }

    return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  },
  clear() {
    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(AUTH_TOKEN_KEY);
      return Promise.resolve();
    }

    return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
};
