import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radius, typography } from "../theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#20201E"} />
      ) : (
        <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.pill,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  disabled: {
    opacity: 0.88
  },
  pressed: {
    opacity: 0.82
  },
  text: {
    ...typography.button,
    color: colors.surface
  },
  secondaryText: {
    color: colors.text
  }
});
