import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { AppService } from "../api/AppService";
import type { Outfit, RecommendationRequest, WearHistory } from "../api/types";
import { Button } from "../components/Button";
import { OutfitDetail } from "../components/OutfitDetail";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppData } from "../context/AppDataContext";
import type { AppScreen } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

export function HistoryScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { metadata } = useAppData();
  const [requests, setRequests] = useState<RecommendationRequest[]>([]);
  const [wears, setWears] = useState<WearHistory[]>([]);
  const [tab, setTab] = useState<"recommendations" | "wears">("recommendations");
  const [selected, setSelected] = useState<RecommendationRequest | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (nextPage = 1, append = false) => { setLoading(true); setError(null); try { const response = await AppService.recommendationRequests(nextPage); setRequests((current) => append ? [...current, ...response.data] : response.data); setPage(nextPage); setHasMore(Boolean(response.meta?.next_page)); } catch (caughtError) { setError(messageFor(caughtError)); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); void AppService.wearHistory().then((response) => setWears(response.data)).catch((caughtError) => setError(messageFor(caughtError))); }, [load]);
  async function open(request: RecommendationRequest) { setLoading(true); setError(null); try { const response = await AppService.recommendationRequest(request.id); setSelected(response.data); } catch (caughtError) { setError(messageFor(caughtError)); } finally { setLoading(false); } }

  return <ScreenContainer>
    <View style={styles.header}>{selected || selectedOutfit ? <Pressable accessibilityLabel="Back to history" onPress={() => { setSelected(null); setSelectedOutfit(null); }} style={styles.back}><ChevronLeft color={colors.text} size={22} /></Pressable> : null}<View style={styles.headerCopy}><Text style={styles.title}>{selected ? "Recommendation details" : selectedOutfit ? selectedOutfit.name : "History"}</Text><Text style={styles.subtitle}>{selected ? date(selected.created_at) : selectedOutfit ? selectedOutfit.prompt : "Recommendations you requested and outfits you wore."}</Text></View></View>
    {error ? <ErrorBanner message={error} /> : null}
    {selectedOutfit ? <OutfitDetail initialOutfit={selectedOutfit} roles={metadata?.outfits.roles || []} /> : selected ? <RequestDetail request={selected} roles={metadata?.outfits.roles || []} /> : <>
      <View style={styles.tabs}><Pressable onPress={() => setTab("recommendations")} style={[styles.tab, tab === "recommendations" && styles.tabActive]}><Text style={[styles.tabText, tab === "recommendations" && styles.tabTextActive]}>Recommendations</Text></Pressable><Pressable onPress={() => setTab("wears")} style={[styles.tab, tab === "wears" && styles.tabActive]}><Text style={[styles.tabText, tab === "wears" && styles.tabTextActive]}>Wear history</Text></Pressable></View>
      {tab === "wears" ? <WearList wears={wears} onOpen={async (wear) => { setLoading(true); setError(null); try { const response = await AppService.outfit(wear.outfit_id); setSelectedOutfit(response.data); } catch (caughtError) { setError(messageFor(caughtError)); } finally { setLoading(false); } }} /> : <>
      {loading && !requests.length ? <Loading /> : null}
      {!loading && !requests.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No recommendations yet</Text><Text style={styles.subtitle}>Your completed requests will appear here.</Text><Button onPress={() => onNavigate("ask")} title="Create a recommendation" /></View> : null}
      <View style={styles.list}>{requests.map((request) => <Pressable key={request.id} onPress={() => void open(request)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{request.prompt}</Text><Text style={styles.rowMeta}>{date(request.created_at)} · {request.outfits?.length || 0} looks</Text>{request.status === "failed" ? <Text style={styles.failedText}>This recommendation could not be completed.</Text> : null}</View><Status status={request.status} /><ChevronRight color={colors.textSoft} size={20} /></Pressable>)}</View>
      {hasMore ? <Button loading={loading} onPress={() => void load(page + 1, true)} style={styles.more} title="Load more" variant="secondary" /> : null}
      </>}
    </>}
  </ScreenContainer>;
}

