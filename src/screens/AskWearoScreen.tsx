import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Send, Sparkles } from "lucide-react-native";

import { ApiError } from "../api/ApiError";
import { AppService } from "../api/AppService";
import type { ContextualSuggestion, MetadataOption, Outfit, RecommendationErrorDetails, RecommendationRequest, StylingPlan } from "../api/types";
import { Button } from "../components/Button";
import { OutfitCover } from "../components/OutfitCover";
import { OutfitDetail } from "../components/OutfitDetail";
import { ScreenContainer } from "../components/ScreenContainer";
import { StylingPlanDetail } from "../components/StylingPlans";
import { WearoMark } from "../components/WearoLogo";
import { useAppData } from "../context/AppDataContext";
import { useResponsive } from "../hooks/useResponsive";
import { copy } from "../localization/en";
import type { Navigate } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";

type StylistView = "prompt" | "results" | "detail" | "plan";

export function AskWearoScreen({ initialRequest, onNavigate }: { initialRequest: { id: number; prompt: string; autoSend: boolean } | null; onNavigate: Navigate }) {
  const { metadata } = useAppData();
  const { isMobile } = useResponsive();
  const [view, setView] = useState<StylistView>("prompt");
  const [prompt, setPrompt] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationRequest | null>(null);
  const [plan, setPlan] = useState<StylingPlan | null>(null);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [recommendationContext, setRecommendationContext] = useState<Record<string, unknown>>({});
  const [missingRoles, setMissingRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const consumedRequest = useRef<number | null>(null);
  const roles = metadata?.outfits?.roles || [];
  const statuses = metadata?.outfits?.statuses || [];

  useEffect(() => {
    if (!initialRequest || consumedRequest.current === initialRequest.id) return;
    consumedRequest.current = initialRequest.id;
    setPrompt(initialRequest.prompt);
    if (initialRequest.autoSend) void submit(initialRequest.prompt);
  }, [initialRequest]);

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
      setOutfits(response.data.outfits);
      setRecommendation(response.data.recommendation);
      setRecommendationContext(response.data.context || {});
      setContextualSuggestions(response.data.suggestions || []);
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
          <Text style={styles.title}>{view === "results" ? copy.stylist.resultsTitle : copy.stylist.title}</Text>
          <Text style={styles.subtitle}>{view === "results" ? copy.stylist.resultsSubtitle : copy.stylist.subtitle}</Text>
        </View>
      </View>

      {view === "prompt" ? (
        <View style={styles.chatShell}>
          <View style={styles.conversation}>
            <AssistantMessage>
              <Text style={styles.assistantTitle}>Hi, I'm WEARO, your personal stylist.</Text>
              <Text style={styles.messageText}>Tell me what you're dressing for, where you're going, or the kind of look you want. I'll build outfits from your wardrobe.</Text>
            </AssistantMessage>
            <View style={styles.suggestions}>
              {suggestedPrompts.map((suggestion) => <Pressable disabled={isLoading} key={suggestion} onPress={() => { setPrompt(suggestion); void submit(suggestion); }} style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}><Text style={styles.suggestionText}>{suggestion}</Text></Pressable>)}
            </View>
            {isLoading ? <><View style={styles.userMessage}><Text style={styles.userMessageText}>{prompt}</Text></View><AssistantMessage compact><View style={styles.typingRow}><ActivityIndicator color={colors.primary} size="small" /><Text style={styles.typingText}>Looking through your wardrobe and styling your options…</Text></View></AssistantMessage></> : null}
            {error ? <AssistantMessage compact><Text style={styles.errorMessageText}>{error}</Text>{missingRoles.length ? <><Text style={styles.messageText}>{copy.stylist.incompleteTitle}</Text><View style={styles.missingRoles}>{missingRoles.map((role) => <Badge key={role} label={labelFor(roles, role)} />)}</View><Button onPress={() => onNavigate("wardrobe")} title={copy.stylist.addClothing} variant="secondary" /></> : null}</AssistantMessage> : null}
          </View>
          <View style={styles.composer}>
            <TextInput accessibilityLabel="Message WEARO" editable={!isLoading} multiline onChangeText={setPrompt} onSubmitEditing={() => { if (prompt.trim() && !isLoading) void submit(); }} placeholder="Ask what to wear…" placeholderTextColor={colors.textSoft} returnKeyType="send" style={styles.composerInput} value={prompt} />
            <Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!prompt.trim() || isLoading} onPress={() => void submit()} style={({ pressed }) => [styles.sendButton, (!prompt.trim() || isLoading) && styles.sendButtonDisabled, pressed && styles.pressed]}>{isLoading ? <ActivityIndicator color={colors.surface} size="small" /> : <Send color={colors.surface} size={20} />}</Pressable>
          </View>
        </View>
      ) : (
        <>
          {error ? <ErrorBanner message={error} /> : null}
          <View style={styles.resultConversation}><View style={styles.userMessage}><Text style={styles.userMessageText}>{prompt}</Text></View><AssistantMessage compact><Text style={styles.assistantTitle}>I found {outfits.length} {outfits.length === 1 ? "look" : "looks"} for you.</Text><Text style={styles.messageText}>Open any option to see why it works, save it, or tell me if you wore it.</Text></AssistantMessage></View>
          {recommendation?.ranking_source === "deterministic" ? <View style={styles.infoBanner}><Text style={styles.infoBannerText}>These recommendations were created from your wardrobe and preferences.</Text></View> : null}
          <ContextSummary context={recommendationContext} />
          {contextualSuggestions.length ? <View style={styles.contextualSuggestions}><Text style={styles.sectionTitle}>A few things to consider</Text>{contextualSuggestions.map((suggestion) => <View key={suggestion.key} style={styles.contextualSuggestion}><View style={styles.suggestionCopy}><Text style={styles.suggestionPriority}>{suggestion.priority.toUpperCase()} · {suggestion.type.toUpperCase()}</Text><Text style={styles.suggestionMessage}>{suggestion.message}</Text>{suggestion.question ? <Text style={styles.suggestionQuestion}>{suggestion.question}</Text> : null}</View>{suggestion.clothing_item_id != null ? <Button onPress={() => onNavigate("wardrobe", { clothingItemId: suggestion.clothing_item_id! })} title="View item" variant="secondary" /> : suggestion.action === "add_to_wardrobe" ? <Button onPress={() => onNavigate("wardrobe")} title="Open wardrobe" variant="secondary" /> : null}</View>)}</View> : null}
          {isLoading ? <LoadingState /> : null}
          <View style={styles.resultsGrid}>
            {outfits.map((outfit) => (
              <Pressable
                accessibilityRole="button"
                key={outfit.id}
                onPress={() => void openOutfit(outfit)}
                style={({ pressed }) => [styles.outfitCard, pressed && styles.pressed]}
              >
                <View style={styles.outfitCardHeader}>
                  <Text numberOfLines={1} style={styles.outfitNumber}>{outfit.name}</Text>
                  {outfit.recommendation_score != null ? <Text style={styles.score}>{Math.round(outfit.recommendation_score)}% match</Text> : null}
                </View>
                <OutfitGallery outfit={outfit} roles={roles} />
                <Text numberOfLines={3} style={styles.body}>{outfit.explanation}</Text>
                <Text style={styles.detailLink}>View outfit details</Text>
              </Pressable>
            ))}
          </View>
          <Button onPress={() => setView("prompt")} style={styles.tryAgainButton} title={copy.stylist.tryAgain} variant="secondary" />
        </>
      )}
    </ScreenContainer>
  );
}

