import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Bookmark, Check, ImageIcon, ThumbsDown, ThumbsUp, X } from "lucide-react-native";

import { AppService, resolveImageUrl } from "../api/AppService";
import type { DislikeReason, FeedbackReaction, MetadataOption, Outfit, OutfitStatus, OutfitVisualization, VisualizationMode } from "../api/types";
import { colors, radius, spacing, typography } from "../theme";
import { pickWardrobeImage } from "../utils/imagePicker";
import { Button } from "./Button";

const dislikeReasons: Array<{ key: DislikeReason; label: string }> = [
  { key: "too_formal", label: "Too formal" }, { key: "too_casual", label: "Too casual" },
  { key: "dont_like_colors", label: "Don't like the colors" }, { key: "recently_worn", label: "Recently worn" },
  { key: "not_comfortable", label: "Not comfortable" }, { key: "not_my_style", label: "Not my style" },
  { key: "other", label: "Other" }
];

export function OutfitDetail({ initialOutfit, roles, onChange }: { initialOutfit: Outfit; roles: MetadataOption[]; onChange?: (outfit: Outfit) => void }) {
  const [outfit, setOutfit] = useState(initialOutfit);
  const [reaction, setReaction] = useState<FeedbackReaction | null>(null);
  const [reason, setReason] = useState<DislikeReason | null>(null);
  const [note, setNote] = useState("");
  const [wornOn, setWornOn] = useState(today());
  const [occasion, setOccasion] = useState(outfit.occasion || "");
  const [mode, setMode] = useState<VisualizationMode>("flat_lay");
  const [visualization, setVisualization] = useState<OutfitVisualization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visualization || !["queued", "processing"].includes(visualization.status)) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const response = await AppService.visualization(outfit.id, visualization.id);
        if (!cancelled) setVisualization(response.data);
      } catch (caughtError) {
        if (!cancelled) setError(messageFor(caughtError));
      }
    }, 3000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [outfit.id, visualization]);

  async function updateStatus(status: OutfitStatus) {
    await run(async () => {
      const response = await AppService.updateOutfit(outfit.id, { status });
      setOutfit(response.data); onChange?.(response.data);
    });
  }

  async function logWear() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wornOn)) { setError("Use YYYY-MM-DD for the date worn."); return; }
    await run(async () => {
      await AppService.wearOutfit(outfit.id, { worn_on: wornOn, occasion: occasion.trim() || null, context: {} });
      const updated = { ...outfit, status: "worn" as const };
      setOutfit(updated); onChange?.(updated);
    });
  }

  async function saveFeedback() {
    if (!reaction) { setError("Choose liked or disliked before saving feedback."); return; }
    if (reaction === "disliked" && !reason) { setError("Choose what did not work for you."); return; }
    await run(async () => { await AppService.feedbackOutfit(outfit.id, { reaction, reason: reaction === "disliked" ? reason : null, notes: note.trim() || null }); });
  }

  async function createVisualization() {
    await run(async () => {
      const reference = mode === "try_on" ? await pickWardrobeImage("gallery") : null;
      const response = await AppService.createVisualization(outfit.id, mode, reference);
      setVisualization(response.data);
    });
  }

  async function run(action: () => Promise<void>) {
    setIsSaving(true); setError(null);
    try { await action(); } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setIsSaving(false); }
  }

  return <View style={styles.layout}>
    <View style={styles.gallery}>{[...outfit.items].sort((a, b) => a.position - b.position).map((item) => {
      const url = resolveImageUrl(item.clothing_item.image?.url);
      return <View key={item.id} style={styles.item}>{url ? <Image resizeMode="cover" source={{ uri: url }} style={styles.image} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>W</Text></View>}<View style={styles.itemCopy}><Text style={styles.role}>{labelFor(roles, item.role)}</Text><Text numberOfLines={1} style={styles.itemName}>{item.clothing_item.name || item.clothing_item.subcategory || "Clothing item"}</Text></View></View>;
    })}</View>
    <View style={styles.panel}>
      <View style={styles.badges}><Badge text={humanize(outfit.status)} />{outfit.recommendation_score != null ? <Badge text={`${Math.round(outfit.recommendation_score)}% match`} /> : null}</View>
      <Text style={styles.explanation}>{outfit.explanation}</Text>
      {Object.keys(outfit.score_breakdown || {}).length ? <View style={styles.scoreGrid}>{Object.entries(outfit.score_breakdown).map(([key, value]) => <View key={key} style={styles.scoreItem}><Text style={styles.scoreLabel}>{humanize(key)}</Text><Text style={styles.scoreValue}>{Math.round(value)}%</Text></View>)}</View> : null}
      <View style={styles.actions}><StatusAction active={outfit.status === "saved"} icon={<Bookmark color={outfit.status === "saved" ? colors.primary : colors.textMuted} size={18} />} label="Save" onPress={() => void updateStatus("saved")} /><StatusAction active={outfit.status === "dismissed"} icon={<X color={outfit.status === "dismissed" ? colors.error : colors.textMuted} size={18} />} label="Dismiss" onPress={() => void updateStatus("dismissed")} /></View>

      <Section title="Log this outfit"><View style={styles.twoColumns}><Field label="Date worn" onChangeText={setWornOn} placeholder="YYYY-MM-DD" value={wornOn} /><Field label="Occasion" onChangeText={setOccasion} placeholder="work" value={occasion} /></View><Button loading={isSaving} onPress={() => void logWear()} title="I wore this" variant="secondary" /></Section>

      <Section title="Help WEARO learn"><View style={styles.actions}><StatusAction active={reaction === "liked"} icon={<ThumbsUp color={reaction === "liked" ? colors.primary : colors.textMuted} size={18} />} label="Liked" onPress={() => { setReaction("liked"); setReason(null); }} /><StatusAction active={reaction === "disliked"} icon={<ThumbsDown color={reaction === "disliked" ? colors.primary : colors.textMuted} size={18} />} label="Disliked" onPress={() => setReaction("disliked")} /></View>{reaction === "disliked" ? <View style={styles.chips}>{dislikeReasons.map((option) => <Pressable key={option.key} onPress={() => setReason(option.key)} style={[styles.chip, reason === option.key && styles.chipActive]}><Text style={[styles.chipText, reason === option.key && styles.chipTextActive]}>{option.label}</Text></Pressable>)}</View> : null}<TextInput maxLength={500} multiline onChangeText={setNote} placeholder="Optional notes" placeholderTextColor={colors.textSoft} style={styles.note} value={note} /><Text style={styles.count}>{note.length}/500</Text><Button loading={isSaving} onPress={() => void saveFeedback()} title="Save feedback" variant="secondary" /></Section>

      <Section title="Visualize this look"><View style={styles.actions}><StatusAction active={mode === "flat_lay"} icon={<ImageIcon color={mode === "flat_lay" ? colors.primary : colors.textMuted} size={18} />} label="Flat lay" onPress={() => setMode("flat_lay")} /><StatusAction active={mode === "try_on"} icon={<Check color={mode === "try_on" ? colors.primary : colors.textMuted} size={18} />} label="Try on" onPress={() => setMode("try_on")} /></View><Text style={styles.hint}>{mode === "try_on" ? "Uses the image you choose, or your saved full-body profile image." : "Creates a clean image of the complete outfit."}</Text><Button loading={isSaving || visualization?.status === "queued" || visualization?.status === "processing"} onPress={() => void createVisualization()} title={visualization?.status === "queued" || visualization?.status === "processing" ? "Creating visualization" : "Create visualization"} variant="secondary" />{visualization?.status === "ready" && visualization.image?.url ? <Image resizeMode="contain" source={{ uri: resolveImageUrl(visualization.image.url) || "" }} style={styles.visualization} /> : null}{visualization?.status === "failed" ? <Text style={styles.errorText}>The visualization could not be created. Please try again.</Text> : null}</Section>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
    </View>
  </View>;
}

