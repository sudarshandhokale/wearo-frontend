import { useState } from "react";
import {
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View
} from "react-native";
import type { TextStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../api/ApiError";
import type { LoginParams, RegisterParams } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { WearoMobileLogo, WearoWebLogo } from "../components/WearoLogo";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, shadows, spacing, typography } from "../theme";

type AuthMode = "login" | "signup";
type AuthFieldIcon = "email" | "password" | "user";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const authBackground = require("../../assets/auth-background.png");
const webInputReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : undefined;

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
  const { isDesktop, isTablet, usesSidebar } = useResponsive();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState<LoginParams>({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState<RegisterParams>(signupDefaults);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmation, setShowSignupConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSignup = mode === "signup";

  function updateSignup<K extends keyof RegisterParams>(key: K, value: RegisterParams[K]) {
    setSignupForm((current) => ({ ...current, [key]: value }));
  }

  async function submitLogin() {
    setError(null);
    const nextFieldErrors: Record<string, string> = {};

    if (!loginForm.email.trim()) {
      nextFieldErrors.loginEmail = "Email address is required.";
    } else if (!isValidEmail(loginForm.email)) {
      nextFieldErrors.loginEmail = "Enter a valid email address.";
    }

    if (!loginForm.password) {
      nextFieldErrors.loginPassword = "Password is required.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    try {
      await login({
        email: loginForm.email.trim(),
        password: loginForm.password
      });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  async function submitSignup() {
    setError(null);
    const nextFieldErrors: Record<string, string> = {};

    if (!signupForm.first_name.trim()) {
      nextFieldErrors.firstName = "First name is required.";
    }

    if (!signupForm.last_name.trim()) {
      nextFieldErrors.lastName = "Last name is required.";
    }

    if (!signupForm.email.trim()) {
      nextFieldErrors.signupEmail = "Email address is required.";
    } else if (!isValidEmail(signupForm.email)) {
      nextFieldErrors.signupEmail = "Enter a valid email address.";
    }

    if (!signupForm.password) {
      nextFieldErrors.signupPassword = "Password is required.";
    } else if (!isValidSignupPassword(signupForm.password)) {
      nextFieldErrors.signupPassword =
        "Password must be at least 8 characters and include one uppercase letter, one number, and one symbol.";
    }

    if (!signupForm.password_confirmation) {
      nextFieldErrors.signupPasswordConfirmation = "Confirm your password.";
    } else if (signupForm.password !== signupForm.password_confirmation) {
      nextFieldErrors.signupPasswordConfirmation = "Passwords do not match.";
    }

    if (!acceptsTerms) {
      nextFieldErrors.terms = "Accept the Terms of Service and Privacy Policy to continue.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    try {
      await register({
        ...signupForm,
        first_name: titleizeName(signupForm.first_name.trim()),
        last_name: titleizeName(signupForm.last_name.trim()),
        email: signupForm.email.trim(),
        timezone: signupForm.timezone.trim() || defaultTimezone,
        country_code: signupForm.country_code.trim().toUpperCase(),
        preferred_city: signupForm.preferred_city.trim()
      });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            usesSidebar ? styles.webContent : styles.mobileContent,
            isTablet && !isDesktop && styles.tabletContent,
            isDesktop && styles.desktopContent
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.stage, usesSidebar && styles.webStage]}>
            {usesSidebar ? (
              <ImageBackground resizeMode="cover" source={authBackground} style={styles.webBackground}>
                <View style={styles.webOverlay}>
                  <View style={styles.webBody}>
                    <BrandStory />

                    <View style={[styles.forms, styles.webForms]}>
                      {!isSignup ? (
                        <AuthCard
                          error={error}
                          footer={
                            <InlineLink
                              action="Sign up"
                              label="Don't have an account?"
                              onPress={() => {
                                setMode("signup");
                                setError(null);
                                setFieldErrors({});
                              }}
                            />
                          }
                          subtitle="Sign in to continue to your personal wardrobe"
                          title="Welcome back"
                        >
                          <AuthField
                            icon="email"
                            keyboardType="email-address"
                            error={fieldErrors.loginEmail}
                            onChangeText={(email) => {
                              setLoginForm((current) => ({ ...current, email }));
                              setFieldErrors((current) => ({ ...current, loginEmail: "" }));
                            }}
                            placeholder="Email address"
                            textContentType="emailAddress"
                            value={loginForm.email}
                          />
                          <AuthField
                            icon="password"
                            error={fieldErrors.loginPassword}
                            onChangeText={(password) => {
                              setLoginForm((current) => ({ ...current, password }));
                              setFieldErrors((current) => ({ ...current, loginPassword: "" }));
                            }}
                            onToggleSecureTextEntry={() => setShowLoginPassword((current) => !current)}
                            placeholder="Password"
                            secureTextEntry={!showLoginPassword}
                            textContentType="password"
                            toggleLabel={showLoginPassword ? "Hide password" : "Show password"}
                            toggleText={showLoginPassword ? "Hide" : "Show"}
                            value={loginForm.password}
                          />
                          <View style={styles.formMetaRow}>
                            <View style={styles.rememberRow}>
                              <View style={styles.checkbox}>
                                <Text style={styles.checkboxMark}>✓</Text>
                              </View>
                              <Text style={styles.metaText}>Remember me</Text>
                            </View>
                            <Text style={styles.linkText}>Forgot password?</Text>
                          </View>
                          <Button disabled={isSubmitting} loading={isSubmitting && !isSignup} onPress={submitLogin} title="Sign In" />
                        </AuthCard>
                      ) : null}

                      {isSignup ? (
                        <AuthCard
                          error={error}
                          footer={
                            <InlineLink
                              action="Sign in"
                              label="Already have an account?"
                              onPress={() => {
                                setMode("login");
                                setError(null);
                                setFieldErrors({});
                              }}
                            />
                          }
                          subtitle="Start your style journey with WEARO"
                          title="Create your account"
                        >
                          <View style={styles.compactRow}>
                            <View style={styles.compactField}>
                              <AuthField
                                autoCapitalize="words"
                                error={fieldErrors.firstName}
                                icon="user"
                                onChangeText={(value) => {
                                  updateSignup("first_name", titleizeName(value));
                                  setFieldErrors((current) => ({ ...current, firstName: "" }));
                                }}
                                placeholder="First name"
                                textContentType="givenName"
                                value={signupForm.first_name}
                              />
                            </View>
                            <View style={styles.compactField}>
                              <AuthField
                                autoCapitalize="words"
                                error={fieldErrors.lastName}
                                icon="user"
                                onChangeText={(value) => {
                                  updateSignup("last_name", titleizeName(value));
                                  setFieldErrors((current) => ({ ...current, lastName: "" }));
                                }}
                                placeholder="Last name"
                                textContentType="familyName"
                                value={signupForm.last_name}
                              />
                            </View>
                          </View>
                          <AuthField
                            icon="email"
                            keyboardType="email-address"
                            error={fieldErrors.signupEmail}
                            onChangeText={(value) => {
                              updateSignup("email", value);
                              setFieldErrors((current) => ({ ...current, signupEmail: "" }));
                            }}
                            placeholder="Email address"
                            textContentType="emailAddress"
                            value={signupForm.email}
                          />
                          <AuthField
                            icon="password"
                            error={fieldErrors.signupPassword}
                            onChangeText={(value) => {
                              updateSignup("password", value);
                              setFieldErrors((current) => ({ ...current, signupPassword: "" }));
                            }}
                            onToggleSecureTextEntry={() => setShowSignupPassword((current) => !current)}
                            placeholder="Password"
                            secureTextEntry={!showSignupPassword}
                            textContentType="newPassword"
                            toggleLabel={showSignupPassword ? "Hide password" : "Show password"}
                            toggleText={showSignupPassword ? "Hide" : "Show"}
                            value={signupForm.password}
                          />
                          <AuthField
                            icon="password"
                            error={fieldErrors.signupPasswordConfirmation}
                            onChangeText={(value) => {
                              updateSignup("password_confirmation", value);
                              setFieldErrors((current) => ({ ...current, signupPasswordConfirmation: "" }));
                            }}
                            onToggleSecureTextEntry={() => setShowSignupConfirmation((current) => !current)}
                            placeholder="Confirm password"
                            secureTextEntry={!showSignupConfirmation}
                            textContentType="newPassword"
                            toggleLabel={showSignupConfirmation ? "Hide password" : "Show password"}
                            toggleText={showSignupConfirmation ? "Hide" : "Show"}
                            value={signupForm.password_confirmation}
                          />
                          <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: acceptsTerms }}
                            onPress={() => {
                              setAcceptsTerms((current) => !current);
                              setFieldErrors((current) => ({ ...current, terms: "" }));
                            }}
                            style={styles.termsRow}
                          >
                            <View style={[styles.checkbox, !acceptsTerms && styles.checkboxUnchecked]}>
                              {acceptsTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
                            </View>
                            <Text style={styles.metaText}>
                              I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                              <Text style={styles.linkText}>Privacy Policy</Text>
                            </Text>
                          </Pressable>
                          {fieldErrors.terms ? <Text style={styles.fieldError}>{fieldErrors.terms}</Text> : null}
                          <Button disabled={isSubmitting} loading={isSubmitting && isSignup} onPress={submitSignup} title="Create Account" />
                        </AuthCard>
                      ) : null}
                    </View>
                  </View>

                  <SecurityNote compact={false} />
                </View>
              </ImageBackground>
            ) : (
              <ImageBackground
                imageStyle={styles.mobileBackgroundImage}
                resizeMode="cover"
                source={authBackground}
                style={styles.mobileBackground}
              >
                <View style={styles.mobileOverlay}>
                <MobileBrandHeader />
                <View style={styles.forms}>
              {!isSignup ? (
                <AuthCard
                    error={error}
                    footer={
                      <InlineLink
                        action="Sign up"
                        label="Don't have an account?"
                        onPress={() => {
                          setMode("signup");
                          setError(null);
                          setFieldErrors({});
                        }}
                      />
                    }
                    subtitle="Sign in to continue to your personal wardrobe"
                    title="Welcome back"
                  >
                    <AuthField
                      icon="email"
                      keyboardType="email-address"
                      error={fieldErrors.loginEmail}
                      onChangeText={(email) => {
                        setLoginForm((current) => ({ ...current, email }));
                        setFieldErrors((current) => ({ ...current, loginEmail: "" }));
                      }}
                      placeholder="Email address"
                      textContentType="emailAddress"
                      value={loginForm.email}
                    />
                    <AuthField
                      icon="password"
                      error={fieldErrors.loginPassword}
                      onChangeText={(password) => {
                        setLoginForm((current) => ({ ...current, password }));
                        setFieldErrors((current) => ({ ...current, loginPassword: "" }));
                      }}
                      onToggleSecureTextEntry={() => setShowLoginPassword((current) => !current)}
                      placeholder="Password"
                      secureTextEntry={!showLoginPassword}
                      textContentType="password"
                      toggleLabel={showLoginPassword ? "Hide password" : "Show password"}
                      toggleText={showLoginPassword ? "Hide" : "Show"}
                      value={loginForm.password}
                    />
                    <View style={styles.formMetaRow}>
                      <View style={styles.rememberRow}>
                        <View style={styles.checkbox}>
                          <Text style={styles.checkboxMark}>✓</Text>
                        </View>
                        <Text style={styles.metaText}>Remember me</Text>
                      </View>
                      <Text style={styles.linkText}>Forgot password?</Text>
                    </View>
                  <Button disabled={isSubmitting} loading={isSubmitting && !isSignup} onPress={submitLogin} title="Sign In" />
                </AuthCard>
                ) : null}

                {isSignup ? (
                  <AuthCard
                    error={error}
                    footer={
                      <InlineLink
                        action="Sign in"
                        label="Already have an account?"
                        onPress={() => {
                          setMode("login");
                          setError(null);
                          setFieldErrors({});
                        }}
                      />
                    }
                    subtitle="Start your style journey with WEARO"
                    title="Create your account"
                  >
                    <View style={styles.compactRow}>
                      <View style={styles.compactField}>
                        <AuthField
                          autoCapitalize="words"
                          error={fieldErrors.firstName}
                          icon="user"
                          onChangeText={(value) => {
                            updateSignup("first_name", titleizeName(value));
                            setFieldErrors((current) => ({ ...current, firstName: "" }));
                          }}
                          placeholder="First name"
                          textContentType="givenName"
                          value={signupForm.first_name}
                        />
                      </View>
                      <View style={styles.compactField}>
                        <AuthField
                          autoCapitalize="words"
                          error={fieldErrors.lastName}
                          icon="user"
                          onChangeText={(value) => {
                            updateSignup("last_name", titleizeName(value));
                            setFieldErrors((current) => ({ ...current, lastName: "" }));
                          }}
                          placeholder="Last name"
                          textContentType="familyName"
                          value={signupForm.last_name}
                        />
                      </View>
                    </View>
                    <AuthField
                      icon="email"
                      keyboardType="email-address"
                      error={fieldErrors.signupEmail}
                      onChangeText={(value) => {
                        updateSignup("email", value);
                        setFieldErrors((current) => ({ ...current, signupEmail: "" }));
                      }}
                      placeholder="Email address"
                      textContentType="emailAddress"
                      value={signupForm.email}
                    />
                    <AuthField
                      icon="password"
                      error={fieldErrors.signupPassword}
                      onChangeText={(value) => {
                        updateSignup("password", value);
                        setFieldErrors((current) => ({ ...current, signupPassword: "" }));
                      }}
                      onToggleSecureTextEntry={() => setShowSignupPassword((current) => !current)}
                      placeholder="Password"
                      secureTextEntry={!showSignupPassword}
                      textContentType="newPassword"
                      toggleLabel={showSignupPassword ? "Hide password" : "Show password"}
                      toggleText={showSignupPassword ? "Hide" : "Show"}
                      value={signupForm.password}
                    />
                    <AuthField
                      icon="password"
                      error={fieldErrors.signupPasswordConfirmation}
                      onChangeText={(value) => {
                        updateSignup("password_confirmation", value);
                        setFieldErrors((current) => ({ ...current, signupPasswordConfirmation: "" }));
                      }}
                      onToggleSecureTextEntry={() => setShowSignupConfirmation((current) => !current)}
                      placeholder="Confirm password"
                      secureTextEntry={!showSignupConfirmation}
                      textContentType="newPassword"
                      toggleLabel={showSignupConfirmation ? "Hide password" : "Show password"}
                      toggleText={showSignupConfirmation ? "Hide" : "Show"}
                      value={signupForm.password_confirmation}
                    />
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: acceptsTerms }}
                      onPress={() => {
                        setAcceptsTerms((current) => !current);
                        setFieldErrors((current) => ({ ...current, terms: "" }));
                      }}
                      style={styles.termsRow}
                    >
                      <View style={[styles.checkbox, !acceptsTerms && styles.checkboxUnchecked]}>
                        {acceptsTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </View>
                      <Text style={styles.metaText}>
                        I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                        <Text style={styles.linkText}>Privacy Policy</Text>
                      </Text>
                    </Pressable>
                  {fieldErrors.terms ? <Text style={styles.fieldError}>{fieldErrors.terms}</Text> : null}
                  <Button disabled={isSubmitting} loading={isSubmitting && isSignup} onPress={submitSignup} title="Create Account" />
                </AuthCard>
              ) : null}
                </View>
                <SecurityNote compact />
                </View>
              </ImageBackground>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidSignupPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function titleizeName(value: string) {
  return value
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .split(" ")
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : ""))
    .join(" ");
}

function getErrorMessage(caughtError: unknown) {
  return caughtError instanceof ApiError || caughtError instanceof Error
    ? caughtError.message
    : "WEARO could not complete the request.";
}

function BrandStory() {
  return (
    <View style={styles.brandStory}>
      <View style={styles.brandGlow} />
      <View style={styles.brandWarmShape} />
      <View style={styles.storyContent}>
        <WearoWebLogo />
        <View style={styles.storyCopy}>
          <Text style={styles.storyTitle}>
            <Text style={styles.primaryText}>Style</Text> is personal.{"\n"}
            WEARO makes it effortless.
          </Text>
        </View>
        <View style={styles.featureList}>
          <Feature icon="✦" title="AI Personal Stylist" text="Smart recommendations based on your wardrobe, preferences and the occasion." />
          <Feature icon="♙" title="Organize Effortlessly" text="Keep all your clothes in one place and never forget what you own." />
          <Feature icon="□" title="Plan & Remember" text="Plan outfits ahead and track what you wore." />
        </View>
      </View>
    </View>
  );
}

function MobileBrandHeader() {
  return (
    <View style={styles.mobileHeader}>
      <WearoMobileLogo />
      <MobileIntro />
    </View>
  );
}

function MobileIntro() {
  return (
    <View style={styles.mobileIntro}>
      <Text style={styles.mobileIntroTitle}>
        <Text style={styles.primaryText}>Style</Text> is personal.{"\n"}
        WEARO makes it effortless.
      </Text>
      <View style={styles.mobileFeatureList}>
        <Feature icon="✦" title="AI Personal Stylist" text="Recommendations based on your wardrobe and occasion." />
        <Feature icon="♙" title="Organize Effortlessly" text="Keep your clothes in one place." />
        <Feature icon="□" title="Plan & Remember" text="Track what you wore." />
      </View>
    </View>
  );
}

function AuthCard({
  children,
  error,
  footer,
  subtitle,
  title
}: {
  children: React.ReactNode;
  error: string | null;
  footer: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.form}>{children}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {footer}
    </View>
  );
}

function AuthField({
  error,
  icon,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  secureTextEntry = false,
  textContentType,
  toggleLabel,
  toggleText,
  onToggleSecureTextEntry
}: {
  error?: string;
  icon: AuthFieldIcon;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  textContentType?: TextInputProps["textContentType"];
  toggleLabel?: string;
  toggleText?: string;
  onToggleSecureTextEntry?: () => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={[styles.field, error ? styles.fieldInvalid : null]}>
        <AuthFieldIconView icon={icon} />
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSoft}
          secureTextEntry={secureTextEntry}
          style={[styles.input, webInputReset]}
          textContentType={textContentType}
          value={value}
        />
        {onToggleSecureTextEntry ? (
          <Pressable accessibilityLabel={toggleLabel} accessibilityRole="button" onPress={onToggleSecureTextEntry}>
            <Text style={styles.trailingIcon}>{toggleText}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function AuthFieldIconView({ icon }: { icon: AuthFieldIcon }) {
  if (icon === "email") {
    return (
      <View style={styles.drawnIconBox}>
        <View style={styles.emailBody}>
          <View style={styles.emailFlapLeft} />
          <View style={styles.emailFlapRight} />
        </View>
      </View>
    );
  }

  if (icon === "user") {
    return (
      <View style={styles.drawnIconBox}>
        <View style={styles.userHead} />
        <View style={styles.userShoulders} />
      </View>
    );
  }

  return (
    <View style={styles.drawnIconBox}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

function InlineLink({
  action,
  label,
  onPress
}: {
  action: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineLink}>
      <Text style={styles.metaText}>
        {label} <Text style={styles.linkText}>{action}</Text>
      </Text>
    </Pressable>
  );
}

function Feature({ icon, text, title }: { icon: string; text: string; title: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function SecurityNote({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.securityNote, !compact && styles.desktopSecurityNote]}>
      <View style={styles.securityIcon}>
        <Text style={styles.securityIconText}>✓</Text>
      </View>
      <View style={styles.securityCopy}>
        <Text style={styles.securityTitle}>{compact ? "Your data is safe with us" : "Your data is safe with us"}</Text>
        <Text style={styles.securityText}>We keep your data and style preferences private and secure.</Text>
      </View>
      {!compact ? <Text style={styles.copyright}>© 2026 WEARO. All rights reserved.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    flexGrow: 1
  },
  mobileContent: {
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl
  },
  webContent: {
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl
  },
  tabletContent: {
    paddingHorizontal: spacing.xl
  },
  desktopContent: {
    minHeight: "100%"
  },
  stage: {
    alignSelf: "center",
    gap: spacing.lg,
    width: "100%",
    maxWidth: 430
  },
  mobileBackground: {
    borderRadius: radius.xl,
    overflow: "hidden",
    width: "100%"
  },
  mobileBackgroundImage: {
    opacity: 0.78
  },
  mobileOverlay: {
    backgroundColor: "rgba(248, 247, 252, 0.78)",
    gap: spacing.lg,
    padding: spacing.md
  },
  webStage: {
    ...shadows.card,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    flexDirection: "column",
    maxWidth: 1180,
    minHeight: 620,
    overflow: "hidden"
  },
  webBackground: {
    flex: 1,
    minHeight: 620,
    width: "100%"
  },
  webOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    flex: 1
  },
  webBody: {
    flex: 1,
    flexDirection: "row"
  },
  brandStory: {
    flex: 1,
    minWidth: 360,
    overflow: "hidden",
    position: "relative"
  },
  storyContent: {
    gap: spacing.xxl,
    maxWidth: 390,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl,
    position: "relative",
    zIndex: 1
  },
  storyCopy: {
    gap: spacing.lg
  },
  storyTitle: {
    ...typography.display,
    color: "#12142D",
    fontSize: 34,
    lineHeight: 42
  },
  primaryText: {
    color: colors.primary
  },
  storyBody: {
    ...typography.body,
    color: "#303047"
  },
  featureList: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 340,
    padding: spacing.md
  },
  feature: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "#F1EFFF",
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  featureIconText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  featureCopy: {
    flex: 1
  },
  featureTitle: {
    ...typography.button,
    color: "#12142D"
  },
  featureText: {
    ...typography.caption,
    color: "#333044",
    fontWeight: "500"
  },
  mobileHeader: {
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.sm
  },
  mobileIntro: {
    alignSelf: "stretch",
    gap: spacing.md
  },
  mobileIntroTitle: {
    ...typography.heading,
    color: "#12142D",
    textAlign: "center"
  },
  mobileFeatureList: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: "#ECE7F3",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  forms: {
    gap: spacing.md
  },
  webForms: {
    alignItems: "center",
    flex: 1.55,
    gap: spacing.lg,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl
  },
  card: {
    ...shadows.card,
    backgroundColor: "#FFFFFF",
    borderColor: "#ECE7F3",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 380
  },
  cardHeader: {
    gap: spacing.sm
  },
  cardTitle: {
    ...typography.heading,
    color: "#12142D"
  },
  cardSubtitle: {
    ...typography.body,
    color: "#303047"
  },
  tabs: {
    backgroundColor: "#F0EEFF",
    borderRadius: radius.pill,
    flexDirection: "row",
    padding: 4
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  activeTab: {
    backgroundColor: colors.surface
  },
  tabText: {
    ...typography.button,
    color: colors.textMuted
  },
  activeTabText: {
    color: colors.primary
  },
  form: {
    gap: spacing.md
  },
  fieldGroup: {
    gap: spacing.xs
  },
  field: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md
  },
  fieldInvalid: {
    borderColor: colors.error
  },
  drawnIconBox: {
    alignItems: "center",
    height: 22,
    justifyContent: "center",
    width: 22
  },
  emailBody: {
    borderColor: colors.textSoft,
    borderRadius: 2,
    borderWidth: 1.7,
    height: 12,
    overflow: "hidden",
    position: "relative",
    width: 16
  },
  emailFlapLeft: {
    backgroundColor: colors.textSoft,
    height: 1.6,
    left: 1,
    position: "absolute",
    top: 4,
    transform: [{ rotate: "32deg" }],
    width: 9
  },
  emailFlapRight: {
    backgroundColor: colors.textSoft,
    height: 1.6,
    position: "absolute",
    right: 1,
    top: 4,
    transform: [{ rotate: "-32deg" }],
    width: 9
  },
  lockShackle: {
    borderColor: colors.textSoft,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.7,
    borderBottomWidth: 0,
    height: 9,
    marginBottom: -2,
    width: 11
  },
  lockBody: {
    borderColor: colors.textSoft,
    borderRadius: 3,
    borderWidth: 1.7,
    height: 12,
    width: 15
  },
  userHead: {
    borderColor: colors.textSoft,
    borderRadius: radius.pill,
    borderWidth: 1.7,
    height: 7,
    width: 7
  },
  userShoulders: {
    borderColor: colors.textSoft,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.7,
    borderBottomWidth: 0,
    height: 8,
    marginTop: 2,
    width: 15
  },
  input: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    minHeight: 50
  },
  trailingIcon: {
    color: colors.textSoft,
    fontSize: 18
  },
  formMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  rememberRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 16,
    justifyContent: "center",
    width: 16
  },
  checkboxUnchecked: {
    backgroundColor: colors.surface,
    borderColor: colors.textSoft,
    borderWidth: 1
  },
  checkboxMark: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500"
  },
  linkText: {
    color: colors.primary,
    fontWeight: "800"
  },
  inlineLink: {
    alignItems: "center"
  },
  compactRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  compactField: {
    flex: 1
  },
  termsRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xs
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  error: {
    backgroundColor: "#FCEDEA",
    borderColor: "#F2C4BA",
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.sm
  },
  securityNote: {
    alignItems: "center",
    backgroundColor: "#F1EFFF",
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: spacing.md,
    maxWidth: 380,
    padding: spacing.lg,
    width: "100%"
  },
  desktopSecurityNote: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#F8F5FF",
    borderRadius: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: "100%",
    paddingHorizontal: spacing.xxxl
  },
  securityIcon: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 50,
    justifyContent: "center",
    width: 50
  },
  securityIconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900"
  },
  securityCopy: {
    flex: 1
  },
  securityTitle: {
    ...typography.button,
    color: "#12142D"
  },
  securityText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "500"
  },
  copyright: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.lg
  },
  brandGlow: {
    backgroundColor: "#F2EFFF",
    borderRadius: 220,
    height: 440,
    left: -150,
    opacity: 0.9,
    position: "absolute",
    top: -120,
    width: 440
  },
  brandWarmShape: {
    backgroundColor: "#F5F1EA",
    borderRadius: 180,
    bottom: -96,
    height: 300,
    left: -92,
    position: "absolute",
    width: 300
  },
});
