import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, radius, spacing, typography } from "../theme";

export function ProfileScreen() {
  const { logout, user } = useAuth();
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "WEARO user";

  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <View style={styles.details}>
          <Detail label="Location" value={user?.preferred_city || "Not set"} />
          <Detail label="Country" value={user?.country_code || "Not set"} />
          <Detail label="Timezone" value={user?.timezone || "Not set"} />
        </View>
        <Button onPress={logout} title="Logout" variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.xl
  },
  title: {
    ...typography.display,
    color: colors.text
  },
  name: {
    ...typography.subheading,
    color: colors.text
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted
  },
  details: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted
  },
  detailValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "800"
  }
});
