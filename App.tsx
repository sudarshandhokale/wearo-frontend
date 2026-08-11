import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { AppShell } from "./src/navigation/AppShell";
import { AuthScreen } from "./src/screens/AuthScreen";

function AppContent() {
  const { isInitializing, user } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return user ? <AppShell /> : <AuthScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
