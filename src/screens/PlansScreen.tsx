import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays, Repeat2 } from "lucide-react-native";

import { useAuth } from "../auth/AuthContext";
import { ScreenContainer } from "../components/ScreenContainer";
import { StylingPlans } from "../components/StylingPlans";
import { StylingRoutines } from "../components/StylingRoutines";
import { useAppData } from "../context/AppDataContext";
import { colors, radius, spacing, typography } from "../theme";

type PlansSection = "plans" | "routines";

export function PlansScreen({ onSectionChange, section }: { onSectionChange: (value: PlansSection) => void; section: PlansSection }) {
  const { user } = useAuth();
  const { metadata } = useAppData();
  return <ScreenContainer resetKey={`plans-${section}`}>
    <View style={styles.header}><Text style={styles.title}>Plans</Text><Text style={styles.subtitle}>Plan trips, busy weeks, and the routines you dress for often.</Text></View>
    <View style={styles.tabs}><Tab active={section === "plans"} icon={<CalendarDays size={18} />} label="Trips & weeks" onPress={() => onSectionChange("plans")} /><Tab active={section === "routines"} icon={<Repeat2 size={18} />} label="Routines" onPress={() => onSectionChange("routines")} /></View>
    {section === "plans" ? <StylingPlans defaultCity={user?.preferred_city} roles={metadata?.outfits.roles || []} /> : <StylingRoutines metadata={metadata?.routines} roles={metadata?.outfits.roles || []} />}
  </ScreenContainer>;
}

function Tab({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.tabActive]}>{icon}<Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ header: { gap: spacing.xs, marginBottom: spacing.lg }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, tabs: { alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xl, padding: spacing.xs }, tab: { alignItems: "center", borderRadius: radius.sm, flexDirection: "row", gap: spacing.xs, minHeight: 42, paddingHorizontal: spacing.md }, tabActive: { backgroundColor: colors.surface }, tabText: { ...typography.caption, color: colors.textMuted }, tabTextActive: { color: colors.primary } });
