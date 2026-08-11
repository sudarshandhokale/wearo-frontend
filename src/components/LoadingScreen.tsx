import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme";
import { WearoLogo } from "./WearoLogo";

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <WearoLogo />
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>Opening WEARO</Text>
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
  }
});
