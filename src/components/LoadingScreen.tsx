import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#20201E" />
      <Text style={styles.text}>Opening WEARO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#F7F2EA",
    flex: 1,
    gap: 12,
    justifyContent: "center"
  },
  text: {
    color: "#50483F",
    fontSize: 14,
    fontWeight: "600"
  }
});
