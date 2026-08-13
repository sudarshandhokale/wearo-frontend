import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, Send, Sparkles } from "lucide-react-native";

import { ApiError } from "../api/ApiError";
import { AppService } from "../api/AppService";
import type { ContextualSuggestion, MetadataOption, Outfit, RecommendationErrorDetails, RecommendationRequest, RoutineIntentResponse, StylingPlan } from "../api/types";
import { Button } from "../components/Button";
import { OutfitCover } from "../components/OutfitCover";
import { OutfitDetail } from "../components/OutfitDetail";
import { ScreenContainer } from "../components/ScreenContainer";
import { StylingPlanDetail } from "../components/StylingPlans";
import { RoutineDraftReview } from "../components/StylingRoutines";
import { WearoMark } from "../components/WearoLogo";
import { useAppData } from "../context/AppDataContext";
import { useResponsive } from "../hooks/useResponsive";
import { copy } from "../localization/en";
import type { Navigate } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { matchLabel, optionPurpose } from "../utils/outfitPresentation";

type StylistView = "prompt" | "results" | "detail" | "plan" | "routine_drafts";

export function AskWearoScreen({ initialRequest, onNavigate }: { initialRequest: { id: number; prompt?: string; autoSend: boolean; recommendationRequestId?: number | string } | null; onNavigate: Navigate }) {
  const { metadata } = useAppData();
  const { isMobile } = useResponsive();
  const [view, setView] = useState<StylistView>("prompt");
  const [prompt, setPrompt] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationRequest | null>(null);
  const [plan, setPlan] = useState<StylingPlan | null>(null);
  const [routineIntent, setRoutineIntent] = useState<RoutineIntentResponse | null>(null);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [recommendationContext, setRecommendationContext] = useState<Record<string, unknown>>({});
  const [missingRoles, setMissingRoles] = useState<string[]>([]);
  const [showStylingDetails, setShowStylingDetails] = useState(false);
  const [recentRequests, setRecentRequests] = useState<RecommendationRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const consumedRequest = useRef<number | null>(null);
  const roles = metadata?.outfits?.roles || [];
  const statuses = metadata?.outfits?.statuses || [];

  useEffect(() => {
    if (!initialRequest || consumedRequest.current === initialRequest.id) return;
    consumedRequest.current = initialRequest.id;
    if (initialRequest.recommendationRequestId != null) {
      void loadRecentRequest(initialRequest.recommendationRequestId);
      return;
    }
    if (initialRequest.prompt) {
      setPrompt(initialRequest.prompt);
      if (initialRequest.autoSend) void submit(initialRequest.prompt);
    }
  }, [initialRequest]);

  useEffect(() => {
    let cancelled = false;
    void AppService.recommendationRequests(1, 4).then((response) => { if (!cancelled) setRecentRequests(response.data); }).catch(() => undefined).finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function submit(message = prompt) {
    const normalizedPrompt = message.trim();
    if (!normalizedPrompt) {
      setError("Describe where you are going or what you are dressing for");
      return;
    }

    setPrompt(normalizedPrompt);
    setIsLoading(true);
    setError(null);
    setMissingRoles([]);
    try {
      if (isPlanningPrompt(normalizedPrompt)) {
        const response = await AppService.createStylingPlan({ prompt: normalizedPrompt });
        setPlan(response.data);
        setView("plan");
        return;
      }

      const response = await AppService.recommendations(normalizedPrompt);
      const responseData = response.data;
      if ("routine_drafts" in responseData) {
        setRoutineIntent(responseData);
        setView("routine_drafts");
        return;
      }
      setOutfits(responseData.outfits);
      setRecommendation(responseData.recommendation);
      setRecommendationContext(responseData.context || {});
      setContextualSuggestions(responseData.suggestions || []);
      setShowStylingDetails(false);
      setRecentRequests((current) => [responseData.recommendation, ...current.filter((item) => item.id !== responseData.recommendation.id)].slice(0, 4));
      setView("results");
    } catch (caughtError) {
      setError(messageFor(caughtError));
      if (caughtError instanceof ApiError) {
        const details = caughtError.details as RecommendationErrorDetails | undefined;
        setMissingRoles(Array.isArray(details?.missing_roles) ? details.missing_roles : []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (view === "plan" && plan) {
    return <ScreenContainer><StylingPlanDetail onBack={() => { setPlan(null); setView("prompt"); }} plan={plan} roles={roles} /></ScreenContainer>;
  }

  if (view === "routine_drafts" && routineIntent) {
    return <ScreenContainer><RoutineDraftReview drafts={routineIntent.routine_drafts} message={routineIntent.message} metadata={metadata?.routines} onCancel={() => { setRoutineIntent(null); setView("prompt"); }} onSaved={() => { setRoutineIntent(null); setPrompt(""); setView("prompt"); }} /></ScreenContainer>;
  }

  async function openOutfit(outfit: Outfit) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AppService.outfit(outfit.id);
      setSelected(response.data);
      setView("detail");
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  async function openRecentRequest(request: RecommendationRequest) {
    if (request.status !== "completed") return;
    await loadRecentRequest(request.id);
  }

  async function loadRecentRequest(requestId: RecommendationRequest["id"]) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AppService.recommendationRequest(requestId);
      setPrompt(response.data.prompt);
      setRecommendation(response.data);
      setRecommendationContext(response.data.context || {});
      setContextualSuggestions([]);
      setOutfits(response.data.outfits || []);
      setShowStylingDetails(false);
      setView("results");
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  if (view === "detail" && selected) {
    return (
      <ScreenContainer>
        <View style={styles.pageHeader}>
          <BackButton onPress={() => setView("results")} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{copy.stylist.details}</Text>
            <Text style={styles.subtitle}>{selected.prompt}</Text>
          </View>
        </View>
        {error ? <ErrorBanner message={error} /> : null}
        <OutfitDetail initialOutfit={selected} onChange={(updated) => { setSelected(updated); setOutfits((current) => current.map((item) => item.id === updated.id ? updated : item)); }} roles={roles} />
        <Button onPress={() => setView("results")} style={styles.tryAgainButton} title={copy.stylist.backToResults} variant="secondary" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.pageHeader}>
        {view === "results" ? <BackButton onPress={() => setView("prompt")} /> : null}
        <View style={styles.headerCopy}>
          <Text style={[styles.title, view === "results" && styles.resultsTitle]}>{view === "results" ? `${outfits.length} outfit ${outfits.length === 1 ? "option" : "options"}` : "Style with WEARO"}</Text>
          <Text style={styles.subtitle}>{view === "results" ? "Each option takes a different approach to what you need." : "Tell me what you're dressing for, or choose what you need."}</Text>
        </View>
      </View>

      {view === "prompt" ? (
        <View style={styles.chatShell}>
          <View style={styles.conversation}>
            <View style={styles.welcomeRow}><View style={styles.welcomeIcon}><Sparkles color={colors.primary} size={20} /></View><View style={styles.welcomeCopy}><Text style={styles.assistantTitle}>What are you dressing for?</Text><Text style={styles.messageText}>Share an occasion, place, or plan. I’ll style purposeful options from your wardrobe.</Text></View></View>
            <View style={styles.contextChips}>{["Today", "Work", "Dinner", "Date", "Party", "Travel", "Outdoor"].map((context) => <Pressable key={context} onPress={() => setPrompt(context === "Today" ? "What should I wear today?" : `What should I wear for ${context.toLowerCase()}?`)} style={styles.contextChip}><Text style={styles.contextChipText}>{context}</Text></Pressable>)}</View>
            <View style={styles.quickPrompts}><Text style={styles.quickPromptsLabel}>CHOOSE WHAT YOU NEED</Text><View style={[styles.suggestions, isMobile && styles.mobileSuggestions]}>{taskPrompts.map((suggestion) => <Pressable disabled={isLoading} key={suggestion.label} onPress={() => { setPrompt(suggestion.prompt); void submit(suggestion.prompt); }} style={({ pressed }) => [styles.suggestion, isMobile && styles.mobileSuggestion, pressed && styles.pressed]}><Sparkles color={colors.primary} size={15} /><Text numberOfLines={2} style={styles.suggestionText}>{suggestion.label}</Text><ChevronRight color={colors.textSoft} size={17} /></Pressable>)}</View></View>
            {isLoading ? <><View style={styles.userMessage}><Text style={styles.userMessageText}>{prompt}</Text></View><AssistantMessage compact><View style={styles.typingRow}><ActivityIndicator color={colors.primary} size="small" /><Text style={styles.typingText}>Looking through your wardrobe and styling your options…</Text></View></AssistantMessage></> : null}
            {error ? <AssistantMessage compact><Text style={styles.errorMessageText}>{error}</Text>{missingRoles.length ? <><Text style={styles.messageText}>{copy.stylist.incompleteTitle}</Text><View style={styles.missingRoles}>{missingRoles.map((role) => <Badge key={role} label={labelFor(roles, role)} />)}</View><Button onPress={() => onNavigate("wardrobe")} title={copy.stylist.addClothing} variant="secondary" /></> : null}</AssistantMessage> : null}
          </View>
          <View style={styles.composer}>
            <TextInput accessibilityLabel="Message WEARO" editable={!isLoading} multiline onChangeText={setPrompt} onSubmitEditing={() => { if (prompt.trim() && !isLoading) void submit(); }} placeholder="Ask what to wear…" placeholderTextColor={colors.textSoft} returnKeyType="send" style={styles.composerInput} value={prompt} />
            <Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!prompt.trim() || isLoading} onPress={() => void submit()} style={({ pressed }) => [styles.sendButton, (!prompt.trim() || isLoading) && styles.sendButtonDisabled, pressed && styles.pressed]}>{isLoading ? <ActivityIndicator color={colors.surface} size="small" /> : <Send color={colors.surface} size={20} />}</Pressable>
          </View>
          <View style={styles.recentSection}><View style={styles.recentHeader}><View><Text style={styles.sectionTitle}>Recent requests</Text><Text style={styles.recentSubtitle}>Continue where you left off</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate("history")}><Text style={styles.viewAll}>View all</Text></Pressable></View>{historyLoading ? <View style={styles.recentLoading}><ActivityIndicator color={colors.primary} size="small" /><Text style={styles.recentSubtitle}>Loading history</Text></View> : recentRequests.length ? <View style={styles.recentList}>{recentRequests.map((request) => <RecentRequestRow key={request.id} onPress={() => void openRecentRequest(request)} request={request} />)}</View> : <Text style={styles.recentEmpty}>Your previous styling requests will appear here.</Text>}</View>
        </View>
      ) : (
        <>
          {error ? <ErrorBanner message={error} /> : null}
          <View style={styles.resultSummary}><View style={styles.resultSummaryIcon}><Sparkles color={colors.primary} size={19} /></View><View style={styles.resultSummaryCopy}><Text style={styles.resultEyebrow}>STYLED FOR</Text><Text numberOfLines={2} style={styles.resultPrompt}>{prompt}</Text><Text style={styles.resultSummaryText}>Picked for your style, plans, and wardrobe.</Text></View></View>
          {isLoading ? <LoadingState /> : null}
          {isMobile ? <View style={styles.mobileResults}><View style={styles.railHeader}><Text style={styles.railTitle}>Your options</Text><Text style={styles.railCount}>{outfits.length} {outfits.length === 1 ? "look" : "looks"}</Text></View><View style={styles.mobileResultsList}>{outfits.map((outfit, index) => <ResultOutfitCard index={index} key={outfit.id} mobile onPress={() => void openOutfit(outfit)} outfit={outfit} roles={roles} />)}</View></View> : <View style={styles.resultsGrid}>{outfits.map((outfit, index) => <ResultOutfitCard index={index} key={outfit.id} onPress={() => void openOutfit(outfit)} outfit={outfit} roles={roles} />)}</View>}
          <Pressable accessibilityRole="button" onPress={() => setShowStylingDetails((value) => !value)} style={styles.detailsToggle}><View><Text style={styles.detailsToggleTitle}>Styling details</Text><Text style={styles.detailsToggleSubtitle}>Context and practical notes for these looks</Text></View>{showStylingDetails ? <ChevronUp color={colors.primary} size={20} /> : <ChevronDown color={colors.primary} size={20} />}</Pressable>
          {showStylingDetails ? <View style={styles.detailsContent}>{recommendation?.ranking_source === "deterministic" ? <View style={styles.infoBanner}><Text style={styles.infoBannerText}>These recommendations were created from your wardrobe and preferences.</Text></View> : null}<ContextSummary context={recommendationContext} />{contextualSuggestions.length ? <View style={styles.contextualSuggestions}><Text style={styles.sectionTitle}>Things to consider</Text>{contextualSuggestions.map((suggestion) => <View key={suggestion.key} style={styles.contextualSuggestion}><View style={styles.suggestionCopy}>{suggestion.priority_label || suggestion.type_label ? <Text style={styles.suggestionPriority}>{[suggestion.priority_label, suggestion.type_label].filter(Boolean).join(" · ")}</Text> : null}<Text style={styles.suggestionMessage}>{suggestion.message}</Text>{suggestion.question ? <Text style={styles.suggestionQuestion}>{suggestion.question}</Text> : null}</View>{suggestion.clothing_item_id != null ? <Button onPress={() => onNavigate("wardrobe", { clothingItemId: suggestion.clothing_item_id! })} title="View item" variant="secondary" /> : suggestion.action === "add_to_wardrobe" ? <Button onPress={() => onNavigate("wardrobe")} title="Open wardrobe" variant="secondary" /> : null}</View>)}</View> : null}</View> : null}
          <Button onPress={() => setView("prompt")} style={styles.tryAgainButton} title={copy.stylist.tryAgain} variant="secondary" />
        </>
      )}
    </ScreenContainer>
  );
}

const taskPrompts = [{ label: "Pick an outfit", prompt: "What should I wear today?" }, { label: "Pack for a trip", prompt: "Help me pack outfits for my next trip" }, { label: "Plan my week", prompt: "Plan my outfits for the next week" }, { label: "Try something different", prompt: "Show me something different from my usual style" }];

function isPlanningPrompt(value: string) {
  return /\b(weekly|vacation|holiday|pack|packing|itinerary)\b/i.test(value) ||
    /\bplan\b.*\b(week|days|vacation|holiday|trip|travel|packing|itinerary)\b/i.test(value) ||
    /\b(?:outfits?|what to wear)\b.*\b(?:for|throughout)\s+(?:the\s+)?(?:next|this)\s+week\b/i.test(value) ||
    /\b(?:trip|travel)\b.*\b(?:for\s+\d+\s+days|next week|itinerary|pack)\b/i.test(value);
}

function AssistantMessage({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <View style={styles.assistantRow}><View style={styles.stylistAvatar}><WearoMark size="sm" /></View><View style={[styles.assistantMessage, compact && styles.assistantMessageCompact]}><View style={styles.stylistLabel}><Sparkles color={colors.primary} size={14} /><Text style={styles.stylistLabelText}>WEARO STYLIST</Text></View>{children}</View></View>;
}

function OutfitGallery({ outfit, roles, large = false }: { outfit: Outfit; roles: MetadataOption[]; large?: boolean }) {
  void roles;
  return <View style={[styles.gallery, large && styles.largeGallery]}><OutfitCover coverImages={outfit.cover_images} style={styles.outfitCover} /></View>;
}

function ResultOutfitCard({ index, mobile = false, onPress, outfit, roles }: { index: number; mobile?: boolean; onPress: () => void; outfit: Outfit; roles: MetadataOption[] }) {
  const context = outfit.occasion_label || contextLabel(outfit.context, "occasion") || contextLabel(outfit.context, "activity");
  return <Pressable accessibilityLabel={`View ${outfit.name}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outfitCard, mobile && styles.mobileOutfitCard, pressed && styles.pressed]}><View style={[styles.cardVisual, mobile && styles.mobileCardVisual]}><OutfitGallery outfit={outfit} roles={roles} /><View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>{matchLabel(outfit.recommendation_score)}</Text></View></View><View style={[styles.outfitCardCopy, mobile && styles.mobileOutfitCardCopy]}><Text style={styles.strategyLabel}>{optionPurpose(index)}</Text><Text numberOfLines={2} style={styles.outfitNumber}>{outfit.name}</Text>{context ? <Text style={styles.outfitContext}>{context}</Text> : null}<Text numberOfLines={mobile ? 3 : 2} style={styles.cardExplanation}>{outfit.explanation}</Text><View style={styles.cardAction}><Text style={styles.detailLink}>See outfit</Text><ChevronRight color={colors.primary} size={18} /></View></View></Pressable>;
}

function RecentRequestRow({ onPress, request }: { onPress: () => void; request: RecommendationRequest }) {
  const enabled = request.status === "completed";
  return <Pressable accessibilityLabel={`${request.prompt}, ${request.status_label || request.status}`} accessibilityRole="button" disabled={!enabled} onPress={onPress} style={({ pressed }) => [styles.recentRow, !enabled && styles.recentRowDisabled, pressed && styles.pressed]}><View style={styles.recentIcon}><Clock3 color={colors.primary} size={17} /></View><View style={styles.recentCopy}><Text numberOfLines={1} style={styles.recentPrompt}>{request.prompt}</Text><Text style={styles.recentMeta}>{relativeDate(request.created_at)} · {request.outfits?.length || 0} {request.outfits?.length === 1 ? "look" : "looks"}</Text></View><View style={[styles.recentStatus, request.status === "failed" && styles.recentStatusFailed]}><Text style={[styles.recentStatusText, request.status === "failed" && styles.recentStatusFailedText]}>{request.status_label || ""}</Text></View>{enabled ? <ChevronRight color={colors.textSoft} size={18} /> : null}</Pressable>;
}

function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Go back" onPress={onPress} style={styles.backButton}><ChevronLeft color={colors.text} size={22} /></Pressable>;
}
function Badge({ label }: { label: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{label}</Text></View>; }
function ContextSummary({ context }: { context: Record<string, unknown> }) { const entries = ["activity", "occasion", "formality"].flatMap((key) => { const value = context[`${key}_label`]; return typeof value === "string" ? [[key, value] as const] : []; }); return entries.length ? <View style={styles.contextSummary}><Text style={styles.sectionTitle}>Plan context</Text><View style={styles.contextValues}>{entries.map(([key, value]) => <Info key={key} label={key} value={value} />)}</View></View> : null; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.errorBanner}><Text style={styles.errorText}>{message}</Text></View>; }
function LoadingState() { return <View style={styles.inlineLoading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Loading outfit details</Text></View>; }
function labelFor(options: MetadataOption[], key: string | null) { return options.find((option) => option.key === key)?.label || key?.replaceAll("_", " ") || copy.common.notSet; }
function textContext(context: Record<string, unknown>, key: string) { return typeof context[key] === "string" ? context[key] as string : null; }
function contextLabel(context: Record<string, unknown>, key: string) { return typeof context[`${key}_label`] === "string" ? context[`${key}_label`] as string : null; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function relativeDate(value: string) { const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return value; const difference = Date.now() - parsed.getTime(); const days = Math.floor(difference / 86400000); if (days <= 0) return "Today"; if (days === 1) return "Yesterday"; if (days < 7) return `${days} days ago`; return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  pageHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, resultsTitle: { ...typography.heading }, subtitle: { ...typography.body, color: colors.textMuted },
  chatShell: { ...shadows.soft, alignSelf: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, maxWidth: 860, padding: spacing.xl, width: "100%" }, conversation: { gap: spacing.lg }, welcomeRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm }, welcomeIcon: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.md, height: 44, justifyContent: "center", width: 44 }, welcomeCopy: { flex: 1, gap: spacing.xs }, quickPrompts: { gap: spacing.sm }, quickPromptsLabel: { ...typography.caption, color: colors.textSoft, fontSize: 10 }, assistantRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, maxWidth: 680 }, stylistAvatar: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 48, justifyContent: "center", overflow: "hidden", width: 48 }, assistantMessage: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderTopLeftRadius: 4, flexShrink: 1, gap: spacing.sm, padding: spacing.lg }, assistantMessageCompact: { padding: spacing.md }, stylistLabel: { alignItems: "center", flexDirection: "row", gap: spacing.xxs }, stylistLabelText: { ...typography.caption, color: colors.primary, fontSize: 10 }, assistantTitle: { ...typography.subheading, color: colors.text }, messageText: { ...typography.body, color: colors.textMuted }, suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, mobileSuggestions: { flexDirection: "column", flexWrap: "nowrap" }, suggestion: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, flexDirection: "row", gap: spacing.sm, minHeight: 42, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, mobileSuggestion: { width: "100%" }, suggestionText: { ...typography.caption, color: colors.text, flex: 1 }, userMessage: { alignSelf: "flex-end", backgroundColor: colors.primary, borderRadius: radius.lg, borderBottomRightRadius: 4, maxWidth: "78%", paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, userMessageText: { ...typography.body, color: colors.surface }, typingRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, typingText: { ...typography.caption, color: colors.textMuted }, errorMessageText: { ...typography.body, color: colors.error }, composer: { alignItems: "flex-end", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.xs }, composerInput: { ...typography.body, color: colors.text, flex: 1, maxHeight: 128, minHeight: 50, outlineStyle: "none", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: "center" } as never, sendButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, height: 46, justifyContent: "center", width: 46 }, sendButtonDisabled: { opacity: 0.45 }, recentSection: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm, paddingTop: spacing.lg }, recentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, recentSubtitle: { ...typography.caption, color: colors.textMuted }, viewAll: { ...typography.caption, color: colors.primary }, recentLoading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.md }, recentList: { gap: spacing.xs }, recentRow: { alignItems: "center", borderRadius: radius.sm, flexDirection: "row", gap: spacing.sm, minHeight: 54, padding: spacing.sm }, recentRowDisabled: { opacity: 0.68 }, recentIcon: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.sm, height: 34, justifyContent: "center", width: 34 }, recentCopy: { flex: 1, gap: spacing.xxs, minWidth: 0 }, recentPrompt: { ...typography.caption, color: colors.text, fontWeight: "700" }, recentMeta: { ...typography.caption, color: colors.textMuted, fontSize: 11 }, recentStatus: { backgroundColor: "#EAF8F0", borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs }, recentStatusFailed: { backgroundColor: "#FFF0ED" }, recentStatusText: { ...typography.caption, color: colors.success, fontSize: 10 }, recentStatusFailedText: { color: colors.error }, recentEmpty: { ...typography.caption, color: colors.textMuted, paddingVertical: spacing.sm }, resultConversation: { gap: spacing.md, marginBottom: spacing.xl }, contextSummary: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.lg }, contextValues: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, contextualSuggestions: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.lg }, contextualSuggestion: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingTop: spacing.md }, suggestionCopy: { flex: 1, gap: spacing.xs, minWidth: 220 }, suggestionPriority: { ...typography.caption, color: colors.primary, fontSize: 10 }, suggestionMessage: { ...typography.body, color: colors.text }, suggestionQuestion: { ...typography.caption, color: colors.textMuted },
  loadingPanel: { alignItems: "center", backgroundColor: "#F0EEFF", borderRadius: radius.lg, flex: 0.8, gap: spacing.sm, minWidth: 260, padding: spacing.xxxl }, loadingTitle: { ...typography.heading, color: colors.text, textAlign: "center" }, loadingText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  incompletePanel: { backgroundColor: "#FFF8E8", borderColor: "#F4D999", borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.md }, missingRoles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  resultSummary: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg, padding: spacing.md }, resultSummaryIcon: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.md, height: 42, justifyContent: "center", width: 42 }, resultSummaryCopy: { flex: 1, gap: spacing.xxs }, resultEyebrow: { ...typography.caption, color: colors.primary, fontSize: 10 }, resultPrompt: { ...typography.button, color: colors.text }, resultSummaryText: { ...typography.caption, color: colors.textMuted }, resultsGrid: { alignItems: "stretch", flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, mobileResults: { gap: spacing.sm }, mobileResultsList: { gap: spacing.md }, railHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" }, railTitle: { ...typography.subheading, color: colors.text }, railCount: { ...typography.caption, color: colors.textMuted }, mobileResultsRail: { gap: spacing.md, paddingBottom: spacing.sm, paddingRight: spacing.xl }, railDots: { alignItems: "center", flexDirection: "row", gap: spacing.xs, justifyContent: "center" }, railDot: { backgroundColor: colors.border, borderRadius: radius.pill, height: 7, width: 7 }, railDotActive: { backgroundColor: colors.primary, width: 22 }, outfitCard: { ...shadows.soft, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexGrow: 1, minWidth: 260, overflow: "hidden", width: "31%" }, mobileOutfitCard: { alignItems: "stretch", flexDirection: "row", flexGrow: 0, minHeight: 150, minWidth: 0, width: "100%" }, cardVisual: { position: "relative" }, mobileCardVisual: { width: 144 }, scoreBadge: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, position: "absolute", right: spacing.sm, top: spacing.sm }, scoreBadgeText: { ...typography.caption, color: colors.primary }, outfitCardCopy: { gap: spacing.xs, padding: spacing.md }, mobileOutfitCardCopy: { flex: 1, justifyContent: "center", minWidth: 0 }, outfitNumber: { ...typography.subheading, color: colors.text }, outfitContext: { ...typography.caption, color: colors.primary }, cardExplanation: { ...typography.caption, color: colors.textMuted, minHeight: 38 }, cardAction: { alignItems: "center", flexDirection: "row", gap: spacing.xs, justifyContent: "space-between", marginTop: spacing.xs }, detailLink: { ...typography.button, color: colors.primary }, detailsToggle: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", marginTop: spacing.xl, paddingVertical: spacing.md }, detailsToggleTitle: { ...typography.subheading, color: colors.text }, detailsToggleSubtitle: { ...typography.caption, color: colors.textMuted }, detailsContent: { marginTop: spacing.lg }, tryAgainButton: { alignSelf: "center", marginTop: spacing.xl, minWidth: 220 },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, largeGallery: { flex: 1.3, minWidth: 300 }, outfitCover: { aspectRatio: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, width: "100%" }, galleryItem: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexGrow: 1, overflow: "hidden", width: "30%" }, clothingImage: { aspectRatio: 0.82, width: "100%" }, imagePlaceholder: { alignItems: "center", aspectRatio: 0.82, backgroundColor: "#EFECFF", justifyContent: "center" }, placeholderMark: { color: colors.primary, fontSize: 32, fontWeight: "800" }, itemCopy: { gap: 2, padding: spacing.sm }, role: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, itemName: { ...typography.caption, color: colors.text, fontWeight: "700" },
  detailLayout: { alignItems: "flex-start", flexDirection: "row", gap: spacing.xl }, mobileStack: { flexDirection: "column" }, detailPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 0.7, gap: spacing.lg, minWidth: 280, padding: spacing.xl }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, badge: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, badgeText: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, info: { gap: spacing.xxs }, infoLabel: { ...typography.caption, color: colors.textMuted }, infoValue: { ...typography.body, color: colors.text }, explanation: { gap: spacing.xs }, sectionTitle: { ...typography.subheading, color: colors.text }, body: { ...typography.body, color: colors.textMuted },
  backButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flexShrink: 0, height: 44, justifyContent: "center", width: 44 }, errorBanner: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, inlineLoading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.lg }, pressed: { opacity: 0.82 }, contextChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, contextChip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, contextChipText: { ...typography.caption, color: colors.textMuted }, strategyLabel: { ...typography.caption, color: colors.primary, fontSize: 10 }
  ,infoBanner: { backgroundColor: "#EEF3FF", borderRadius: radius.md, marginBottom: spacing.lg, padding: spacing.md }, infoBannerText: { ...typography.caption, color: colors.info }
});
