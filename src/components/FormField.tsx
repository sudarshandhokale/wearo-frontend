import { KeyboardTypeOptions, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  textContentType?: TextInputProps["textContentType"];
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  secureTextEntry = false,
  textContentType
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8F8679"
        secureTextEntry={secureTextEntry}
        style={styles.input}
        textContentType={textContentType}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  label: {
    ...typography.caption,
    color: colors.textMuted
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14
  }
});
