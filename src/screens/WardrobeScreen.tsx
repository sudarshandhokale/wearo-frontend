import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import type { AppScreen } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

export function WardrobeScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  void onNavigate;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.subtitle}>Wardrobe grids, filters, and add-clothes flow come next.</Text>
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Your pieces will live here</Text>
        <Text style={styles.emptyText}>
          Tops, bottoms, shoes, and outerwear will be organized into responsive cards.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xl
  },
  title: {
    ...typography.display,
    color: colors.text
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.xs,
    padding: spacing.xl
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.text
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted
  }
});
