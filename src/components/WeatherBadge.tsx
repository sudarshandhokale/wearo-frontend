import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function WeatherBadge({
  city,
  condition,
  temperature
}: {
  city: string;
  condition: string;
  temperature: string;
}) {
  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>☀</Text>
      <View>
        <Text style={styles.temperature}>{temperature}</Text>
        <Text style={styles.city}>{city}</Text>
      </View>
      <Text style={styles.condition}>{condition}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF8E9",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  icon: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: "800"
  },
  temperature: {
    ...typography.button,
    color: colors.text
  },
  city: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600"
  },
  condition: {
    ...typography.caption,
    color: colors.warning
  }
});
