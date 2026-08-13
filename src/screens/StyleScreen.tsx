import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bookmark, Clock3, Sparkles } from "lucide-react-native";

import type { Navigate } from "../navigation/types";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, spacing, typography } from "../theme";
import { AskWearoScreen } from "./AskWearoScreen";
import { HistoryScreen } from "./HistoryScreen";
import { OutfitsScreen } from "./OutfitsScreen";

type StyleSection = "stylist" | "saved" | "past";

export function StyleScreen({ askRequest, initialOutfitRequest, onNavigate, onSectionChange, section }: { askRequest: { id: number; prompt?: string; autoSend: boolean; recommendationRequestId?: number | string } | null; initialOutfitRequest: { id: number; outfitId: number | string } | null; onNavigate: Navigate; onSectionChange: (value: StyleSection) => void; section: StyleSection }) {
  const { isMobile } = useResponsive();
  return <View style={styles.page}>
    <View style={styles.nav}>
      <StyleTab active={section === "stylist"} icon={<Sparkles size={17} />} label="Style me" onPress={() => onSectionChange("stylist")} />
      <StyleTab active={section === "saved"} icon={<Bookmark size={17} />} label={isMobile ? "Saved" : "Saved looks"} onPress={() => onSectionChange("saved")} />
      <StyleTab active={section === "past"} icon={<Clock3 size={17} />} label={isMobile ? "Past" : "Past requests"} onPress={() => onSectionChange("past")} />
    </View>
    <View style={styles.content}>
      {section === "stylist" ? <AskWearoScreen initialRequest={askRequest} onNavigate={onNavigate} /> : section === "saved" ? <OutfitsScreen initialOutfitRequest={initialOutfitRequest} looksOnly onNavigate={onNavigate} /> : <HistoryScreen onNavigate={onNavigate} />}
    </View>
  </View>;
}

function StyleTab({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.tabActive]}>{icon}<Text style={[styles.label, active && styles.labelActive]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ page: { flex: 1 }, nav: { alignSelf: "center", backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: spacing.xs, maxWidth: 1180, paddingHorizontal: spacing.md, paddingTop: spacing.sm, width: "100%" }, tab: { alignItems: "center", borderRadius: radius.md, flex: 1, flexDirection: "row", gap: spacing.xs, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.sm }, tabActive: { backgroundColor: "#EFECFF" }, label: { ...typography.caption, color: colors.textMuted }, labelActive: { color: colors.primary }, content: { flex: 1 } });
