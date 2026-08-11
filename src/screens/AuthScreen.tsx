import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../api/ApiError";
import type { LoginParams, RegisterParams } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";

type AuthMode = "login" | "signup";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const signupDefaults: RegisterParams = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  timezone: defaultTimezone,
  country_code: "US",
  preferred_city: ""
};

export function AuthScreen() {
  const { login, register, isSubmitting } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState<LoginParams>({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState<RegisterParams>(signupDefaults);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const canSubmit = useMemo(() => {
    if (isSignup) {
      return (
        signupForm.first_name.trim() &&
        signupForm.last_name.trim() &&
        signupForm.email.trim() &&
        signupForm.password.length >= 8 &&
        signupForm.password_confirmation &&
        signupForm.preferred_city.trim() &&
        signupForm.country_code.trim()
      );
    }

    return loginForm.email.trim() && loginForm.password;
  }, [isSignup, loginForm, signupForm]);

  function updateSignup<K extends keyof RegisterParams>(key: K, value: RegisterParams[K]) {
    setSignupForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);

    try {
      if (isSignup) {
        if (signupForm.password !== signupForm.password_confirmation) {
          setError("Passwords do not match.");
          return;
        }

        await register({
          ...signupForm,
          first_name: signupForm.first_name.trim(),
          last_name: signupForm.last_name.trim(),
          email: signupForm.email.trim(),
          timezone: signupForm.timezone.trim() || defaultTimezone,
          country_code: signupForm.country_code.trim().toUpperCase(),
          preferred_city: signupForm.preferred_city.trim()
        });
      } else {
        await login({
          email: loginForm.email.trim(),
          password: loginForm.password
        });
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError || caughtError instanceof Error
          ? caughtError.message
          : "WEARO could not complete the request.";
      setError(message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>WEARO</Text>
            <Text style={styles.title}>{isSignup ? "Create your styling profile" : "Welcome back"}</Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? "Start with the basics. Your wardrobe and recommendations come later."
                : "Sign in to continue building your personal style foundation."}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setMode("login");
                  setError(null);
                }}
                style={[styles.tab, !isSignup && styles.activeTab]}
              >
                <Text style={[styles.tabText, !isSignup && styles.activeTabText]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setMode("signup");
                  setError(null);
                }}
                style={[styles.tab, isSignup && styles.activeTab]}
              >
                <Text style={[styles.tabText, isSignup && styles.activeTabText]}>Signup</Text>
              </TouchableOpacity>
            </View>

            {isSignup ? (
              <View style={styles.form}>
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <FormField
                      autoCapitalize="words"
                      label="First name"
                      onChangeText={(value) => updateSignup("first_name", value)}
                      textContentType="givenName"
                      value={signupForm.first_name}
                    />
                  </View>
                  <View style={styles.nameField}>
                    <FormField
                      autoCapitalize="words"
                      label="Last name"
                      onChangeText={(value) => updateSignup("last_name", value)}
                      textContentType="familyName"
                      value={signupForm.last_name}
                    />
                  </View>
                </View>
                <FormField
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(value) => updateSignup("email", value)}
                  placeholder="you@example.com"
                  textContentType="emailAddress"
                  value={signupForm.email}
                />
                <FormField
                  label="Password"
                  onChangeText={(value) => updateSignup("password", value)}
                  secureTextEntry
                  textContentType="newPassword"
                  value={signupForm.password}
                />
                <FormField
                  label="Confirm password"
                  onChangeText={(value) => updateSignup("password_confirmation", value)}
                  secureTextEntry
                  textContentType="newPassword"
                  value={signupForm.password_confirmation}
                />
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <FormField
                      autoCapitalize="characters"
                      label="Country"
                      onChangeText={(value) => updateSignup("country_code", value)}
                      value={signupForm.country_code}
                    />
                  </View>
                  <View style={styles.nameField}>
                    <FormField
                      autoCapitalize="words"
                      label="Preferred city"
                      onChangeText={(value) => updateSignup("preferred_city", value)}
                      value={signupForm.preferred_city}
                    />
                  </View>
                </View>
                <FormField
                  label="Timezone"
                  onChangeText={(value) => updateSignup("timezone", value)}
                  value={signupForm.timezone}
                />
              </View>
            ) : (
              <View style={styles.form}>
                <FormField
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(email) => setLoginForm((current) => ({ ...current, email }))}
                  placeholder="you@example.com"
                  textContentType="emailAddress"
                  value={loginForm.email}
                />
                <FormField
                  label="Password"
                  onChangeText={(password) => setLoginForm((current) => ({ ...current, password }))}
                  secureTextEntry
                  textContentType="password"
                  value={loginForm.password}
                />
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              disabled={!canSubmit}
              loading={isSubmitting}
              onPress={submit}
              title={isSignup ? "Create account" : "Login"}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F7F2EA",
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: 26,
    justifyContent: "center",
    padding: 22
  },
  header: {
    gap: 10
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
  card: {
    backgroundColor: "#FAF8F3",
    borderColor: "#E4DACE",
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 16
  },
  tabs: {
    backgroundColor: "#EEE6DA",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4
  },
  tab: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    minHeight: 40,
    justifyContent: "center"
  },
  activeTab: {
    backgroundColor: "#FFFFFF"
  },
  tabText: {
    color: "#6B6156",
    fontSize: 14,
    fontWeight: "700"
  },
  activeTabText: {
    color: "#20201E"
  },
  form: {
    gap: 14
  },
  nameRow: {
    flexDirection: "row",
    gap: 12
  },
  nameField: {
    flex: 1
  },
  error: {
    backgroundColor: "#FCEDEA",
    borderColor: "#F2C4BA",
    borderRadius: 8,
    borderWidth: 1,
    color: "#9E3324",
    fontSize: 14,
    lineHeight: 20,
    padding: 12
  }
});
