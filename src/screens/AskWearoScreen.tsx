import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import type { AppScreen } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

export function AskWearoScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  void onNavigate;

  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <Text style={styles.title}>Ask WEARO</Text>
        <Text style={styles.subtitle}>
          The future stylist conversation should render outfit cards, not only chat text.
        </Text>
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
