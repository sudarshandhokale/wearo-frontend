import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, View, type ImageProps } from "react-native";

import { resolveImageUrl } from "../api/AppService";
import { tokenStorage } from "../auth/tokenStorage";
import { colors } from "../theme";

export function AuthenticatedImage({ url, ...props }: Omit<ImageProps, "source"> & { url?: string | null }) {
  const [token, setToken] = useState<string | null>(null);
  const [webUri, setWebUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const uri = resolveImageUrl(url);

  useEffect(() => { let active = true; void tokenStorage.get().then((value) => { if (active) setToken(value); }); return () => { active = false; }; }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !uri || !token) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setFailed(false);
    setWebUri(null);

    void fetch(uri, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    }).then((response) => {
      if (!response.ok) throw new Error(`Image request failed (${response.status})`);
      return response.blob();
    }).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setWebUri(objectUrl);
    }).catch((error) => {
      if (error instanceof Error && error.name !== "AbortError") setFailed(true);
    });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, uri]);

  if (!uri || !token || failed) return <View style={[props.style, styles.placeholder]} />;
  if (Platform.OS === "web") {
    return webUri
      ? <Image {...props} source={{ uri: webUri }} />
      : <View style={[props.style, styles.loading]}><ActivityIndicator color={colors.primary} /></View>;
  }
  return <Image {...props} source={{ uri, headers: { Authorization: `Bearer ${token}` } }} />;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", backgroundColor: colors.surfaceMuted, justifyContent: "center" },
  placeholder: { backgroundColor: colors.surfaceMuted }
});
