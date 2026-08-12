import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import type { CoverImage } from "../api/types";
import { colors } from "../theme";
import { AuthenticatedImage } from "./AuthenticatedImage";

export function OutfitCover({ coverImages, style }: { coverImages?: CoverImage[] | null; style?: StyleProp<ViewStyle> }) {
  const images = coverImages ?? [];

  if (!images.length) {
    return <View style={[styles.frame, styles.placeholder, style]}><Text style={styles.placeholderText}>W</Text></View>;
  }

  if (images.length === 1) {
    const image = images[0]!;
    return <View style={[styles.frame, style]}><AuthenticatedImage resizeMode={image.generated ? "contain" : "cover"} url={image.url} style={styles.image} /></View>;
  }

  return <View style={[styles.frame, styles.collage, style]}>{images.map((image, index) => <AuthenticatedImage key={`${image.signed_id}-${index}`} resizeMode="cover" url={image.url} style={styles.collageImage} />)}</View>;
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  image: { height: "100%", width: "100%" },
  collage: { flexDirection: "row" },
  collageImage: { flex: 1, height: "100%", minWidth: 0 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.primary, fontSize: 28, fontWeight: "900" }
});
