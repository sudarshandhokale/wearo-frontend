import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronRight, Clock3, Sparkles } from "lucide-react-native";

import { AppService } from "../api/AppService";
import type { Outfit, RecommendationRequest, RoutineOccurrence, WearHistory } from "../api/types";
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
  const [recentRequests, setRecentRequests] = useState<RecommendationRequest[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<RoutineOccurrence[]>([]);
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const readyRoutines = todayRoutines.filter((occurrence) => occurrence.status === "generated" && occurrence.outfit);
  const upcomingRoutines = todayRoutines.filter((occurrence) => occurrence.status !== "generated" || !occurrence.outfit);

  useEffect(() => {
    AIStylistService.suggestedPrompts().then(setPrompts);
    let cancelled = false;
    void AppService.recommendationRequests(1, 4).then((response) => { if (!cancelled) setRecentRequests(response.data.filter((request) => request.status === "completed")); }).catch(() => undefined);
    const loadRoutines = () => void AppService.routineOccurrencesToday().then((response) => { if (!cancelled) setTodayRoutines(response.data); }).catch(() => undefined);
    loadRoutines();
    const routinePoll = setInterval(loadRoutines, 15000);
    void AppService.wearHistory(1, 3).then(async (response) => {
      const resolved = await Promise.allSettled(response.data.map(async (wear) => ({ ...wear, outfit: wear.outfit || (await AppService.outfit(wear.outfit_id)).data })));
      if (!cancelled) setRecentWears(resolved.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
    }).catch(() => undefined);
    return () => { cancelled = true; clearInterval(routinePoll); };
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
            <View style={[styles.promptBar, promptFocused && styles.promptBarFocused]}>
              <TextInput
                accessibilityLabel="Ask WEARO what to wear"
                onBlur={() => setPromptFocused(false)}
                onChangeText={setPrompt}
                onFocus={() => setPromptFocused(true)}
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

          {recentRequests.length ? (
            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.panelTitle}>Recent styling</Text>
                  <Text style={styles.sectionSubtitle}>Revisit your latest outfit searches</Text>
                </View>
                <Pressable onPress={() => onNavigate("history")}><Text style={styles.viewAll}>View all</Text></Pressable>
              </View>
              <View style={usesSidebar ? styles.requestGrid : styles.mobileActivityList}>
                {recentRequests.slice(0, 3).map((request) => (
                  <RecentRequestCard
                    key={request.id}
                    mobile={!usesSidebar}
                    onPress={() => onNavigate("ask", { recommendationRequestId: request.id })}
                    request={request}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Pressable onPress={() => onNavigate("ask")} style={styles.emptyActivity}>
              <View style={styles.stylistMark}><Sparkles color={colors.primary} size={21} /></View>
              <View style={styles.stylistCopy}>
                <Text style={styles.loadingTitle}>Create your first outfit</Text>
                <Text style={styles.loadingText}>Tell WEARO what you're dressing for.</Text>
              </View>
              <ChevronRight color={colors.primary} size={20} />
            </Pressable>
          )}
          {readyRoutines.length ? (
            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.panelTitle}>Routine outfits ready</Text>
                  <Text style={styles.sectionSubtitle}>Prepared for today&apos;s schedule and weather</Text>
                </View>
                <Pressable onPress={() => onNavigate("outfits")}><Text style={styles.viewAll}>Manage</Text></Pressable>
              </View>
              {usesSidebar ? (
                <ScrollView contentContainerStyle={styles.requestRail} horizontal showsHorizontalScrollIndicator={false}>
                  {readyRoutines.map((occurrence) => <RoutineCard key={occurrence.id} occurrence={occurrence} onPress={() => onNavigate("outfits", { outfitId: occurrence.outfit!.id })} />)}
                </ScrollView>
              ) : (
                <View style={styles.mobileActivityList}>
                  {readyRoutines.map((occurrence) => <RoutineCard key={occurrence.id} mobile occurrence={occurrence} onPress={() => onNavigate("outfits", { outfitId: occurrence.outfit!.id })} />)}
                </View>
              )}
            </View>
          ) : null}
          {upcomingRoutines.length ? (
            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.panelTitle}>Coming up</Text>
                  <Text style={styles.sectionSubtitle}>WEARO will prepare these routine outfits automatically</Text>
                </View>
              </View>
              <View style={styles.mobileActivityList}>
                {upcomingRoutines.slice(0, usesSidebar ? 2 : 3).map((occurrence) => <RoutineCard key={occurrence.id} mobile occurrence={occurrence} onPress={() => onNavigate("outfits")} />)}
              </View>
            </View>
          ) : null}
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
                  {wear.occasion_label ? <Text numberOfLines={1} style={styles.recentOccasion}>{wear.occasion_label}</Text> : null}
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

function RecentRequestCard({ mobile = false, onPress, request }: { mobile?: boolean; onPress: () => void; request: RecommendationRequest }) {
  const coverImages = request.outfits?.flatMap((outfit) => outfit.cover_images).slice(0, 1) || [];
  return <Pressable accessibilityLabel={`Open ${request.prompt}`} onPress={onPress} style={({ pressed }) => [styles.requestCard, mobile && styles.mobileRequestCard, pressed && styles.pressed]}>{coverImages.length ? <OutfitCover coverImages={coverImages} style={[styles.requestCover, mobile && styles.mobileRequestCover]} /> : <View style={[styles.requestPlaceholder, mobile && styles.mobileRequestCover]}><Sparkles color={colors.primary} size={24} /></View>}<View style={[styles.requestCopy, mobile && styles.mobileRequestCopy]}><Text numberOfLines={2} style={styles.requestTitle}>{request.prompt}</Text><View style={styles.requestMeta}><Clock3 color={colors.textSoft} size={14} /><Text style={styles.requestMetaText}>{relativeDate(request.created_at)} · {request.outfits?.length || 0} {request.outfits?.length === 1 ? "look" : "looks"}</Text></View></View></Pressable>;
}

function RoutineCard({ mobile = false, occurrence, onPress }: { mobile?: boolean; occurrence: RoutineOccurrence; onPress: () => void }) {
  const ready = occurrence.status === "generated" && Boolean(occurrence.outfit);
  return <Pressable onPress={onPress} style={[styles.routineCard, mobile && styles.mobileRoutineCard]}><View style={styles.routineCover}>{occurrence.outfit ? <OutfitCover coverImages={occurrence.outfit.cover_images} style={styles.routineImage} /> : <Clock3 color={colors.primary} size={24} />}</View><View style={styles.routineCopy}><Text style={styles.routineEyebrow}>{ready ? "ROUTINE OUTFIT" : occurrence.status_label || humanize(occurrence.status)}</Text><Text numberOfLines={1} style={styles.loadingTitle}>{occurrence.outfit?.name || occurrence.routine?.name || "Routine"}</Text><Text numberOfLines={1} style={styles.loadingText}>{occurrence.routine?.name || "Routine"} · {routineTime(occurrence.scheduled_for)}</Text>{occurrence.failure_message ? <Text numberOfLines={2} style={styles.routineFailure}>{occurrence.failure_message}</Text> : null}</View><ChevronRight color={colors.primary} size={18} style={styles.routineArrow} /></Pressable>;
}

function routineTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(parsed);
}

function formatWornDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function relativeDate(value: string) { const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return value; const days = Math.floor((Date.now() - parsed.getTime()) / 86400000); if (days <= 0) return "Today"; if (days === 1) return "Yesterday"; if (days < 7) return `${days} days ago`; return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed); }

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
    borderColor: "transparent",
    borderRadius: radius.pill,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs
  },
  promptBarFocused: {
    borderColor: colors.primary,
    boxShadow: "0 0 0 3px rgba(108, 92, 231, 0.16)"
  } as never,
  promptInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    minHeight: 52,
    outlineStyle: "none"
  } as never,
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
  activitySection: {
    gap: spacing.md
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted
  },
  viewAll: {
    ...typography.caption,
    color: colors.primary
  },
  requestGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  mobileActivityList: {
    gap: spacing.sm
  },
  requestRail: {
    alignItems: "stretch",
    gap: spacing.md,
    paddingBottom: spacing.xs,
    paddingRight: spacing.xl
  },
  routineCard: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: "row", minWidth: 270, overflow: "hidden", width: 300 },
  mobileRoutineCard: { minWidth: 0, width: "100%" },
  routineCover: { alignItems: "center", backgroundColor: "#EFECFF", height: 94, justifyContent: "center", width: 94 },
  routineImage: { height: "100%", width: "100%" },
  routineCopy: { flex: 1, gap: spacing.xxs, justifyContent: "center", padding: spacing.sm },
  routineEyebrow: { ...typography.caption, color: colors.primary, fontSize: 9 },
  routineArrow: { alignSelf: "center", marginRight: spacing.sm },
  routineFailure: { ...typography.caption, color: colors.error, fontWeight: "500" },
  requestCard: {
    ...shadows.soft,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    overflow: "hidden"
  },
  mobileRequestCard: {
    flexDirection: "row",
    flexGrow: 0,
    minHeight: 112,
    width: "100%"
  },
  requestCover: {
    height: 150,
    width: "100%"
  },
  requestPlaceholder: {
    alignItems: "center",
    backgroundColor: "#EFECFF",
    height: 150,
    justifyContent: "center",
    width: "100%"
  },
  mobileRequestCover: {
    height: 112,
    width: 112
  },
  requestCopy: {
    gap: spacing.xs,
    padding: spacing.sm
  },
  mobileRequestCopy: {
    flex: 1,
    justifyContent: "center"
  },
  requestTitle: {
    ...typography.button,
    color: colors.text,
    minHeight: 38
  },
  requestMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  requestMetaText: {
    ...typography.caption,
    color: colors.textMuted
  },
  emptyActivity: {
    ...shadows.soft,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
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
