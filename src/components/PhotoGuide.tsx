import { StyleSheet, Text, View } from "react-native";
import { Focus, LampDesk, Shirt } from "lucide-react-native";

import { colors, radius, spacing, typography } from "../theme";

export function PhotoGuide({ compact = false }: { compact?: boolean }) {
  return <View style={[styles.guide, compact && styles.guideCompact]}>
    <Tip icon={<Shirt color={colors.primary} size={20} />} text="Hang it up or lay it flat" />
    <Tip icon={<Focus color={colors.primary} size={20} />} text="Show the full item on a plain surface" />
    <Tip icon={<LampDesk color={colors.primary} size={20} />} text="Use even light; avoid hands and clutter" />
  </View>;
}

function Tip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <View style={styles.tip}><View style={styles.icon}>{icon}</View><Text style={styles.text}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  guide: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", width: "100%" },
  guideCompact: { gap: spacing.xs },
  tip: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flex: 1, gap: spacing.xs, minWidth: 150, padding: spacing.sm },
  icon: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 36, justifyContent: "center", width: 36 },
  text: { ...typography.caption, color: colors.textMuted, flexShrink: 1, fontWeight: "600", textAlign: "center" }
});
