import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { colors, radius, spacing, typography } from "../theme";

export function SettingsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Preferences and web app settings will be added later.</Text>
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
