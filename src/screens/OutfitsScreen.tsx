import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import type { AppScreen } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

export function OutfitsScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  void onNavigate;

  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <Text style={styles.title}>Outfits</Text>
        <Text style={styles.subtitle}>Saved looks and recommendation details will build from here.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.xl
  },
  title: {
    ...typography.display,
    color: colors.text
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted
  }
});
