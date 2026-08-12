import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppService, resolveImageUrl } from "../api/AppService";
import type { ClothingItem, MetadataOption, StyleProfileInput } from "../api/types";
import { useAppData } from "../context/AppDataContext";
import { Button } from "../components/Button";
import { PhotoGuide } from "../components/PhotoGuide";
import { WearoMark, WearoMobileLogo, WearoWebLogo } from "../components/WearoLogo";
import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { pickWardrobeImages } from "../utils/imagePicker";

const background = require("../../assets/auth-background.png");
const TOTAL_STEPS = 4;
const builds: MetadataOption[] = [
  { key: "slim", label: "Slim" },
  { key: "average", label: "Average" },
  { key: "athletic", label: "Athletic" },
  { key: "broad", label: "Broad" }
];
const dressPreferences: MetadataOption[] = [
  { key: "menswear", label: "Menswear" },
  { key: "womenswear", label: "Womenswear" },
  { key: "flexible", label: "Flexible" }
];
const ages: MetadataOption[] = [
  { key: "18_24", label: "18–24" },
  { key: "25_34", label: "25–34" },
  { key: "35_44", label: "35–44" },
  { key: "45_plus", label: "45+" }
];
const menswearStyleImages: Record<string, ImageSourcePropType> = {
  minimal: require("../../assets/styles/menswear/minimal.png"),
  classic: require("../../assets/styles/menswear/classic.png"),
  streetwear: require("../../assets/styles/menswear/streetwear.png"),
  athleisure: require("../../assets/styles/menswear/athleisure.png"),
  smart_casual: require("../../assets/styles/menswear/smart-casual.png"),
  business_casual: require("../../assets/styles/menswear/business-casual.png"),
  bohemian: require("../../assets/styles/menswear/bohemian.png"),
  edgy: require("../../assets/styles/menswear/edgy.png"),
  preppy: require("../../assets/styles/menswear/preppy.png")
};
const womenswearStyleImages: Record<string, ImageSourcePropType> = {
  minimal: require("../../assets/styles/womenswear/minimal.png"),
  classic: require("../../assets/styles/womenswear/classic.png"),
  streetwear: require("../../assets/styles/womenswear/streetwear.png"),
  athleisure: require("../../assets/styles/womenswear/athleisure.png"),
  smart_casual: require("../../assets/styles/womenswear/smart-casual.png"),
  business_casual: require("../../assets/styles/womenswear/business-casual.png"),
  bohemian: require("../../assets/styles/womenswear/bohemian.png"),
  edgy: require("../../assets/styles/womenswear/edgy.png"),
  preppy: require("../../assets/styles/womenswear/preppy.png")
};

