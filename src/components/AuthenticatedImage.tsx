import { useEffect, useState } from "react";
import { Image, type ImageProps } from "react-native";

import { resolveImageUrl } from "../api/AppService";
import { tokenStorage } from "../auth/tokenStorage";

export function AuthenticatedImage({ url, ...props }: Omit<ImageProps, "source"> & { url?: string | null }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { let active = true; void tokenStorage.get().then((value) => { if (active) setToken(value); }); return () => { active = false; }; }, []);
  const uri = resolveImageUrl(url);
  if (!uri || !token) return null;
  return <Image {...props} source={{ uri, headers: { Authorization: `Bearer ${token}` } }} />;
}
