import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Bookmark, Check, ChevronLeft } from "lucide-react-native";

import { AppService, resolveImageUrl } from "../api/AppService";
import type { Outfit } from "../api/types";
import { Button } from "../components/Button";
import { AuthenticatedImage } from "../components/AuthenticatedImage";
import { OutfitDetail } from "../components/OutfitDetail";
import { ScreenContainer } from "../components/ScreenContainer";
import { StylingPlans } from "../components/StylingPlans";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../context/AppDataContext";
import type { AppScreen } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";

export function OutfitsScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { metadata } = useAppData();
  const { user } = useAuth();
  const [section, setSection] = useState<"looks" | "plans">("looks");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const groups = useMemo(() => groupOutfits(outfits), [outfits]);

  const load = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true); setError(null);
    try { const response = await AppService.outfits(nextPage); setOutfits((current) => append ? [...current, ...response.data] : response.data); setPage(nextPage); setHasMore(Boolean(response.meta?.next_page)); }
    catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function open(outfit: Outfit) { setLoading(true); setError(null); try { const response = await AppService.outfit(outfit.id); setSelected(response.data); } catch (caughtError) { setError(messageFor(caughtError)); } finally { setLoading(false); } }
  function changed(outfit: Outfit) { setSelected(outfit); setOutfits((current) => current.map((item) => item.id === outfit.id ? outfit : item)); }

  return <ScreenContainer resetKey={selected ? `outfit-${selected.id}` : `outfits-${section}`}>
    <View style={styles.header}>{selected ? <Pressable accessibilityLabel="Back to outfits" onPress={() => setSelected(null)} style={styles.back}><ChevronLeft color={colors.text} size={22} /></Pressable> : null}<View style={styles.headerCopy}><Text style={styles.title}>{selected ? selected.name : "Outfits"}</Text><Text style={styles.subtitle}>{selected?.prompt || "Grouped by what you asked WEARO to style."}</Text></View></View>
    {error ? <ErrorBanner message={error} /> : null}
    {!selected ? <View style={styles.tabs}><Pressable onPress={() => setSection("looks")} style={[styles.tab, section === "looks" && styles.tabActive]}><Text style={[styles.tabText, section === "looks" && styles.tabTextActive]}>Looks</Text></Pressable><Pressable onPress={() => setSection("plans")} style={[styles.tab, section === "plans" && styles.tabActive]}><Text style={[styles.tabText, section === "plans" && styles.tabTextActive]}>Plans</Text></Pressable></View> : null}
    {section === "plans" && !selected ? <StylingPlans defaultCity={user?.preferred_city} roles={metadata?.outfits.roles || []} /> : selected ? <OutfitDetail initialOutfit={selected} onChange={changed} roles={metadata?.outfits.roles || []} /> : <>
      {loading && !outfits.length ? <Loading /> : null}
      {!loading && !outfits.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No outfits yet</Text><Text style={styles.subtitle}>Ask WEARO to create your first looks from your wardrobe.</Text><Button onPress={() => onNavigate("ask")} title="Ask WEARO" /></View> : null}
      <View style={styles.groups}>{groups.map((group) => <View key={group.key} style={styles.group}><View style={styles.groupHeader}><View style={styles.groupHeading}><Text style={styles.groupEyebrow}>STYLED FOR</Text><Text style={styles.groupTitle}>{sentence(group.prompt)}</Text><Text style={styles.groupMeta}>{date(group.createdAt)} · {group.outfits.length} {group.outfits.length === 1 ? "look" : "looks"}</Text></View><View style={styles.contexts}>{group.contexts.map((context) => <View key={context} style={styles.contextChip}><Text style={styles.contextText}>{humanize(context)}</Text></View>)}</View></View><View style={styles.grid}>{group.outfits.map((outfit) => <OutfitCard key={outfit.id} onPress={() => void open(outfit)} outfit={outfit} />)}</View></View>)}</View>
      {hasMore ? <Button loading={loading} onPress={() => void load(page + 1, true)} style={styles.more} title="Load more" variant="secondary" /> : null}
    </>}
  </ScreenContainer>;
}