const suggestedPrompts = ["Casual dinner with friends tonight", "Smart look for work tomorrow", "Pack for Paris next week: Monday museum, Tuesday dinner, Wednesday concert"];

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

function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Go back" onPress={onPress} style={styles.backButton}><Text style={styles.backSymbol}>‹</Text></Pressable>;
}
function Badge({ label }: { label: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{label}</Text></View>; }
function ContextSummary({ context }: { context: Record<string, unknown> }) { const entries = Object.entries(context).filter(([, value]) => typeof value === "string" || typeof value === "number").slice(0, 5); return entries.length ? <View style={styles.contextSummary}><Text style={styles.sectionTitle}>Plan context</Text><View style={styles.contextValues}>{entries.map(([key, value]) => <Info key={key} label={key.replaceAll("_", " ")} value={String(value)} />)}</View></View> : null; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.errorBanner}><Text style={styles.errorText}>{message}</Text></View>; }
function LoadingState() { return <View style={styles.inlineLoading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Loading outfit details</Text></View>; }
function labelFor(options: MetadataOption[], key: string | null) { return options.find((option) => option.key === key)?.label || key?.replaceAll("_", " ") || copy.common.notSet; }
function formatLocalDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  pageHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted },
  chatShell: { ...shadows.soft, alignSelf: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, maxWidth: 860, padding: spacing.xl, width: "100%" }, conversation: { gap: spacing.lg, minHeight: 350, paddingBottom: spacing.xl }, assistantRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, maxWidth: 680 }, stylistAvatar: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 48, justifyContent: "center", overflow: "hidden", width: 48 }, assistantMessage: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderTopLeftRadius: 4, flexShrink: 1, gap: spacing.sm, padding: spacing.lg }, assistantMessageCompact: { padding: spacing.md }, stylistLabel: { alignItems: "center", flexDirection: "row", gap: spacing.xxs }, stylistLabelText: { ...typography.caption, color: colors.primary, fontSize: 10 }, assistantTitle: { ...typography.subheading, color: colors.text }, messageText: { ...typography.body, color: colors.textMuted }, suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginLeft: 60 }, suggestion: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md }, suggestionText: { ...typography.caption, color: colors.primary }, userMessage: { alignSelf: "flex-end", backgroundColor: colors.primary, borderRadius: radius.lg, borderBottomRightRadius: 4, maxWidth: "78%", paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, userMessageText: { ...typography.body, color: colors.surface }, typingRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, typingText: { ...typography.caption, color: colors.textMuted }, errorMessageText: { ...typography.body, color: colors.error }, composer: { alignItems: "flex-end", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.xs }, composerInput: { ...typography.body, color: colors.text, flex: 1, maxHeight: 128, minHeight: 50, outlineStyle: "none", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: "center" } as never, sendButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, height: 46, justifyContent: "center", width: 46 }, sendButtonDisabled: { opacity: 0.45 }, resultConversation: { gap: spacing.md, marginBottom: spacing.xl }, contextSummary: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.lg }, contextValues: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, contextualSuggestions: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.lg }, contextualSuggestion: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingTop: spacing.md }, suggestionCopy: { flex: 1, gap: spacing.xs, minWidth: 220 }, suggestionPriority: { ...typography.caption, color: colors.primary, fontSize: 10 }, suggestionMessage: { ...typography.body, color: colors.text }, suggestionQuestion: { ...typography.caption, color: colors.textMuted },
  loadingPanel: { alignItems: "center", backgroundColor: "#F0EEFF", borderRadius: radius.lg, flex: 0.8, gap: spacing.sm, minWidth: 260, padding: spacing.xxxl }, loadingTitle: { ...typography.heading, color: colors.text, textAlign: "center" }, loadingText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  incompletePanel: { backgroundColor: "#FFF8E8", borderColor: "#F4D999", borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.md }, missingRoles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  resultsGrid: { alignItems: "stretch", flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, outfitCard: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, flexGrow: 1, gap: spacing.md, minWidth: 280, padding: spacing.lg, width: "31%" }, outfitCardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, outfitNumber: { ...typography.caption, color: colors.primary }, score: { ...typography.caption, color: colors.textMuted, fontWeight: "600" }, detailLink: { ...typography.button, color: colors.primary }, tryAgainButton: { alignSelf: "center", marginTop: spacing.xl, minWidth: 220 },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, largeGallery: { flex: 1.3, minWidth: 300 }, outfitCover: { aspectRatio: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, width: "100%" }, galleryItem: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexGrow: 1, overflow: "hidden", width: "30%" }, clothingImage: { aspectRatio: 0.82, width: "100%" }, imagePlaceholder: { alignItems: "center", aspectRatio: 0.82, backgroundColor: "#EFECFF", justifyContent: "center" }, placeholderMark: { color: colors.primary, fontSize: 32, fontWeight: "800" }, itemCopy: { gap: 2, padding: spacing.sm }, role: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, itemName: { ...typography.caption, color: colors.text, fontWeight: "700" },
  detailLayout: { alignItems: "flex-start", flexDirection: "row", gap: spacing.xl }, mobileStack: { flexDirection: "column" }, detailPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 0.7, gap: spacing.lg, minWidth: 280, padding: spacing.xl }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, badge: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, badgeText: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, info: { gap: spacing.xxs }, infoLabel: { ...typography.caption, color: colors.textMuted }, infoValue: { ...typography.body, color: colors.text }, explanation: { gap: spacing.xs }, sectionTitle: { ...typography.subheading, color: colors.text }, body: { ...typography.body, color: colors.textMuted },
  backButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, backSymbol: { color: colors.text, fontSize: 32, lineHeight: 34 }, errorBanner: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, inlineLoading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.lg }, pressed: { opacity: 0.82 }
  ,infoBanner: { backgroundColor: "#EEF3FF", borderRadius: radius.md, marginBottom: spacing.lg, padding: spacing.md }, infoBannerText: { ...typography.caption, color: colors.info }
});
