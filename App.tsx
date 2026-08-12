import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AppDataProvider, useAppData } from "./src/context/AppDataContext";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { AppShell } from "./src/navigation/AppShell";
import { AuthScreen } from "./src/screens/AuthScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";

function AppContent() {
  const { isInitializing, user } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return user ? <AuthenticatedApp /> : <AuthScreen />;
}

function AuthenticatedApp() {
  const { error, isLoading, metadata, refresh, styleProfile } = useAppData();

  if (isLoading) return <LoadingScreen />;
  if (error || !metadata || !styleProfile) {
    return <LoadingScreen message={error || "WEARO could not load your style profile."} onRetry={refresh} />;
  }

  const onboardingDeferred = styleProfile.additional_preferences.onboarding_deferred === true;
  return styleProfile.onboarding_completed || onboardingDeferred ? <AppShell /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