function OutfitCard({ outfit, onPress }: { outfit: Outfit; onPress: () => void }) {
  const images = outfit.items.slice(0, 3);
  const context = outfit.occasion || textContext(outfit.context, "occasion") || textContext(outfit.context, "activity");

  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    {outfit.cover_image?.url
      ? <View style={styles.visualCover}><AuthenticatedImage resizeMode="contain" url={outfit.cover_image.url} style={styles.visualCoverImage} /></View>
      : <View style={styles.images}>{images.map((item) => { const url = resolveImageUrl(item.clothing_item.cover_image?.url); return url ? <AuthenticatedImage key={item.id} url={item.clothing_item.cover_image?.url} style={styles.image} /> : <View key={item.id} style={styles.placeholder}><Text style={styles.placeholderText}>W</Text></View>; })}</View>}
    <View style={styles.cardCopy}><View style={styles.cardTop}><Text numberOfLines={1} style={styles.cardTitle}>{outfit.name}</Text>{outfit.status === "saved" ? <Bookmark color={colors.primary} fill={colors.primary} size={17} /> : outfit.status === "worn" ? <Check color={colors.success} size={18} /> : null}</View>{context ? <Text style={styles.cardContext}>{humanize(context)}</Text> : null}<Text style={styles.meta}>{[humanize(outfit.status), outfit.recommendation_score != null ? `${Math.round(outfit.recommendation_score)}% match` : null].filter(Boolean).join(" · ")}</Text></View>
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
    const contextValues = [outfit.occasion, textContext(outfit.context, "occasion"), textContext(outfit.context, "activity")].filter((value): value is string => Boolean(value));
    const existing = groups.get(key);
    if (existing) { existing.outfits.push(outfit); existing.contexts = [...new Set([...existing.contexts, ...contextValues])].slice(0, 3); }
    else groups.set(key, { key, prompt: outfit.prompt, createdAt: outfit.created_at, contexts: [...new Set(contextValues)].slice(0, 3), outfits: [outfit] });
  });
  return [...groups.values()];
}
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, back: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, tabs: { alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: "row", gap: spacing.xs, marginBottom: spacing.lg, padding: spacing.xs }, tab: { borderRadius: radius.sm, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md }, tabActive: { backgroundColor: colors.surface }, tabText: { ...typography.caption, color: colors.textMuted }, tabTextActive: { color: colors.primary }, groups: { gap: spacing.xxl }, group: { gap: spacing.md }, groupHeader: { alignItems: "flex-end", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between", paddingBottom: spacing.md }, groupHeading: { flex: 1, gap: spacing.xxs, minWidth: 260 }, groupEyebrow: { ...typography.caption, color: colors.primary, fontSize: 10 }, groupTitle: { ...typography.heading, color: colors.text }, groupMeta: { ...typography.caption, color: colors.textMuted }, contexts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, contextChip: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, contextText: { ...typography.caption, color: colors.primary }, grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, card: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, minWidth: 260, overflow: "hidden", width: "31%" }, images: { flexDirection: "row", height: 180 }, image: { flex: 1 }, visualCover: { backgroundColor: colors.surfaceMuted }, visualCoverImage: { aspectRatio: 1, width: "100%" }, placeholder: { alignItems: "center", backgroundColor: "#EFECFF", flex: 1, justifyContent: "center" }, placeholderText: { color: colors.primary, fontSize: 26, fontWeight: "800" }, cardCopy: { gap: spacing.xs, padding: spacing.md }, cardTop: { alignItems: "center", flexDirection: "row", gap: spacing.xs }, cardTitle: { ...typography.button, color: colors.text, flex: 1 }, cardContext: { ...typography.caption, color: colors.primary }, meta: { ...typography.caption, color: colors.textMuted }, empty: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.xxxl }, emptyTitle: { ...typography.heading, color: colors.text }, loading: { alignItems: "center", gap: spacing.sm, padding: spacing.xxxl }, more: { alignSelf: "center", marginTop: spacing.xl, minWidth: 160 }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, marginBottom: spacing.lg, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, pressed: { opacity: 0.82 } });
