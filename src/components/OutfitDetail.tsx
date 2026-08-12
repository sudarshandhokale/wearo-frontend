import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Bookmark, Check, Star, X } from "lucide-react-native";

import { AppService, resolveImageUrl } from "../api/AppService";
import type { MetadataOption, Outfit, OutfitStatus } from "../api/types";
import { colors, radius, spacing, typography } from "../theme";
import { Button } from "./Button";

export function OutfitDetail({ initialOutfit, roles, onChange }: { initialOutfit: Outfit; roles: MetadataOption[]; onChange?: (outfit: Outfit) => void }) {
  const [outfit, setOutfit] = useState(initialOutfit);
  const [rating, setRating] = useState(outfit.rating || 0);
  const [note, setNote] = useState(outfit.feedback_note || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(values: { status?: OutfitStatus; rating?: number | null; feedback_note?: string | null }) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await AppService.updateOutfit(outfit.id, values);
      setOutfit(response.data);
      setRating(response.data.rating || 0);
      setNote(response.data.feedback_note || "");
      onChange?.(response.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
      <View style={styles.actions}>
        <StatusAction active={outfit.status === "saved"} icon={<Bookmark color={outfit.status === "saved" ? colors.primary : colors.textMuted} size={18} />} label="Save" onPress={() => void update({ status: "saved" })} />
        <StatusAction active={outfit.status === "worn"} icon={<Check color={outfit.status === "worn" ? colors.primary : colors.textMuted} size={18} />} label="I wore this" onPress={() => void update({ status: "worn" })} />
        <StatusAction active={outfit.status === "dismissed"} icon={<X color={outfit.status === "dismissed" ? colors.error : colors.textMuted} size={18} />} label="Dismiss" onPress={() => void update({ status: "dismissed" })} />
      </View>
      <View style={styles.feedback}><Text style={styles.label}>Rate this outfit</Text><View style={styles.rating}>{[1, 2, 3, 4, 5].map((value) => <Pressable accessibilityLabel={`Rate ${value} out of 5`} key={value} onPress={() => setRating(value)}><Star color={value <= rating ? colors.primary : colors.textSoft} fill={value <= rating ? colors.primary : "transparent"} size={26} /></Pressable>)}</View><TextInput maxLength={500} multiline onChangeText={setNote} placeholder="Optional feedback" placeholderTextColor={colors.textSoft} style={styles.note} value={note} /><Text style={styles.count}>{note.length}/500</Text><Button loading={isSaving} onPress={() => void update({ rating: rating || null, feedback_note: note.trim() || null })} title="Save feedback" variant="secondary" /></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
    </View>
  </View>;
}

function StatusAction({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive]}>{icon}<Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text></Pressable>; }
function Badge({ text }: { text: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{text}</Text></View>; }
function labelFor(options: MetadataOption[], key: string) { return options.find((option) => option.key === key)?.label || humanize(key); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const styles = StyleSheet.create({
  layout: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }, gallery: { flex: 1.3, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, minWidth: 280 }, item: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexGrow: 1, overflow: "hidden", width: "30%" }, image: { aspectRatio: 0.82, width: "100%" }, placeholder: { alignItems: "center", aspectRatio: 0.82, backgroundColor: "#EFECFF", justifyContent: "center" }, placeholderText: { color: colors.primary, fontSize: 32, fontWeight: "800" }, itemCopy: { gap: 2, padding: spacing.sm }, role: { ...typography.caption, color: colors.primary }, itemName: { ...typography.caption, color: colors.text, fontWeight: "700" },
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 0.8, gap: spacing.lg, minWidth: 290, padding: spacing.xl }, badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, badge: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, badgeText: { ...typography.caption, color: colors.primary }, explanation: { ...typography.body, color: colors.textMuted }, scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, scoreItem: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, minWidth: 82, padding: spacing.sm }, scoreLabel: { ...typography.caption, color: colors.textMuted }, scoreValue: { ...typography.button, color: colors.text }, actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, action: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.xs, minHeight: 42, paddingHorizontal: spacing.sm }, actionActive: { backgroundColor: "#EFECFF", borderColor: colors.primary }, actionText: { ...typography.caption, color: colors.textMuted }, actionTextActive: { color: colors.primary }, feedback: { gap: spacing.sm }, label: { ...typography.caption, color: colors.textMuted }, rating: { flexDirection: "row", gap: spacing.xs }, note: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 88, outlineStyle: "none", padding: spacing.md, textAlignVertical: "top" } as never, count: { ...typography.caption, color: colors.textSoft, textAlign: "right" }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }
});
