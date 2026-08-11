import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { RecommendationCard } from "../components/RecommendationCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { useResponsive } from "../hooks/useResponsive";
import type { AppScreen } from "../navigation/types";
import { AIStylistService, SuggestedPrompt } from "../services/AIStylistService";
import { OutfitRecommendation, RecommendationService } from "../services/RecommendationService";
import { colors, radius, shadows, spacing, typography } from "../theme";

type HomeScreenProps = {
  onNavigate: (screen: AppScreen) => void;
};

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { usesSidebar } = useResponsive();
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [prompts, setPrompts] = useState<SuggestedPrompt[]>([]);

  useEffect(() => {
    RecommendationService.getTodayRecommendation().then(setRecommendation);
    AIStylistService.suggestedPrompts().then(setPrompts);
  }, []);

  const firstName = user?.first_name || "there";

  return (
    <ScreenContainer>
      <View style={[styles.layout, usesSidebar && styles.desktopLayout]}>
        <View style={styles.mainColumn}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Your wardrobe. Your style. Perfected by AI.</Text>
            <Text style={styles.title}>Good morning,{"\n"}{firstName} 👋</Text>
            <View style={styles.promptBar}>
              <TextInput
                accessibilityLabel="Ask WEARO what to wear"
                onFocus={() => onNavigate("ask")}
                placeholder="What should I wear today?"
                placeholderTextColor={colors.textSoft}
                style={styles.promptInput}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate("ask")}
                style={styles.promptButton}
              >
                <Text style={styles.promptButtonText}>✦</Text>
              </Pressable>
            </View>
          </View>

          {recommendation ? (
            <RecommendationCard recommendation={recommendation} />
          ) : (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingTitle}>WEARO is styling your day</Text>
              <Text style={styles.loadingText}>Checking wardrobe, weather, and recent looks.</Text>
            </View>
          )}
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
                  onPress={() => onNavigate("ask")}
                  style={({ pressed }) => [styles.suggestedPrompt, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestedPromptText}>{prompt.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent looks</Text>
            <View style={styles.recentLookRow}>
              {["15 Aug", "13 Aug", "11 Aug"].map((date) => (
                <View key={date} style={styles.recentLook}>
                  <View style={styles.recentSwatches}>
                    <View style={[styles.miniSwatch, { backgroundColor: "#7A5330" }]} />
                    <View style={[styles.miniSwatch, { backgroundColor: "#222222" }]} />
                    <View style={[styles.miniSwatch, { backgroundColor: "#F7F7F7" }]} />
                  </View>
                  <Text style={styles.recentDate}>{date}</Text>
                </View>
              ))}
            </View>
          </View>
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
    gap: spacing.xs,
    padding: spacing.xs
  },
  recentSwatches: {
    flexDirection: "row",
    gap: 3
  },
  miniSwatch: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    height: 34
  },
  recentDate: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.75
  }
});
