import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppService } from "../api/AppService";
import type { Outfit, WearHistory } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { OutfitCover } from "../components/OutfitCover";
import { ScreenContainer } from "../components/ScreenContainer";
import { useResponsive } from "../hooks/useResponsive";
import type { Navigate } from "../navigation/types";
import { AIStylistService, SuggestedPrompt } from "../services/AIStylistService";
import { colors, radius, shadows, spacing, typography } from "../theme";

type HomeScreenProps = {
  onNavigate: Navigate;
};

type RecentWear = WearHistory & { outfit: Outfit };

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { saveStyleProfile, styleProfile } = useAppData();
  const { usesSidebar } = useResponsive();
  const [prompts, setPrompts] = useState<SuggestedPrompt[]>([]);
  const [recentWears, setRecentWears] = useState<RecentWear[]>([]);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    AIStylistService.suggestedPrompts().then(setPrompts);
    let cancelled = false;
    void AppService.wearHistory(1, 3).then(async (response) => {
      const resolved = await Promise.allSettled(response.data.map(async (wear) => ({ ...wear, outfit: wear.outfit || (await AppService.outfit(wear.outfit_id)).data })));
      if (!cancelled) setRecentWears(resolved.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.first_name || "there";
  const onboardingStep = Number(styleProfile?.additional_preferences.onboarding_step) || 1;
  const onboardingProgress = Math.min(100, Math.max(20, onboardingStep * 20));

  async function resumeOnboarding() {
    if (!styleProfile) return;
    await saveStyleProfile({
      preferred_styles: styleProfile.preferred_styles,
      preferred_colors: styleProfile.preferred_colors,
      disliked_colors: styleProfile.disliked_colors,
      fit_preferences: styleProfile.fit_preferences,
      onboarding_completed: false,
      additional_preferences: {
        ...styleProfile.additional_preferences,
        onboarding_deferred: false
      }
    });
  }

  function askWearo(message?: string) {
    const context = message?.trim();
    onNavigate("ask", context ? { prompt: context, autoSend: true } : undefined);
  }

  return (
    <ScreenContainer>
      <View style={[styles.layout, usesSidebar && styles.desktopLayout]}>
        <View style={styles.mainColumn}>
          {!styleProfile?.onboarding_completed ? (
            <Pressable onPress={() => void resumeOnboarding()} style={styles.completionBanner}>
              <View style={styles.completionCopy}>
                <Text style={styles.completionTitle}>Complete your style profile</Text>
                <Text style={styles.completionText}>{onboardingProgress}% complete · Continue where you left off</Text>
              </View>
              <Text style={styles.completionArrow}>›</Text>
            </Pressable>
          ) : null}
          <View style={styles.hero}>
            <Text style={styles.kicker}>Your wardrobe. Your style. Perfected by AI.</Text>
            <Text style={styles.title}>Good morning,{"\n"}{firstName} 👋</Text>
            <View style={styles.promptBar}>
              <TextInput
                accessibilityLabel="Ask WEARO what to wear"
                onChangeText={setPrompt}
                onSubmitEditing={() => askWearo(prompt || "What should I wear today?")}
                placeholder="What should I wear today?"
                placeholderTextColor={colors.textSoft}
                returnKeyType="send"
                style={styles.promptInput}
                value={prompt}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => askWearo(prompt || "What should I wear today?")}
                style={styles.promptButton}
              >
                <Text style={styles.promptButtonText}>✦</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => onNavigate("ask")} style={styles.stylistCard}>
            <View style={styles.stylistMark}><Text style={styles.stylistMarkText}>✦</Text></View>
            <View style={styles.stylistCopy}>
              <Text style={styles.loadingTitle}>Create an outfit from your wardrobe</Text>
              <Text style={styles.loadingText}>Tell WEARO where you're going and get up to three complete looks.</Text>
            </View>
            <Text style={styles.completionArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.sideColumn}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Quick actions</Text>
            <View style={styles.quickActions}>
              <QuickAction
                description="Describe plans and get outfit ideas."
                label="Ask WEARO"
                onPress={() => onNavigate("ask")}
                symbol="✦"
              />
              <QuickAction
                description="Prepare the simple capture flow."
                label="Add Clothes"
                onPress={() => onNavigate("wardrobe")}
                symbol="+"
              />
              <QuickAction
                description="Save looks and avoid repeats."
                label="Plan an Outfit"
                onPress={() => onNavigate("outfits")}
                symbol="◇"
              />
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Suggested prompts</Text>
            <View style={styles.promptList}>
              {prompts.map((prompt) => (
                <Pressable
                  accessibilityRole="button"
                  key={prompt.id}
                  onPress={() => askWearo(prompt.text)}
                  style={({ pressed }) => [styles.suggestedPrompt, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestedPromptText}>{prompt.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {recentWears.length ? <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recently worn</Text>
            <View style={styles.recentLookRow}>
              {recentWears.map((wear) => (
                <Pressable accessibilityRole="button" key={wear.id} onPress={() => onNavigate("history")} style={({ pressed }) => [styles.recentLook, pressed && styles.pressed]}>
                  <OutfitCover coverImages={wear.outfit.cover_images} style={styles.recentImage} />
                  <Text numberOfLines={2} style={styles.recentName}>{wear.outfit.name}</Text>
                  <Text style={styles.recentDate}>{formatWornDate(wear.worn_on)}</Text>
                  {wear.occasion ? <Text numberOfLines={1} style={styles.recentOccasion}>{humanize(wear.occasion)}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

function QuickAction({
  description,
  label,
  onPress,
  symbol
}: {
  description: string;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{symbol}</Text>
      </View>
      <View style={styles.quickText}>
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function formatWornDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const styles = StyleSheet.create({
  layout: {
    gap: spacing.xl
  },
  desktopLayout: {
    alignItems: "flex-start",
    flexDirection: "row"
  },
  mainColumn: {
    flex: 1,
    gap: spacing.xl,
    minWidth: 0
  },
  sideColumn: {
    gap: spacing.lg,
    width: "100%",
    maxWidth: 360
  },
  hero: {
    gap: spacing.md
  },
  completionBanner: {
    alignItems: "center",
    backgroundColor: "#EFECFF",
    borderColor: "#D8D1FF",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  completionCopy: {
    flex: 1,
    gap: 2
  },
  completionTitle: {
    ...typography.button,
    color: colors.text
  },
  completionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "500"
  },
  completionArrow: {
    color: colors.primary,
    fontSize: 28
  },
  kicker: {
    ...typography.caption,
    color: colors.primary
  },
  title: {
    ...typography.display,
    color: colors.text
  },
  promptBar: {
    ...shadows.soft,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs
  },
  promptInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    minHeight: 52
  },
  promptButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  promptButtonText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "800"
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.xs,
    padding: spacing.xl
  },
  stylistCard: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  stylistMark: {
    alignItems: "center",
    backgroundColor: "#EFECFF",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  stylistMarkText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  stylistCopy: {
    flex: 1,
    gap: spacing.xxs
  },
  loadingTitle: {
    ...typography.subheading,
    color: colors.text
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg
  },
  panelTitle: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 17
  },
  quickActions: {
    gap: spacing.sm
  },
  quickAction: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  quickIcon: {
    alignItems: "center",
    backgroundColor: "#F0EEFF",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  quickIconText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  quickText: {
    flex: 1
  },
  quickLabel: {
    ...typography.button,
    color: colors.text
  },
  quickDescription: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "500"
  },
  promptList: {
    gap: spacing.xs
  },
  suggestedPrompt: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  suggestedPromptText: {
    ...typography.body,
    color: colors.text
  },
  recentLookRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  recentLook: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
    overflow: "hidden",
    paddingBottom: spacing.sm
  },
  recentImage: {
    aspectRatio: 1,
    width: "100%"
  },
  recentPlaceholder: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#EFECFF",
    justifyContent: "center",
    width: "100%"
  },
  recentPlaceholderText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800"
  },
  recentName: {
    ...typography.caption,
    color: colors.text,
    paddingHorizontal: spacing.xs
  },
  recentDate: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs
  },
  recentOccasion: {
    ...typography.caption,
    color: colors.primary,
    paddingHorizontal: spacing.xs
  },
  pressed: {
    opacity: 0.75
  }
});
