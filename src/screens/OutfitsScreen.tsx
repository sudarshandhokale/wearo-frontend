import { StyleSheet, Text, View } from "react-native";

import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import type { AppScreen } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

export function OutfitsScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <Text style={styles.title}>Outfits</Text>
        <Text style={styles.subtitle}>Create up to three looks from the ready pieces in your wardrobe.</Text>
        <Button onPress={() => onNavigate("ask")} style={styles.button} title="Ask WEARO" />
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
  },
  button: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    minWidth: 180
  }
});
