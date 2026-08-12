import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Linking, Platform } from "react-native";
import { useEffect, useState } from "react";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AppDataProvider, useAppData } from "./src/context/AppDataContext";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { AppShell } from "./src/navigation/AppShell";
import { AuthScreen } from "./src/screens/AuthScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ConsentRefreshScreen } from "./src/screens/ConsentRefreshScreen";
import { LegalScreen, type LegalPage } from "./src/screens/LegalScreen";

function AppContent() {
  const { isInitializing, user } = useAuth();
  const [authLink, setAuthLink] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage | null>(() => currentLegalPage());

  useEffect(() => {
    const handle = (url: string | null) => {
      setAuthLink(Boolean(url && /\/auth\/(confirm-email|reset-password)/.test(url)));
      setLegalPage(legalPageFromUrl(url));
    };
    void Linking.getInitialURL().then(handle);
    if (Platform.OS === "web" && typeof window !== "undefined") handle(window.location.href);
    const subscription = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => subscription.remove();
  }, []);

  if (legalPage) return <LegalScreen page={legalPage} onBack={() => {
    setLegalPage(null);
    if (Platform.OS === "web" && typeof window !== "undefined") window.history.replaceState({}, "", "/");
  }} />;

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return authLink || !user ? <AuthScreen onAuthLinkHandled={() => { setAuthLink(false); if (Platform.OS === "web" && typeof window !== "undefined") window.history.replaceState({}, "", "/"); }} /> : <AuthenticatedApp />;
}

function currentLegalPage() {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return legalPageFromUrl(window.location.href);
}

function legalPageFromUrl(url: string | null): LegalPage | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, "");
    if (pathname === "/terms") return "terms";
    if (pathname === "/privacy") return "privacy";
  } catch {
    return null;
  }
  return null;
}

function AuthenticatedApp() {
  const { error, isLoading, metadata, refresh, styleProfile } = useAppData();
  const { user } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (error || !metadata || !styleProfile) {
    return <LoadingScreen message={error || "WEARO could not load your style profile."} onRetry={refresh} />;
  }

  if (metadata.legal && needsConsentRefresh(user, metadata.legal)) return <ConsentRefreshScreen legal={metadata.legal} />;

  const onboardingDeferred = styleProfile.additional_preferences.onboarding_deferred === true;
  return styleProfile.onboarding_completed || onboardingDeferred ? <AppShell /> : <OnboardingScreen />;
}

function needsConsentRefresh(user: ReturnType<typeof useAuth>["user"], legal: NonNullable<ReturnType<typeof useAppData>["metadata"]>["legal"]) {
  const consents = user?.consents;
  return !consents?.terms?.accepted_at || consents.terms.version !== legal.terms.version || !consents?.privacy?.accepted_at || consents.privacy.version !== legal.privacy.version || (legal.ai_processing_required && !consents?.ai_processing?.accepted_at) || !consents?.adult_confirmed_at;
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