function WearList({ wears, onOpen }: { wears: WearHistory[]; onOpen: (wear: WearHistory) => void }) { if (!wears.length) return <View style={styles.empty}><Text style={styles.emptyTitle}>No worn outfits yet</Text><Text style={styles.subtitle}>Use “I wore this” on an outfit to build your history.</Text></View>; return <View style={styles.list}>{wears.map((wear) => <Pressable key={wear.id} onPress={() => onOpen(wear)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{wear.occasion ? humanize(wear.occasion) : "Outfit worn"}</Text><Text style={styles.rowMeta}>{simpleDate(wear.worn_on)}</Text></View><ChevronRight color={colors.textSoft} size={20} /></Pressable>)}</View>; }

function RequestDetail({ request, roles }: { request: RecommendationRequest; roles: { key: string; label: string }[] }) { if (request.status === "processing") return <View style={styles.statePanel}><ActivityIndicator color={colors.primary} /><Text style={styles.emptyTitle}>Recommendation in progress</Text></View>; if (request.status === "failed") return <View style={styles.statePanel}><Text style={styles.emptyTitle}>Recommendation unavailable</Text><Text style={styles.subtitle}>This request could not be completed. Try creating a new recommendation.</Text></View>; return <View style={styles.detail}><View style={styles.promptPanel}><Text style={styles.prompt}>{request.prompt}</Text><Status status={request.status} />{request.ranking_source === "deterministic" ? <Text style={styles.subtitle}>Created from your wardrobe and preferences.</Text> : null}</View>{request.outfits?.map((outfit) => <View key={outfit.id} style={styles.outfitSection}><Text style={styles.lookTitle}>{outfit.name}</Text><OutfitDetail initialOutfit={outfit} roles={roles} /></View>)}</View>; }
function Status({ status }: { status: RecommendationRequest["status"] }) { return <View style={[styles.status, status === "failed" && styles.statusFailed, status === "completed" && styles.statusComplete]}><Text style={[styles.statusText, status === "failed" && styles.statusFailedText, status === "completed" && styles.statusCompleteText]}>{status.replace(/^./, (letter) => letter.toUpperCase())}</Text></View>; }
function Loading() { return <View style={styles.statePanel}><ActivityIndicator color={colors.primary} /><Text style={styles.subtitle}>Loading recommendation history</Text></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View>; }
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function simpleDate(value: string) { const parsed = new Date(`${value}T12:00:00`); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(parsed); }

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, back: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, tabs: { alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: "row", gap: spacing.xs, marginBottom: spacing.lg, padding: spacing.xs }, tab: { borderRadius: radius.sm, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md }, tabActive: { backgroundColor: colors.surface }, tabText: { ...typography.caption, color: colors.textMuted }, tabTextActive: { color: colors.primary }, list: { gap: spacing.sm }, row: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg }, rowCopy: { flex: 1, gap: spacing.xs }, rowTitle: { ...typography.subheading, color: colors.text }, rowMeta: { ...typography.caption, color: colors.textMuted }, failedText: { ...typography.caption, color: colors.error }, status: { backgroundColor: "#FFF8E8", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, statusComplete: { backgroundColor: "#EAF8F0" }, statusFailed: { backgroundColor: "#FFF0ED" }, statusText: { ...typography.caption, color: colors.warning }, statusCompleteText: { color: colors.success }, statusFailedText: { color: colors.error }, empty: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.xxxl }, emptyTitle: { ...typography.heading, color: colors.text }, statePanel: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.xxxl }, detail: { gap: spacing.xxl }, promptPanel: { alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.sm, padding: spacing.xl }, prompt: { ...typography.heading, color: colors.text }, outfitSection: { gap: spacing.md }, lookTitle: { ...typography.heading, color: colors.text }, more: { alignSelf: "center", marginTop: spacing.xl, minWidth: 160 }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, marginBottom: spacing.lg, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, pressed: { opacity: 0.82 } });
