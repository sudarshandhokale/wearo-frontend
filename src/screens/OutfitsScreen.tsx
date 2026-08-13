import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Bookmark, Check, ChevronLeft } from "lucide-react-native";

import { AppService } from "../api/AppService";
import type { Outfit } from "../api/types";
import { Button } from "../components/Button";
import { OutfitCover } from "../components/OutfitCover";
import { OutfitDetail } from "../components/OutfitDetail";
import { ScreenContainer } from "../components/ScreenContainer";
import { StylingPlans } from "../components/StylingPlans";
import { StylingRoutines } from "../components/StylingRoutines";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { useResponsive } from "../hooks/useResponsive";
import type { Navigate } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { matchLabel } from "../utils/outfitPresentation";

export function OutfitsScreen({ initialOutfitRequest, looksOnly = false, onNavigate }: { initialOutfitRequest?: { id: number; outfitId: number | string } | null; looksOnly?: boolean; onNavigate: Navigate }) {
  const { metadata } = useAppData();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [section, setSection] = useState<"looks" | "plans" | "routines">("looks");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displayedOutfits = useMemo(() => looksOnly ? outfits.filter((outfit) => outfit.status === "saved") : outfits, [looksOnly, outfits]);
  const groups = useMemo(() => groupOutfits(displayedOutfits), [displayedOutfits]);

  const load = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true); setError(null);
    try { const response = await AppService.outfits(nextPage); setOutfits((current) => append ? [...current, ...response.data] : response.data); setPage(nextPage); setHasMore(Boolean(response.meta?.next_page)); }
    catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!initialOutfitRequest) return;
    let cancelled = false;
    setSection("looks");
    setLoading(true);
    setError(null);
    void AppService.outfit(initialOutfitRequest.outfitId)
      .then((response) => { if (!cancelled) setSelected(response.data); })
      .catch((caughtError) => { if (!cancelled) setError(messageFor(caughtError)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initialOutfitRequest]);

  async function open(outfit: Outfit) { setLoading(true); setError(null); try { const response = await AppService.outfit(outfit.id); setSelected(response.data); } catch (caughtError) { setError(messageFor(caughtError)); } finally { setLoading(false); } }
  function changed(outfit: Outfit) { setSelected(outfit); setOutfits((current) => current.map((item) => item.id === outfit.id ? outfit : item)); }

  return <ScreenContainer resetKey={selected ? `outfit-${selected.id}` : `outfits-${section}`}>
    <View style={styles.header}>{selected ? <Pressable accessibilityLabel="Back to outfits" onPress={() => setSelected(null)} style={styles.back}><ChevronLeft color={colors.text} size={22} /></Pressable> : null}<View style={styles.headerCopy}><Text style={styles.title}>{selected ? selected.name : looksOnly ? "Saved looks" : "Outfits"}</Text><Text style={styles.subtitle}>{selected?.prompt || (looksOnly ? "Outfits you saved to wear again." : "Grouped by what you asked WEARO to style.")}</Text></View></View>
    {error ? <ErrorBanner message={error} /> : null}
    {!selected && !looksOnly ? <View style={styles.tabs}><Pressable onPress={() => setSection("looks")} style={[styles.tab, section === "looks" && styles.tabActive]}><Text style={[styles.tabText, section === "looks" && styles.tabTextActive]}>Looks</Text></Pressable><Pressable onPress={() => setSection("plans")} style={[styles.tab, section === "plans" && styles.tabActive]}><Text style={[styles.tabText, section === "plans" && styles.tabTextActive]}>Plans</Text></Pressable><Pressable onPress={() => setSection("routines")} style={[styles.tab, section === "routines" && styles.tabActive]}><Text style={[styles.tabText, section === "routines" && styles.tabTextActive]}>Routines</Text></Pressable></View> : null}
    {section === "plans" && !selected ? <StylingPlans defaultCity={user?.preferred_city} roles={metadata?.outfits.roles || []} /> : section === "routines" && !selected ? <StylingRoutines metadata={metadata?.routines} roles={metadata?.outfits.roles || []} /> : selected ? <OutfitDetail initialOutfit={selected} onChange={changed} roles={metadata?.outfits.roles || []} /> : <>
      {loading && !outfits.length ? <Loading /> : null}
      {!loading && !displayedOutfits.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>{looksOnly ? "No saved looks yet" : "No outfits yet"}</Text><Text style={styles.subtitle}>{looksOnly ? "Save an outfit you love and it will stay here." : "Ask WEARO to create your first looks from your wardrobe."}</Text><Button onPress={() => onNavigate("ask")} title="Style an outfit" /></View> : null}
      <View style={styles.groups}>{groups.map((group) => <View key={group.key} style={styles.group}><View style={[styles.groupHeader, isMobile && styles.groupHeaderMobile]}><View style={[styles.groupHeading, isMobile && styles.groupHeadingMobile]}><Text style={styles.groupEyebrow}>STYLED FOR</Text><Text style={styles.groupTitle}>{sentence(group.prompt)}</Text><Text style={styles.groupMeta}>{date(group.createdAt)} · {group.outfits.length} {group.outfits.length === 1 ? "look" : "looks"}</Text></View><View style={styles.contexts}>{group.contexts.map((context) => <View key={context} style={styles.contextChip}><Text style={styles.contextText}>{context}</Text></View>)}</View></View><View style={[styles.grid, isMobile && styles.mobileList]}>{group.outfits.map((outfit) => <OutfitCard isMobile={isMobile} key={outfit.id} onPress={() => void open(outfit)} outfit={outfit} />)}</View></View>)}</View>
      {hasMore ? <Button loading={loading} onPress={() => void load(page + 1, true)} style={styles.more} title="Load more" variant="secondary" /> : null}
    </>}
  </ScreenContainer>;
}