function Section({ children, title }: { children: React.ReactNode; title: string }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Field({ label, ...props }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.textSoft} style={styles.input} /></View>; }
function StatusAction({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive]}>{icon}<Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text></Pressable>; }
function Badge({ text }: { text: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{text}</Text></View>; }
function labelFor(options: MetadataOption[], key: string) { return options.find((option) => option.key === key)?.label || humanize(key); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function today() { return new Date().toISOString().slice(0, 10); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  layout: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }, gallery: { flex: 1.3, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, minWidth: 280 }, item: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexGrow: 1, overflow: "hidden", width: "30%" }, image: { aspectRatio: 0.82, width: "100%" }, placeholder: { alignItems: "center", aspectRatio: 0.82, backgroundColor: "#EFECFF", justifyContent: "center" }, placeholderText: { color: colors.primary, fontSize: 32, fontWeight: "800" }, itemCopy: { gap: 2, padding: spacing.sm }, role: { ...typography.caption, color: colors.primary }, itemName: { ...typography.caption, color: colors.text, fontWeight: "700" },
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 0.8, gap: spacing.lg, minWidth: 290, padding: spacing.xl }, badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, badge: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, badgeText: { ...typography.caption, color: colors.primary }, explanation: { ...typography.body, color: colors.textMuted }, scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, scoreItem: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, minWidth: 82, padding: spacing.sm }, scoreLabel: { ...typography.caption, color: colors.textMuted }, scoreValue: { ...typography.button, color: colors.text }, actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, action: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.xs, minHeight: 42, paddingHorizontal: spacing.sm }, actionActive: { backgroundColor: "#EFECFF", borderColor: colors.primary }, actionText: { ...typography.caption, color: colors.textMuted }, actionTextActive: { color: colors.primary },
  section: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm, paddingTop: spacing.lg }, sectionTitle: { ...typography.subheading, color: colors.text }, twoColumns: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, field: { flex: 1, gap: spacing.xs, minWidth: 120 }, label: { ...typography.caption, color: colors.textMuted }, input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 46, outlineStyle: "none", paddingHorizontal: spacing.md } as never, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, chip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, chipActive: { backgroundColor: "#EFECFF", borderColor: colors.primary }, chipText: { ...typography.caption, color: colors.textMuted }, chipTextActive: { color: colors.primary }, note: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 80, outlineStyle: "none", padding: spacing.md, textAlignVertical: "top" } as never, count: { ...typography.caption, color: colors.textSoft, textAlign: "right" }, hint: { ...typography.caption, color: colors.textMuted }, visualization: { aspectRatio: 0.8, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, width: "100%" }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }
});
