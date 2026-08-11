import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

export function HomeScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>WEARO</Text>
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.subtitle}>
            The auth foundation is connected. Styling features will build from here.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.name}>{fullName || "WEARO user"}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.details}>
            <Detail label="Timezone" value={user.timezone || "Not set"} />
            <Detail label="Country" value={user.country_code || "Not set"} />
            <Detail label="Preferred city" value={user.preferred_city || "Not set"} />
          </View>
        </View>

        <Button onPress={logout} title="Logout" variant="secondary" />
      </View>
    </SafeAreaView>
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
  safeArea: {
    backgroundColor: "#F7F2EA",
    flex: 1
  },
  container: {
    flex: 1,
    gap: 22,
    padding: 22
  },
  header: {
    gap: 10,
    paddingTop: 16
  },
  brand: {
    color: "#7A5330",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0
  },
  title: {
    color: "#20201E",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 40
  },
  subtitle: {
    color: "#5F574E",
    fontSize: 16,
    lineHeight: 23
  },
  profileCard: {
    backgroundColor: "#FAF8F3",
    borderColor: "#E4DACE",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18
  },
  name: {
    color: "#20201E",
    fontSize: 24,
    fontWeight: "800"
  },
  email: {
    color: "#5F574E",
    fontSize: 16
  },
  details: {
    borderTopColor: "#E4DACE",
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between"
  },
  detailLabel: {
    color: "#6B6156",
    fontSize: 14,
    fontWeight: "700"
  },
  detailValue: {
    color: "#20201E",
    flex: 1,
    fontSize: 14,
    textAlign: "right"
  }
});