export function OnboardingScreen() {
  const { metadata, saveStyleProfile, styleProfile } = useAppData();
  const { usesSidebar } = useResponsive();
  const saved = styleProfile?.additional_preferences || {};
  const [step, setStep] = useState(Number(saved.onboarding_step) || 0);
  const [preferredStyles, setPreferredStyles] = useState(styleProfile?.preferred_styles || []);
  const [preferredColors, setPreferredColors] = useState(styleProfile?.preferred_colors || []);
  const [dislikedColors, setDislikedColors] = useState(styleProfile?.disliked_colors || []);
  const [anyStylePreference, setAnyStylePreference] = useState(saved.any_style_preference === true);
  const [anyColorPreference, setAnyColorPreference] = useState(saved.any_color_preference === true);
  const [genderPreference, setGenderPreference] = useState(normalizeChoiceKey(saved.gender_preference, dressPreferences));
  const [height, setHeight] = useState(String(saved.height_cm || ""));
  const [build, setBuild] = useState(normalizeChoiceKey(saved.build, builds));
  const [ageRange, setAgeRange] = useState(normalizeChoiceKey(saved.age_range, ages));
  const [uploadedItems, setUploadedItems] = useState<ClothingItem[]>([]);
  const [hasLoadedWardrobe, setHasLoadedWardrobe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileInput = useMemo<StyleProfileInput>(
    () => ({
      preferred_styles: preferredStyles,
      preferred_colors: preferredColors,
      disliked_colors: dislikedColors,
      fit_preferences: styleProfile?.fit_preferences || {},
      additional_preferences: {
        ...saved,
        gender_preference: genderPreference,
        height_cm: height ? Number(height) : null,
        build: build || null,
        age_range: ageRange || null,
        any_style_preference: anyStylePreference,
        any_color_preference: anyColorPreference,
        onboarding_step: step
      },
      onboarding_completed: false
    }),
    [ageRange, anyColorPreference, anyStylePreference, build, dislikedColors, genderPreference, height, preferredColors, preferredStyles, saved, step, styleProfile]
  );

  useEffect(() => {
    if (step === 4 && !hasLoadedWardrobe) void loadWardrobeItems();
  }, [hasLoadedWardrobe, step]);

  async function saveAndGo(nextStep: number) {
    setIsSaving(true);
    setError(null);
    try {
      await saveStyleProfile({
        ...profileInput,
        additional_preferences: { ...profileInput.additional_preferences, onboarding_step: nextStep }
      });
      setStep(nextStep);
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function deferOnboarding() {
    setIsSaving(true);
    setError(null);
    try {
      await saveStyleProfile({
        ...profileInput,
        additional_preferences: {
          ...profileInput.additional_preferences,
          onboarding_deferred: true,
          onboarding_step: Math.max(step, 1)
        }
      });
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function completeOnboarding() {
    setIsSaving(true);
    setError(null);
    try {
      await saveStyleProfile({
        ...profileInput,
        onboarding_completed: true,
        additional_preferences: {
          ...profileInput.additional_preferences,
          onboarding_deferred: false,
          onboarding_step: TOTAL_STEPS
        }
      });
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function upload(source: "camera" | "gallery") {
    setIsUploading(true);
    setError(null);
    try {
      const images = await pickWardrobeImages(source, source === "gallery");
      if (!images.length) return;
      for (const image of images) {
        const response = await AppService.createClothingItem(emptyItem(), image);
        setUploadedItems((current) => [response.data, ...current]);
      }
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsUploading(false);
    }
  }

  async function loadWardrobeItems() {
    if (hasLoadedWardrobe) return;
    setIsUploading(true);
    setError(null);
    try {
      const response = await AppService.clothingItems({ page: 1, perPage: 50 });
      setUploadedItems(response.data);
      setHasLoadedWardrobe(true);
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={background} style={styles.background} resizeMode="cover">
        <View style={styles.scrim} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.shell, usesSidebar && styles.desktopShell]}>
              {usesSidebar ? <OnboardingStory /> : null}
              <View style={[styles.card, usesSidebar && styles.desktopCard]}>
                {!usesSidebar ? <WearoMobileLogo compact /> : null}
                {step > 0 ? <Progress step={step} /> : null}
                {step === 0 ? (
                  <Welcome onContinue={() => void saveAndGo(1)} onSkip={() => void deferOnboarding()} />
                ) : null}
                {step === 1 ? (
                  <AboutYou
                    ageRange={ageRange}
                    build={build}
                    genderPreference={genderPreference}
                    height={height}
                    onAgeRange={setAgeRange}
                    onBuild={setBuild}
                    onGenderPreference={setGenderPreference}
                    onHeight={(value) => setHeight(value.replace(/\D/g, "").slice(0, 3))}
                    onContinue={() => void saveAndGo(2)}
                  />
                ) : null}
                {step === 2 ? (
                  <StyleStep
                    genderPreference={genderPreference}
                    options={metadata?.style_profile.preferred_styles || []}
                    selected={preferredStyles}
                    anySelected={anyStylePreference}
                    onSelect={(key) => { setAnyStylePreference(false); setPreferredStyles(toggleLimit(preferredStyles, key, 4)); }}
                    onAny={() => { setAnyStylePreference(true); setPreferredStyles([]); }}
                    onContinue={() => void saveAndGo(3)}
                  />
                ) : null}
                {step === 3 ? (
                  <ColorStep
                    avoid={dislikedColors}
                    avoidOptions={metadata?.style_profile.disliked_colors || []}
                    love={preferredColors}
                    loveOptions={metadata?.style_profile.preferred_colors || []}
                    onAvoid={(key) => setDislikedColors(toggle(dislikedColors, key))}
                    anyLoveSelected={anyColorPreference}
                    onAnyLove={() => { setAnyColorPreference(true); setPreferredColors([]); }}
                    onLove={(key) => { setAnyColorPreference(false); setPreferredColors(toggle(preferredColors, key)); }}
                    onContinue={() => void saveAndGo(4)}
                  />
                ) : null}
                {step === 4 ? (
                  <WardrobeStep
                    items={uploadedItems}
                    isUploading={isUploading}
                    onCamera={() => void upload("camera")}
                    onComplete={() => void completeOnboarding()}
                    onGallery={() => void upload("gallery")}
                    onLater={() => void deferOnboarding()}
                    statuses={metadata?.clothing_items.statuses || []}
                  />
                ) : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {isSaving ? <ActivityIndicator color={colors.primary} /> : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function OnboardingStory() {
  return (
    <View style={styles.story}>
      <WearoWebLogo />
      <View style={styles.storyCopy}>
        <Text style={styles.storyKicker}>STYLE, MADE PERSONAL</Text>
        <Text style={styles.storyTitle}>A wardrobe that works around your life.</Text>
        <Text style={styles.storyText}>A few quick choices help WEARO recommend outfits that feel like you.</Text>
      </View>
      <View style={styles.storyStats}>
        <StoryStat label="Quick setup" value="4 steps" />
        <StoryStat label="Your choice" value="Resumable" />
        <StoryStat label="Built from" value="Your clothes" />
      </View>
    </View>
  );
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return <View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Progress({ step }: { step: number }) {
  return (
    <View style={styles.progressHeader}>
      <Text style={styles.progressText}>Step {step} of {TOTAL_STEPS}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} /></View>
    </View>
  );
}

function Welcome({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.heroMark}><WearoMark size="lg" /></View>
      <Text style={styles.title}>Meet your personal stylist</Text>
      <Text style={styles.subtitle}>Build your wardrobe. Get outfits made for you, using clothes you already own.</Text>
      <View style={styles.miniFeatures}>
        <MiniFeature label="Learn your style" symbol="01" />
        <MiniFeature label="Organize your wardrobe" symbol="02" />
        <MiniFeature label="Create better outfits" symbol="03" />
      </View>
      <Button onPress={onContinue} title="Set up my style" />
      <TextButton label="Skip for now" onPress={onSkip} />
    </View>
  );
}

function MiniFeature({ label, symbol }: { label: string; symbol: string }) {
  return <View style={styles.miniFeature}><Text style={styles.miniFeatureNumber}>{symbol}</Text><Text style={styles.miniFeatureText}>{label}</Text></View>;
}

type AboutProps = {
  genderPreference: string; height: string; build: string; ageRange: string;
  onGenderPreference: (value: string) => void; onHeight: (value: string) => void;
  onBuild: (value: string) => void; onAgeRange: (value: string) => void; onContinue: () => void;
};

function AboutYou(props: AboutProps) {
  return (
    <View style={styles.step}>
      <StepHeading title="Let's get to know you" subtitle="This helps WEARO suggest clothes that suit you better." />
      <ChoiceGroup label="How do you like to dress?" options={dressPreferences} selected={props.genderPreference} onSelect={props.onGenderPreference} />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Height <Text style={styles.optional}>Optional</Text></Text>
        <View style={styles.heightField}><TextInput keyboardType="number-pad" onChangeText={props.onHeight} placeholder="175" placeholderTextColor={colors.textSoft} style={styles.heightInput} value={props.height} /><Text style={styles.unit}>cm</Text></View>
      </View>
      <ChoiceGroup label="How would you describe your build?" options={builds} selected={props.build} onSelect={props.onBuild} />
      <ChoiceGroup label="Age range (optional)" options={ages} selected={props.ageRange} onSelect={props.onAgeRange} />
      <Button onPress={props.onContinue} title="Continue" />
    </View>
  );
}

function StyleStep({ genderPreference, options, selected, anySelected, onSelect, onAny, onContinue }: { genderPreference: string; options: MetadataOption[]; selected: string[]; anySelected: boolean; onSelect: (key: string) => void; onAny: () => void; onContinue: () => void }) {
  return (
    <View style={styles.step}>
      <StepHeading title="What's your style?" subtitle="Pick 2–4 styles that feel most like you." />
      <Text style={styles.inspirationContext}>Showing {choiceLabel(genderPreference, dressPreferences).toLowerCase()} inspiration</Text>
      <PreferenceToggle label="I'm open to any style" selected={anySelected} onPress={onAny} />
      <View style={styles.visualGrid}>{options.map((option, index) => <VisualOption genderPreference={genderPreference} index={index} key={option.key} option={option} selected={selected.includes(option.key)} onPress={() => onSelect(option.key)} />)}</View>
      <Text style={styles.selectionHint}>{anySelected ? "No style restrictions" : `${selected.length} of 4 selected`}</Text>
      <Button disabled={!anySelected && selected.length < 2} onPress={onContinue} title="Continue" />
    </View>
  );
}

function VisualOption({ genderPreference, index, option, selected, onPress }: { genderPreference: string; index: number; option: MetadataOption; selected: boolean; onPress: () => void }) {
  const image = styleImageFor(genderPreference, option.key, index);

  return (
    <Pressable
      accessibilityLabel={option.label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.visualOption, selected && styles.optionSelected]}
    >
      {image ? <Image resizeMode="cover" source={image} style={styles.visualOptionImage} /> : null}
      <View style={styles.visualOptionScrim} />
      <Text numberOfLines={2} style={styles.visualOptionText}>{option.label}</Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

function ColorStep(props: { loveOptions: MetadataOption[]; avoidOptions: MetadataOption[]; love: string[]; avoid: string[]; anyLoveSelected: boolean; onLove: (key: string) => void; onAnyLove: () => void; onAvoid: (key: string) => void; onContinue: () => void }) {
  return (
    <View style={styles.step}>
      <StepHeading title="Your color palette" subtitle="Choose colors you enjoy wearing. You can change these anytime." />
      <Text style={styles.label}>Colors I love</Text>
      <PreferenceToggle label="Any colors" selected={props.anyLoveSelected} onPress={props.onAnyLove} />
      <ColorGrid options={props.loveOptions} selected={props.love} onSelect={props.onLove} />
      <Text style={styles.label}>Colors I avoid <Text style={styles.optional}>Optional</Text></Text>
      <ColorGrid options={props.avoidOptions} selected={props.avoid} onSelect={props.onAvoid} />
      <Button disabled={!props.anyLoveSelected && !props.love.length} onPress={props.onContinue} title="Continue" />
    </View>
  );
}

function ColorGrid({ options, selected, onSelect }: { options: MetadataOption[]; selected: string[]; onSelect: (key: string) => void }) {
  return <View style={styles.colorGrid}>{options.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected.includes(option.key) }} key={option.key} onPress={() => onSelect(option.key)} style={[styles.colorChoice, selected.includes(option.key) && styles.colorChoiceSelected]}><View style={[styles.swatch, { backgroundColor: colorValue(option.key) }]} /><Text style={styles.colorLabel}>{option.label}</Text></Pressable>)}</View>;
}

function PreferenceToggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.preferenceToggle, selected && styles.preferenceToggleSelected]}><View style={[styles.preferenceCheck, selected && styles.preferenceCheckSelected]}><Text style={styles.preferenceCheckText}>{selected ? "✓" : ""}</Text></View><Text style={[styles.preferenceToggleText, selected && styles.preferenceToggleTextSelected]}>{label}</Text></Pressable>;
}

function WardrobeStep({ items, isUploading, onCamera, onGallery, onComplete, onLater, statuses }: { items: ClothingItem[]; isUploading: boolean; onCamera: () => void; onGallery: () => void; onComplete: () => void; onLater: () => void; statuses: MetadataOption[] }) {
  return (
    <View style={styles.step}>
      <View style={styles.wardrobeIcon}><Text style={styles.wardrobeIconText}>W</Text></View>
      <StepHeading title="Build your wardrobe" subtitle="WEARO creates outfits using clothes you already own. Start with 3–5 pieces and we'll organize them automatically." />
      <PhotoGuide compact />
      <UploadAction title="Take a photo" description="Photograph one clothing item" onPress={onCamera} />
      <UploadAction title="Upload from gallery" description="Choose up to 10 clothing photos" onPress={onGallery} />
      {isUploading ? <View style={styles.uploading}><ActivityIndicator color={colors.primary} /><Text style={styles.uploadingText}>Adding clothing to your wardrobe…</Text></View> : null}
      {items.length ? <UploadedItemGrid items={items} statuses={statuses} /> : <Text style={styles.selectionHint}>Start with 3–5 items</Text>}
      {items.length ? <Text style={styles.uploadCount}>{items.length} {items.length === 1 ? "item" : "items"} in your wardrobe</Text> : null}
      <Button disabled={!items.length || isUploading} onPress={onComplete} title={items.length ? "Finish setup" : "Add an item to continue"} />
      <TextButton label="Do this later" onPress={onLater} />
    </View>
  );
}

function UploadedItemGrid({ items, statuses }: { items: ClothingItem[]; statuses: MetadataOption[] }) {
  return <View style={styles.uploadedGrid}>{items.map((item) => { const url = resolveImageUrl(item.image?.url); return <View key={item.id} style={styles.uploadedItem}>{url ? <Image resizeMode="cover" source={{ uri: url }} style={styles.uploadedImage} /> : <View style={styles.uploadedPlaceholder}><Text style={styles.uploadedPlaceholderText}>W</Text></View>}<View style={styles.uploadedCopy}><Text numberOfLines={1} style={styles.uploadedName}>{item.name || item.subcategory || "Analyzing item"}</Text><Text style={styles.uploadedStatus}>{statuses.find((status) => status.key === item.status)?.label || item.status.replaceAll("_", " ")}</Text></View></View>; })}</View>;
}

function UploadAction({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.uploadAction}><View style={styles.uploadSymbol}><Text style={styles.uploadSymbolText}>+</Text></View><View style={styles.flex}><Text style={styles.uploadTitle}>{title}</Text><Text style={styles.uploadDescription}>{description}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.heading}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>;
}

function ChoiceGroup({ label, options, selected, onSelect }: { label: string; options: MetadataOption[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text><View style={styles.choiceRow}>{options.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected === option.key }} key={option.key} onPress={() => onSelect(option.key)} style={[styles.choice, selected === option.key && styles.choiceSelected]}><Text style={[styles.choiceText, selected === option.key && styles.choiceTextSelected]}>{option.label}</Text></Pressable>)}</View></View>;
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}><Text style={styles.textButtonLabel}>{label}</Text></Pressable>;
}

function toggle(values: string[], key: string) { return values.includes(key) ? values.filter((value) => value !== key) : [...values, key]; }
function toggleLimit(values: string[], key: string, limit: number) { return values.includes(key) ? values.filter((value) => value !== key) : values.length < limit ? [...values, key] : values; }
function normalizeChoiceKey(value: unknown, options: MetadataOption[]) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[+–—-]/g, "_").replace(/\s+/g, "_");
  return options.find((option) => option.key === normalized || option.label.toLowerCase() === String(value || "").trim().toLowerCase())?.key || "";
}
function choiceLabel(key: string, options: MetadataOption[]) { return options.find((option) => option.key === key)?.label || "flexible"; }
function styleImageFor(preference: string, styleKey: string, index: number) {
  if (preference === "menswear") return menswearStyleImages[styleKey];
  if (preference === "womenswear") return womenswearStyleImages[styleKey];
  return index % 2 === 0 ? womenswearStyleImages[styleKey] : menswearStyleImages[styleKey];
}
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function emptyItem() { return { name: "", garment_type: "", category: "", subcategory: "", primary_color: "", secondary_colors: [], pattern: "", material: "", season_tags: [], occasion_tags: [], style_tags: [], cultural_tags: [], formality_score: "" }; }
function colorValue(key: string) { return ({ black: "#242424", white: "#FFFFFF", gray: "#A4A4A4", navy: "#202A55", blue: "#4479C4", brown: "#87654A", beige: "#DED0B8", green: "#5B7F63", red: "#B94A55", pink: "#D99CB3", purple: "#7761B5", orange: "#D47D42", yellow: "#D6B745", neon: "#B6F23A" } as Record<string, string>)[key] || "#D8D4E0"; }

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 }, flex: { flex: 1 }, background: { flex: 1 }, scrim: { backgroundColor: "rgba(250,249,253,0.72)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  scroll: { alignItems: "center", flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  shell: { alignItems: "stretch", maxWidth: 560, width: "100%" }, desktopShell: { alignItems: "stretch", flexDirection: "row", maxWidth: 1120, minHeight: 700 },
  story: { backgroundColor: "rgba(255,255,255,0.78)", borderBottomLeftRadius: radius.xl, borderTopLeftRadius: radius.xl, flex: 1, justifyContent: "space-between", maxWidth: 480, padding: spacing.xxxl },
  storyCopy: { gap: spacing.md }, storyKicker: { ...typography.caption, color: colors.primary }, storyTitle: { ...typography.display, color: colors.text }, storyText: { ...typography.body, color: colors.textMuted, maxWidth: 360 }, storyStats: { flexDirection: "row", gap: spacing.xl }, statValue: { ...typography.subheading, color: colors.text }, statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 3 },
  card: { ...shadows.card, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: radius.xl, gap: spacing.lg, padding: spacing.xl }, desktopCard: { borderBottomLeftRadius: 0, borderTopLeftRadius: 0, justifyContent: "center", maxWidth: 600, padding: spacing.xxxl, width: "54%" },
  progressHeader: { gap: spacing.xs }, progressText: { ...typography.caption, color: colors.primary }, progressTrack: { backgroundColor: "#ECE9F6", borderRadius: radius.pill, height: 6, overflow: "hidden" }, progressFill: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 6 },
  step: { gap: spacing.lg }, heading: { gap: spacing.xs }, heroMark: { alignItems: "center", marginVertical: spacing.sm }, title: { ...typography.heading, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted },
  miniFeatures: { gap: spacing.xs }, miniFeature: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: "row", gap: spacing.sm, padding: spacing.sm }, miniFeatureNumber: { ...typography.caption, color: colors.primary }, miniFeatureText: { ...typography.body, color: colors.text, fontWeight: "600" },
  fieldGroup: { gap: spacing.sm }, label: { ...typography.caption, color: colors.text }, optional: { color: colors.textSoft, fontWeight: "500" }, choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, choice: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minHeight: 44, paddingHorizontal: spacing.md, justifyContent: "center" }, choiceSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, choiceText: { ...typography.body, color: colors.textMuted }, choiceTextSelected: { color: colors.primary, fontWeight: "700" },
  heightField: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", maxWidth: 180, paddingHorizontal: spacing.md }, heightInput: { ...typography.body, color: colors.text, flex: 1, minHeight: 48, outlineStyle: "none" } as never, unit: { ...typography.body, color: colors.textMuted },
  inspirationContext: { ...typography.caption, color: colors.primary, marginTop: -spacing.sm }, visualGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, visualOption: { aspectRatio: 1, backgroundColor: "#E8E5ED", borderColor: "transparent", borderRadius: radius.md, borderWidth: 3, justifyContent: "flex-end", overflow: "hidden", padding: spacing.sm, position: "relative", width: "47%" }, optionSelected: { borderColor: colors.primary }, visualOptionImage: { height: "100%", left: 0, position: "absolute", top: 0, width: "100%" }, visualOptionScrim: { backgroundColor: "rgba(16,16,24,0.5)", bottom: 0, height: 58, left: 0, position: "absolute", right: 0 }, visualOptionText: { ...typography.button, color: colors.surface, maxWidth: "82%", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 3 }, check: { backgroundColor: colors.primary, borderColor: colors.surface, borderRadius: radius.pill, borderWidth: 2, color: colors.surface, fontWeight: "800", height: 28, lineHeight: 24, position: "absolute", right: 8, textAlign: "center", top: 8, width: 28 }, selectionHint: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, colorChoice: { alignItems: "center", borderColor: "transparent", borderRadius: radius.md, borderWidth: 1, gap: spacing.xxs, padding: spacing.xs, width: 72 }, colorChoiceSelected: { backgroundColor: "#F0EDFF", borderColor: colors.primary }, swatch: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 34, width: 34 }, colorLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  preferenceToggle: { alignItems: "center", alignSelf: "flex-start", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md }, preferenceToggleSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, preferenceCheck: { alignItems: "center", borderColor: colors.textSoft, borderRadius: 4, borderWidth: 1, height: 20, justifyContent: "center", width: 20 }, preferenceCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, preferenceCheckText: { color: colors.surface, fontSize: 13, fontWeight: "800" }, preferenceToggleText: { ...typography.body, color: colors.textMuted }, preferenceToggleTextSelected: { color: colors.primary, fontWeight: "700" },
  wardrobeIcon: { alignItems: "center", alignSelf: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 80, justifyContent: "center", width: 80 }, wardrobeIconText: { color: colors.primary, fontSize: 38, fontWeight: "900" }, uploadAction: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.md }, uploadSymbol: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.md, height: 44, justifyContent: "center", width: 44 }, uploadSymbolText: { color: colors.primary, fontSize: 28, lineHeight: 30 }, uploadTitle: { ...typography.button, color: colors.text }, uploadDescription: { ...typography.caption, color: colors.textMuted, fontWeight: "500" }, arrow: { color: colors.primary, fontSize: 28 }, uploading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "center" }, uploadingText: { ...typography.caption, color: colors.textMuted }, uploadCount: { ...typography.caption, color: colors.success, textAlign: "center" }, uploadedGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, uploadedItem: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: "hidden", width: "31%" }, uploadedImage: { aspectRatio: 1, width: "100%" }, uploadedPlaceholder: { alignItems: "center", aspectRatio: 1, backgroundColor: "#EFECFF", justifyContent: "center" }, uploadedPlaceholderText: { color: colors.primary, fontSize: 26, fontWeight: "800" }, uploadedCopy: { gap: 2, padding: spacing.xs }, uploadedName: { ...typography.caption, color: colors.text, fontWeight: "700" }, uploadedStatus: { ...typography.caption, color: colors.primary, fontSize: 10, textTransform: "capitalize" },
  textButton: { alignItems: "center", minHeight: 40, justifyContent: "center" }, textButtonLabel: { ...typography.button, color: colors.primary }, error: { ...typography.caption, color: colors.error, textAlign: "center" }
});