function OutfitCard({ outfit, onPress, isMobile }: { outfit: Outfit; onPress: () => void; isMobile: boolean }) {
  const context = outfit.occasion_label || textContext(outfit.context, "occasion_label") || textContext(outfit.context, "activity_label");

  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, isMobile && styles.cardMobile, pressed && styles.pressed]}>
    <OutfitCover coverImages={outfit.cover_images} style={[styles.cardCover, isMobile && styles.cardCoverMobile]} />
    <View style={[styles.cardCopy, isMobile && styles.cardCopyMobile]}><View style={styles.cardTop}><Text numberOfLines={isMobile ? 2 : 1} style={styles.cardTitle}>{outfit.name}</Text>{outfit.status === "saved" ? <Bookmark color={colors.primary} fill={colors.primary} size={17} /> : outfit.status === "worn" ? <Check color={colors.success} size={18} /> : null}</View>{context ? <Text style={styles.cardContext}>{context}</Text> : null}<Text style={styles.meta}>{[outfit.status_label, matchLabel(outfit.recommendation_score)].filter(Boolean).join(" · ")}</Text><Text style={styles.openLabel}>View outfit</Text></View>
  </Pressable>;
}
function Loading() { return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.subtitle}>Loading outfits</Text></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View>; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function sentence(value: string) { const trimmed = value.trim(); return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}` : "Outfit recommendation"; }
function textContext(context: Record<string, unknown>, key: string) { return typeof context[key] === "string" ? context[key] as string : null; }
function groupOutfits(outfits: Outfit[]) {
  const groups = new Map<string, { key: string; prompt: string; createdAt: string; contexts: string[]; outfits: Outfit[] }>();
  outfits.forEach((outfit) => {
    const key = outfit.recommendation_request_id != null ? String(outfit.recommendation_request_id) : `${outfit.prompt}-${outfit.created_at.slice(0, 10)}`;
    const contextValues = [outfit.occasion_label, textContext(outfit.context, "occasion_label"), textContext(outfit.context, "activity_label")].filter((value): value is string => Boolean(value));
    const existing = groups.get(key);
    if (existing) { existing.outfits.push(outfit); existing.contexts = [...new Set([...existing.contexts, ...contextValues])].slice(0, 3); }
    else groups.set(key, { key, prompt: outfit.prompt, createdAt: outfit.created_at, contexts: [...new Set(contextValues)].slice(0, 3), outfits: [outfit] });
  });
  return [...groups.values()];
}
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, back: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, tabs: { alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: "row", gap: spacing.xs, marginBottom: spacing.lg, padding: spacing.xs }, tab: { borderRadius: radius.sm, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md }, tabActive: { backgroundColor: colors.surface }, tabText: { ...typography.caption, color: colors.textMuted }, tabTextActive: { color: colors.primary }, groups: { gap: spacing.xxl }, group: { gap: spacing.md }, groupHeader: { alignItems: "flex-end", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between", paddingBottom: spacing.md }, groupHeaderMobile: { alignItems: "flex-start" }, groupHeading: { flex: 1, gap: spacing.xxs, minWidth: 260 }, groupHeadingMobile: { minWidth: "100%" }, groupEyebrow: { ...typography.caption, color: colors.primary, fontSize: 10 }, groupTitle: { ...typography.heading, color: colors.text }, groupMeta: { ...typography.caption, color: colors.textMuted }, contexts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, contextChip: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, contextText: { ...typography.caption, color: colors.primary }, grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, mobileList: { flexDirection: "column", flexWrap: "nowrap", gap: spacing.md }, card: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, minWidth: 260, overflow: "hidden", width: "31%" }, cardMobile: { alignItems: "stretch", flexDirection: "row", minHeight: 142, minWidth: 0, width: "100%" }, cardCover: { aspectRatio: 1, width: "100%" }, cardCoverMobile: { alignSelf: "stretch", aspectRatio: undefined, width: 142 }, cardCopy: { gap: spacing.xs, padding: spacing.md }, cardCopyMobile: { flex: 1, justifyContent: "center", minWidth: 0 }, cardTop: { alignItems: "center", flexDirection: "row", gap: spacing.xs }, cardTitle: { ...typography.button, color: colors.text, flex: 1 }, cardContext: { ...typography.caption, color: colors.primary }, meta: { ...typography.caption, color: colors.textMuted }, openLabel: { ...typography.caption, color: colors.primary, marginTop: spacing.xs }, empty: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.xxxl }, emptyTitle: { ...typography.heading, color: colors.text }, loading: { alignItems: "center", gap: spacing.sm, padding: spacing.xxxl }, more: { alignSelf: "center", marginTop: spacing.xl, minWidth: 160 }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, marginBottom: spacing.lg, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, pressed: { opacity: 0.82 } });
