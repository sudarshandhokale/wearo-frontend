import { Pressable, StyleSheet, Text, View } from "react-native";

import type { OutfitRecommendation } from "../services/RecommendationService";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { Button } from "./Button";
import { OutfitVisual } from "./OutfitVisual";
import { WeatherBadge } from "./WeatherBadge";

export function RecommendationCard({ recommendation }: { recommendation: OutfitRecommendation }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TODAY'S RECOMMENDATION</Text>
          <Text style={styles.title}>{recommendation.title}</Text>
        </View>
        <WeatherBadge {...recommendation.weather} />
      </View>

      <OutfitVisual items={recommendation.items} />

      <Text style={styles.why}>{recommendation.why}</Text>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Why this look?</Text>
        </Pressable>
        <View style={styles.primaryAction}>
          <Button onPress={() => undefined} title="Wear This" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  eyebrow: {
    ...typography.caption,
    color: colors.textMuted
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    marginTop: spacing.xxs
  },
  why: {
    ...typography.body,
    color: colors.textMuted
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  secondaryActionText: {
    ...typography.button,
    color: colors.text
  },
  primaryAction: {
    flex: 1
  }
});
