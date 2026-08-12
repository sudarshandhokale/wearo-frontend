import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme";
import { WearoResponsiveLogo } from "./WearoLogo";

export function LoadingScreen({ message = "Opening WEARO", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <WearoResponsiveLogo />
      {!onRetry ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: "center"
  },
  text: {
    ...typography.caption,
    color: colors.textMuted
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  retryText: {
    ...typography.button,
    color: colors.surface
  }
});
