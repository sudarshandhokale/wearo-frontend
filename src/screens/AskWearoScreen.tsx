import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "../api/ApiError";
import { AppService, resolveImageUrl } from "../api/AppService";
import type { MetadataOption, Outfit, RecommendationErrorDetails } from "../api/types";
import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppData } from "../context/AppDataContext";
import { useResponsive } from "../hooks/useResponsive";
import { copy } from "../localization/en";
import type { AppScreen } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";

type StylistView = "prompt" | "results" | "detail";

export function AskWearoScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { metadata } = useAppData();
  const { isMobile } = useResponsive();
  const [view, setView] = useState<StylistView>("prompt");
  const [prompt, setPrompt] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [missingRoles, setMissingRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const roles = metadata?.outfits?.roles || [];
  const statuses = metadata?.outfits?.statuses || [];

  async function submit() {
    if (!prompt.trim()) {
      setError("Describe where you are going or what you are dressing for");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMissingRoles([]);
    try {
      const response = await AppService.recommendations(prompt.trim());
      setOutfits(response.data.outfits);
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
        <View style={[styles.detailLayout, isMobile && styles.mobileStack]}>
          <OutfitGallery outfit={selected} roles={roles} large />
          <View style={styles.detailPanel}>
            <View style={styles.badgeRow}>
              <Badge label={labelFor(statuses, selected.status)} />
              {selected.recommendation_score != null ? (
                <Badge label={`${copy.common.score} ${Math.round(selected.recommendation_score)}%`} />
              ) : null}
            </View>
            {selected.recommended_for ? (
              <Info label={copy.stylist.recommendedFor} value={formatLocalDate(selected.recommended_for)} />
            ) : null}
            <View style={styles.explanation}>
              <Text style={styles.sectionTitle}>{copy.stylist.explanation}</Text>
              <Text style={styles.body}>{selected.explanation}</Text>
            </View>
            <Button onPress={() => setView("results")} title={copy.stylist.backToResults} variant="secondary" />
          </View>
        </View>
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
        <View style={styles.promptLayout}>
          <View style={styles.promptPanel}>
            <Text style={styles.fieldLabel}>{copy.stylist.promptLabel}</Text>
            <TextInput
              accessibilityLabel={copy.stylist.promptLabel}
              editable={!isLoading}
              multiline
              onChangeText={setPrompt}
              placeholder={copy.stylist.promptPlaceholder}
              placeholderTextColor={colors.textSoft}
              style={styles.promptInput}
              value={prompt}
            />
            {error ? <ErrorBanner message={error} /> : null}
            {missingRoles.length ? (
              <View style={styles.incompletePanel}>
                <Text style={styles.sectionTitle}>{copy.stylist.incompleteTitle}</Text>
                <View style={styles.missingRoles}>
                  {missingRoles.map((role) => <Badge key={role} label={labelFor(roles, role)} />)}
                </View>
                <Button onPress={() => onNavigate("wardrobe")} title={copy.stylist.addClothing} variant="secondary" />
              </View>
            ) : null}
            <Button disabled={!prompt.trim()} loading={isLoading} onPress={() => void submit()} title={copy.stylist.submit} />
          </View>
          {isLoading ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingTitle}>{copy.stylist.loadingTitle}</Text>
              <Text style={styles.loadingText}>{copy.stylist.loadingText}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          {error ? <ErrorBanner message={error} /> : null}
          {isLoading ? <LoadingState /> : null}
          <View style={styles.resultsGrid}>
            {outfits.map((outfit, index) => (
              <Pressable
                accessibilityRole="button"
                key={outfit.id}
                onPress={() => void openOutfit(outfit)}
                style={({ pressed }) => [styles.outfitCard, pressed && styles.pressed]}
              >
                <View style={styles.outfitCardHeader}>
                  <Text style={styles.outfitNumber}>LOOK {index + 1}</Text>
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

function OutfitGallery({ outfit, roles, large = false }: { outfit: Outfit; roles: MetadataOption[]; large?: boolean }) {
  const sorted = [...outfit.items].sort((a, b) => a.position - b.position);
  return (
    <View style={[styles.gallery, large && styles.largeGallery]}>
      {sorted.map((item) => {
        const url = resolveImageUrl(item.clothing_item.image?.url);
        return (
          <View key={item.id} style={styles.galleryItem}>
            {url ? <Image resizeMode="cover" source={{ uri: url }} style={styles.clothingImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderMark}>W</Text></View>}
            <View style={styles.itemCopy}>
              <Text style={styles.role}>{labelFor(roles, item.role)}</Text>
              <Text numberOfLines={1} style={styles.itemName}>{item.clothing_item.name || item.clothing_item.subcategory || "Clothing item"}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Go back" onPress={onPress} style={styles.backButton}><Text style={styles.backSymbol}>‹</Text></Pressable>;
}
function Badge({ label }: { label: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{label}</Text></View>; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.errorBanner}><Text style={styles.errorText}>{message}</Text></View>; }
function LoadingState() { return <View style={styles.inlineLoading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Loading outfit details</Text></View>; }
function labelFor(options: MetadataOption[], key: string | null) { return options.find((option) => option.key === key)?.label || key?.replaceAll("_", " ") || copy.common.notSet; }
function formatLocalDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date); }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  pageHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted },
  promptLayout: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }, promptPanel: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.lg, flex: 1.2, gap: spacing.md, minWidth: 300, padding: spacing.xl }, fieldLabel: { ...typography.subheading, color: colors.text }, promptInput: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 148, outlineStyle: "none", padding: spacing.md, textAlignVertical: "top" } as never,
  loadingPanel: { alignItems: "center", backgroundColor: "#F0EEFF", borderRadius: radius.lg, flex: 0.8, gap: spacing.sm, minWidth: 260, padding: spacing.xxxl }, loadingTitle: { ...typography.heading, color: colors.text, textAlign: "center" }, loadingText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  incompletePanel: { backgroundColor: "#FFF8E8", borderColor: "#F4D999", borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.md }, missingRoles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  resultsGrid: { alignItems: "stretch", flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, outfitCard: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, flexGrow: 1, gap: spacing.md, minWidth: 280, padding: spacing.lg, width: "31%" }, outfitCardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, outfitNumber: { ...typography.caption, color: colors.primary }, score: { ...typography.caption, color: colors.textMuted, fontWeight: "600" }, detailLink: { ...typography.button, color: colors.primary }, tryAgainButton: { alignSelf: "center", marginTop: spacing.xl, minWidth: 220 },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, largeGallery: { flex: 1.3, minWidth: 300 }, galleryItem: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexGrow: 1, overflow: "hidden", width: "30%" }, clothingImage: { aspectRatio: 0.82, width: "100%" }, imagePlaceholder: { alignItems: "center", aspectRatio: 0.82, backgroundColor: "#EFECFF", justifyContent: "center" }, placeholderMark: { color: colors.primary, fontSize: 32, fontWeight: "800" }, itemCopy: { gap: 2, padding: spacing.sm }, role: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, itemName: { ...typography.caption, color: colors.text, fontWeight: "700" },
  detailLayout: { alignItems: "flex-start", flexDirection: "row", gap: spacing.xl }, mobileStack: { flexDirection: "column" }, detailPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 0.7, gap: spacing.lg, minWidth: 280, padding: spacing.xl }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, badge: { backgroundColor: "#EFECFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, badgeText: { ...typography.caption, color: colors.primary, textTransform: "capitalize" }, info: { gap: spacing.xxs }, infoLabel: { ...typography.caption, color: colors.textMuted }, infoValue: { ...typography.body, color: colors.text }, explanation: { gap: spacing.xs }, sectionTitle: { ...typography.subheading, color: colors.text }, body: { ...typography.body, color: colors.textMuted },
  backButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, backSymbol: { color: colors.text, fontSize: 32, lineHeight: 34 }, errorBanner: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, inlineLoading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.lg }, pressed: { opacity: 0.82 }
});
