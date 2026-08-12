import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { MetadataOption, StyleProfile, UpdateUserParams } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppData } from "../context/AppDataContext";
import { colors, radius, spacing, typography } from "../theme";
import { deviceTimezone, inferDeviceCountryCode } from "../utils/deviceLocation";
import { pickWardrobeImage } from "../utils/imagePicker";
import { resolveImageUrl } from "../api/AppService";

export function ProfileScreen() {
  const { deleteFullBodyImage, isSubmitting, logout, updateFullBodyImage, updateUser, user } = useAuth();
  const { metadata, saveStyleProfile, styleProfile } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [form, setForm] = useState<UpdateUserParams>(() => formFromUser(user));
  const countries = metadata?.countries || [];
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "WEARO user";
  const countryName = useMemo(() => countries.find((country) => country.code === user?.country_code)?.name || user?.country_code || "Not set", [countries, user?.country_code]);
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) =>
      country.code.toLowerCase().startsWith(query) ||
      country.name.toLowerCase().split(/\s+/).some((word) => word.startsWith(query))
    );
  }, [countries, countryQuery]);

  useEffect(() => { if (!isEditing) setForm(formFromUser(user)); }, [isEditing, user]);

  function update<K extends keyof UpdateUserParams>(key: K, value: UpdateUserParams[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    setError(null);
    try {
      await updateUser({
        ...form,
        first_name: titleize(form.first_name),
        last_name: titleize(form.last_name),
        country_code: String(form.country_code || inferDeviceCountryCode()).toUpperCase(),
        preferred_city: titleizeLocation(String(form.preferred_city || "").trim()),
        timezone: deviceTimezone
      });
      setSaved(true);
      setIsEditing(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Profile could not be updated.");
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.headerCopy}><Text style={styles.title}>Profile</Text><Text style={styles.subtitle}>{user?.email}</Text></View>
          {!isEditing && !isEditingStyle ? <Button onPress={() => setIsEditing(true)} title="Edit profile" variant="secondary" /> : null}
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.row}>
              <Field label="First name" value={String(form.first_name || "")} onChange={(value) => update("first_name", value)} />
              <Field label="Last name" value={String(form.last_name || "")} onChange={(value) => update("last_name", value)} />
            </View>
            <Field label="Preferred city" placeholder="Berlin" value={String(form.preferred_city || "")} onChange={(value) => update("preferred_city", titleizeLocation(value))} />
            <View style={[styles.field, countryOpen && styles.countryFieldOpen]}><Text style={styles.label}>Country</Text><Pressable accessibilityRole="button" onPress={() => setCountryOpen((current) => !current)} style={[styles.input, styles.selectInput, countryOpen && styles.selectInputOpen]}><Text numberOfLines={1} style={styles.selectValue}>{countries.find((country) => country.code === form.country_code)?.name || form.country_code || "Select country"}</Text><Text style={styles.selectArrow}>{countryOpen ? "⌃" : "⌄"}</Text></Pressable>{countryOpen ? <View style={styles.countryMenu}><TextInput autoCapitalize="words" autoFocus onChangeText={(value) => setCountryQuery(titleizeLocation(value))} placeholder="Search countries" placeholderTextColor={colors.textSoft} style={styles.countrySearch} value={countryQuery} /><ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.countryList}>{filteredCountries.length ? filteredCountries.map((country) => <Pressable key={country.code} onPress={() => { update("country_code", country.code); setCountryOpen(false); setCountryQuery(""); }} style={[styles.countryOption, form.country_code === country.code && styles.countryOptionSelected]}><Text style={[styles.countryOptionText, form.country_code === country.code && styles.countryOptionTextSelected]}>{country.name}</Text><Text style={styles.countryCode}>{country.code}</Text></Pressable>) : <Text style={styles.noCountries}>No countries found</Text>}</ScrollView></View> : null}</View>
            <View style={styles.field}><Text style={styles.label}>Timezone</Text><View style={[styles.input, styles.readOnlyInput]}><Text style={styles.readOnlyValue}>{deviceTimezone}</Text><Text style={styles.detectedLabel}>Detected automatically</Text></View></View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}><Button onPress={() => { setIsEditing(false); setError(null); }} style={styles.action} title="Cancel" variant="secondary" /><Button loading={isSubmitting} onPress={() => void save()} style={styles.action} title="Save profile" /></View>
          </View>
        ) : isEditingStyle && styleProfile ? (
          <StyleProfileEditor
            metadata={metadata}
            onCancel={() => setIsEditingStyle(false)}
            onSave={async (input) => {
              await saveStyleProfile(input);
              setIsEditingStyle(false);
              setSaved(true);
            }}
            profile={styleProfile}
          />
        ) : (
          <>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.details}>
              <Detail label="Preferred city" value={user?.preferred_city ? titleizeLocation(user.preferred_city) : "Not set"} />
              <Detail label="Country" value={countryName} />
              <Detail label="Timezone" value={user?.timezone || "Not set"} />
            </View>
            <View style={styles.profileImageSection}><View><Text style={styles.styleProfileTitle}>Full-body reference</Text><Text style={styles.styleProfileSubtitle}>Used for try-on visualizations. JPEG, PNG, or WebP up to 10 MB.</Text></View><View style={styles.profileImageRow}>{user?.full_body_image?.url ? <Image resizeMode="cover" source={{ uri: resolveImageUrl(user.full_body_image.url) || "" }} style={styles.profileImage} /> : <View style={styles.profileImagePlaceholder}><Text style={styles.profileImagePlaceholderText}>No image</Text></View>}<View style={styles.profileImageActions}><Button loading={isSubmitting} onPress={() => void (async () => { try { setError(null); const image = await pickWardrobeImage("gallery"); if (image) await updateFullBodyImage(image); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Image could not be uploaded."); } })()} title={user?.full_body_image ? "Replace image" : "Upload image"} variant="secondary" />{user?.full_body_image ? <Pressable onPress={() => void (async () => { try { setError(null); await deleteFullBodyImage(); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Image could not be removed."); } })()}><Text style={styles.removeImage}>Remove image</Text></Pressable> : null}</View></View>{error ? <Text style={styles.error}>{error}</Text> : null}</View>
            <StyleProfileSummary metadata={metadata} onEdit={() => { setSaved(false); setIsEditingStyle(true); }} profile={styleProfile} />
            {saved ? <Text style={styles.saved}>Profile updated.</Text> : null}
            <Button onPress={logout} title="Logout" variant="secondary" />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

function StyleProfileSummary({ metadata, onEdit, profile }: { metadata: ReturnType<typeof useAppData>["metadata"]; onEdit: () => void; profile: ReturnType<typeof useAppData>["styleProfile"] }) {
  if (!profile) return null;
  const saved = profile.additional_preferences || {};
  const styleOptions = metadata?.style_profile.preferred_styles || [];
  const colorOptions = metadata?.style_profile.preferred_colors || [];
  const avoidedOptions = metadata?.style_profile.disliked_colors || [];
  const styleLabels = saved.any_style_preference === true ? ["Any style"] : labelsFor(profile.preferred_styles, styleOptions);
  const colorLabels = saved.any_color_preference === true ? ["Any colors"] : labelsFor(profile.preferred_colors, colorOptions);
  const avoidedLabels = labelsFor(profile.disliked_colors, avoidedOptions);
  const fitLabels = Object.entries(profile.fit_preferences).map(([category, value]) => {
    const label = metadata?.style_profile.fit_preferences[category]?.find((option) => option.key === value)?.label || readable(value);
    return `${readable(category)}: ${label}`;
  });
  const personalDetails = [
    typeof saved.gender_preference === "string" ? readable(saved.gender_preference) : null,
    typeof saved.build === "string" ? `${readable(saved.build)} build` : null,
    typeof saved.height_cm === "number" ? `${saved.height_cm} cm` : null,
    typeof saved.age_range === "string" ? ageLabel(saved.age_range) : null
  ].filter((value): value is string => Boolean(value));

  return <View style={styles.styleProfile}>
    <View style={styles.styleProfileHeader}><View style={styles.styleProfileHeading}><Text style={styles.styleProfileTitle}>Style profile</Text><Text style={styles.styleProfileSubtitle}>Saved preferences used by WEARO recommendations</Text></View><View style={styles.styleProfileHeaderActions}><View style={[styles.profileStatus, profile.onboarding_completed && styles.profileStatusComplete]}><Text style={[styles.profileStatusText, profile.onboarding_completed && styles.profileStatusTextComplete]}>{profile.onboarding_completed ? "Complete" : "In progress"}</Text></View><Button onPress={onEdit} title="Edit style" variant="secondary" /></View></View>
    <PreferenceSection label="Personal details" values={personalDetails} empty="Not provided" />
    <PreferenceSection label="Preferred styles" values={styleLabels} empty="Not selected" />
    <PreferenceSection label="Preferred colors" values={colorLabels} empty="Not selected" />
    <PreferenceSection label="Colors to avoid" values={avoidedLabels} empty="No avoided colors" />
    {fitLabels.length ? <PreferenceSection label="Fit preferences" values={fitLabels} empty="Not selected" /> : null}
  </View>;
}

const dressPreferences: MetadataOption[] = [{ key: "menswear", label: "Menswear" }, { key: "womenswear", label: "Womenswear" }, { key: "flexible", label: "Flexible" }];
const builds: MetadataOption[] = [{ key: "slim", label: "Slim" }, { key: "average", label: "Average" }, { key: "athletic", label: "Athletic" }, { key: "broad", label: "Broad" }];
const ages: MetadataOption[] = [{ key: "18_24", label: "18–24" }, { key: "25_34", label: "25–34" }, { key: "35_44", label: "35–44" }, { key: "45_plus", label: "45+" }];

function StyleProfileEditor({ metadata, onCancel, onSave, profile }: { metadata: ReturnType<typeof useAppData>["metadata"]; onCancel: () => void; onSave: (input: Parameters<ReturnType<typeof useAppData>["saveStyleProfile"]>[0]) => Promise<void>; profile: StyleProfile }) {
  const saved = profile.additional_preferences || {};
  const [stylesSelected, setStylesSelected] = useState(profile.preferred_styles);
  const [colorsSelected, setColorsSelected] = useState(profile.preferred_colors);
  const [avoidedSelected, setAvoidedSelected] = useState(profile.disliked_colors);
  const [fits, setFits] = useState(profile.fit_preferences);
  const [gender, setGender] = useState(typeof saved.gender_preference === "string" ? saved.gender_preference : "");
  const [height, setHeight] = useState(typeof saved.height_cm === "number" ? String(saved.height_cm) : "");
  const [build, setBuild] = useState(typeof saved.build === "string" ? saved.build : "");
  const [age, setAge] = useState(typeof saved.age_range === "string" ? saved.age_range : "");
  const [notes, setNotes] = useState(typeof saved.notes === "string" ? saved.notes : "");
  const [anyStyle, setAnyStyle] = useState(saved.any_style_preference === true);
  const [anyColor, setAnyColor] = useState(saved.any_color_preference === true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const heightValue = height ? Number(height) : null;
    if (heightValue !== null && (heightValue < 80 || heightValue > 250)) { setError("Enter a height between 80 and 250 cm."); return; }
    setIsSaving(true); setError(null);
    try {
      await onSave({ preferred_styles: anyStyle ? [] : stylesSelected, preferred_colors: anyColor ? [] : colorsSelected, disliked_colors: avoidedSelected, fit_preferences: fits, additional_preferences: { ...saved, gender_preference: gender || null, height_cm: heightValue, build: build || null, age_range: age || null, notes: notes.trim() || null, any_style_preference: anyStyle, any_color_preference: anyColor }, onboarding_completed: profile.onboarding_completed });
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Style profile could not be updated."); }
    finally { setIsSaving(false); }
  }

  const styleOptions = metadata?.style_profile.preferred_styles || [];
  const colorOptions = metadata?.style_profile.preferred_colors || [];
  const avoidedOptions = metadata?.style_profile.disliked_colors || [];
  return <View style={styles.styleEditor}>
    <View><Text style={styles.styleProfileTitle}>Edit style profile</Text><Text style={styles.styleProfileSubtitle}>These preferences shape future recommendations.</Text></View>
    <EditorSection number="01" subtitle="Basic details that improve proportions and fit." title="Personal fit">
      <EditChoiceGroup label="Styling preference" options={dressPreferences} selected={[gender]} onSelect={setGender} />
      <View style={styles.row}><View style={styles.field}><Text style={styles.label}>Height (cm)</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setHeight(value.replace(/\D/g, "").slice(0, 3))} placeholder="175" placeholderTextColor={colors.textSoft} style={styles.input} value={height} /></View><EditChoiceGroup compact label="Build" options={builds} selected={[build]} onSelect={setBuild} /></View>
      <EditChoiceGroup label="Age range" options={ages} selected={[age]} onSelect={setAge} />
    </EditorSection>
    <EditorSection number="02" subtitle="Choose up to four directions that feel like you." title="Style direction">
      <View style={styles.sectionControlRow}><PreferenceToggle label="Open to any style" onPress={() => { setAnyStyle((value) => !value); setStylesSelected([]); }} selected={anyStyle} />{!anyStyle ? <Text style={styles.selectionCount}>{stylesSelected.length}/4 selected</Text> : null}</View>
      {!anyStyle ? <EditChoiceGroup label="Preferred styles" multiple options={styleOptions} selected={stylesSelected} onSelect={(key) => setStylesSelected((current) => current.includes(key) ? current.filter((value) => value !== key) : current.length < 4 ? [...current, key] : current)} /> : <Text style={styles.sectionEmpty}>WEARO can recommend across every style.</Text>}
    </EditorSection>
    <EditorSection number="03" subtitle="Select colors you enjoy and any you prefer not to wear." title="Color palette">
      <PreferenceToggle label="Open to any color" onPress={() => { setAnyColor((value) => !value); setColorsSelected([]); }} selected={anyColor} />
      {!anyColor ? <ColorChoiceGroup label="Preferred colors" onSelect={(key) => setColorsSelected((current) => toggle(current, key))} options={colorOptions} selected={colorsSelected} /> : <Text style={styles.sectionEmpty}>No preferred color restrictions.</Text>}
      <ColorChoiceGroup label="Colors to avoid" onSelect={(key) => setAvoidedSelected((current) => toggle(current, key))} options={avoidedOptions} selected={avoidedSelected} />
    </EditorSection>
    <EditorSection number="04" subtitle="Tell WEARO how you like garments to sit and any extra rules." title="Fit and details">
      <View style={styles.fitGrid}>{Object.entries(metadata?.style_profile.fit_preferences || {}).map(([category, options]) => <EditChoiceGroup key={category} label={`${readable(category)} fit`} options={options} selected={[fits[category] || ""]} onSelect={(key) => setFits((current) => ({ ...current, [category]: key }))} />)}</View>
      <View style={styles.field}><Text style={styles.label}>Additional preferences</Text><TextInput maxLength={500} multiline onChangeText={setNotes} placeholder="For example: no large logos" placeholderTextColor={colors.textSoft} style={[styles.input, styles.notesInput]} value={notes} /><Text style={styles.notesCount}>{notes.length}/500</Text></View>
    </EditorSection>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}><Button disabled={isSaving} onPress={onCancel} style={styles.action} title="Cancel" variant="secondary" /><Button loading={isSaving} onPress={() => void submit()} style={styles.action} title="Save style" /></View>
  </View>;
}

function EditorSection({ children, number, subtitle, title }: { children: React.ReactNode; number: string; subtitle: string; title: string }) { return <View style={styles.editorSection}><View style={styles.editorSectionHeader}><View style={styles.editorSectionNumber}><Text style={styles.editorSectionNumberText}>{number}</Text></View><View style={styles.editorSectionCopy}><Text style={styles.editorSectionTitle}>{title}</Text><Text style={styles.editorSectionSubtitle}>{subtitle}</Text></View></View><View style={styles.editorSectionBody}>{children}</View></View>; }

function EditChoiceGroup({ compact = false, label, multiple = false, onSelect, options, selected }: { compact?: boolean; label: string; multiple?: boolean; onSelect: (key: string) => void; options: MetadataOption[]; selected: string[] }) { return <View style={[styles.choiceGroup, compact && styles.choiceGroupCompact]}><Text style={styles.label}>{label}</Text><View style={styles.choiceList}>{options.map((option) => <Pressable accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={multiple ? { checked: selected.includes(option.key) } : { selected: selected.includes(option.key) }} key={option.key} onPress={() => onSelect(option.key)} style={[styles.choice, selected.includes(option.key) && styles.choiceSelected]}><Text style={[styles.choiceText, selected.includes(option.key) && styles.choiceTextSelected]}>{option.label}</Text></Pressable>)}</View></View>; }
function ColorChoiceGroup({ label, onSelect, options, selected }: { label: string; onSelect: (key: string) => void; options: MetadataOption[]; selected: string[] }) { return <View style={styles.choiceGroup}><Text style={styles.label}>{label}</Text><View style={styles.colorChoices}>{options.map((option) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(option.key) }} key={option.key} onPress={() => onSelect(option.key)} style={[styles.colorChoice, selected.includes(option.key) && styles.colorChoiceSelected]}><View style={[styles.colorSwatch, { backgroundColor: colorValue(option.key) }]}>{selected.includes(option.key) ? <Text style={[styles.colorCheck, lightColor(option.key) && styles.colorCheckDark]}>✓</Text> : null}</View><Text numberOfLines={1} style={[styles.colorChoiceText, selected.includes(option.key) && styles.choiceTextSelected]}>{option.label}</Text></Pressable>)}</View></View>; }
function PreferenceToggle({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) { return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.toggle, selected && styles.toggleSelected]}><View style={[styles.toggleCheck, selected && styles.toggleCheckSelected]}><Text style={styles.toggleCheckText}>{selected ? "✓" : ""}</Text></View><Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{label}</Text></Pressable>; }

function PreferenceSection({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return <View style={styles.preferenceSection}><Text style={styles.preferenceLabel}>{label}</Text><View style={styles.preferenceValues}>{values.length ? values.map((value) => <View key={value} style={styles.preferenceChip}><Text style={styles.preferenceChipText}>{value}</Text></View>) : <Text style={styles.preferenceEmpty}>{empty}</Text>}</View></View>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput autoCapitalize={label.includes("name") || label.includes("city") ? "words" : "none"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textSoft} style={styles.input} value={value} /></View>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
function formFromUser(user: ReturnType<typeof useAuth>["user"]): UpdateUserParams { return { first_name: user?.first_name || "", last_name: user?.last_name || "", preferred_city: user?.preferred_city || "", country_code: user?.country_code || inferDeviceCountryCode(), timezone: deviceTimezone }; }
function titleize(value: string) { return value.trim().split(/\s+/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" "); }
function titleizeLocation(value: string) { return value.split(/([\s'-]+)/).map((part) => /^[\s'-]+$/.test(part) ? part : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`).join(""); }
function labelsFor(keys: string[], options: Array<{ key: string; label: string }>) { return keys.map((key) => options.find((option) => option.key === key)?.label || readable(key)); }
function readable(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function ageLabel(value: string) { return value === "45_plus" ? "45+" : value.replace("_", "–"); }
function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function lightColor(key: string) { return ["white", "beige", "yellow", "neon"].includes(key); }
function colorValue(key: string) { return ({ black: "#242424", white: "#FFFFFF", gray: "#A4A4A4", navy: "#202A55", blue: "#4479C4", brown: "#87654A", beige: "#DED0B8", green: "#5B7F63", red: "#B94A55", pink: "#D99CB3", purple: "#7761B5", orange: "#D47D42", yellow: "#D6B745", neon: "#B6F23A" } as Record<string, string>)[key] || "#D8D4E0"; }

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.lg, padding: spacing.xl }, header: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" }, headerCopy: { gap: spacing.xxs }, title: { ...typography.display, color: colors.text }, name: { ...typography.subheading, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, details: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg }, detailRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" }, detailLabel: { ...typography.caption, color: colors.textMuted }, detailValue: { ...typography.caption, color: colors.text, flex: 1, fontWeight: "800", textAlign: "right" },
  profileImageSection: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg }, profileImageRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, profileImage: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, height: 160, width: 120 }, profileImagePlaceholder: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radius.md, borderStyle: "dashed", borderWidth: 1, height: 160, justifyContent: "center", width: 120 }, profileImagePlaceholderText: { ...typography.caption, color: colors.textSoft }, profileImageActions: { alignItems: "flex-start", gap: spacing.sm }, removeImage: { ...typography.caption, color: colors.error, padding: spacing.xs },
  styleProfile: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.lg, paddingTop: spacing.lg }, styleProfileHeader: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" }, styleProfileHeading: { flex: 1, minWidth: 220 }, styleProfileHeaderActions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, styleProfileTitle: { ...typography.heading, color: colors.text }, styleProfileSubtitle: { ...typography.caption, color: colors.textMuted, fontWeight: "500", marginTop: 2 }, profileStatus: { backgroundColor: "#FFF5DF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, profileStatusComplete: { backgroundColor: "#E8F7EF" }, profileStatusText: { ...typography.caption, color: colors.warning }, profileStatusTextComplete: { color: colors.success }, preferenceSection: { gap: spacing.xs }, preferenceLabel: { ...typography.caption, color: colors.textMuted }, preferenceValues: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, preferenceChip: { backgroundColor: "#F0EEFF", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, preferenceChipText: { ...typography.caption, color: colors.primary }, preferenceEmpty: { ...typography.body, color: colors.textSoft },
  form: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.lg, paddingTop: spacing.lg }, styleEditor: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xl, paddingTop: spacing.lg }, editorSection: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: "hidden" }, editorSectionHeader: { alignItems: "center", backgroundColor: colors.surfaceMuted, flexDirection: "row", gap: spacing.sm, padding: spacing.md }, editorSectionNumber: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 34, justifyContent: "center", width: 34 }, editorSectionNumberText: { ...typography.caption, color: colors.primary }, editorSectionCopy: { flex: 1, gap: 2 }, editorSectionTitle: { ...typography.subheading, color: colors.text }, editorSectionSubtitle: { ...typography.caption, color: colors.textMuted, fontWeight: "500" }, editorSectionBody: { gap: spacing.lg, padding: spacing.lg }, sectionControlRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" }, selectionCount: { ...typography.caption, color: colors.primary }, sectionEmpty: { ...typography.body, color: colors.textSoft }, fitGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, field: { flex: 1, gap: spacing.xs, minWidth: 220, position: "relative" }, countryFieldOpen: { zIndex: 20 }, label: { ...typography.caption, color: colors.textMuted }, input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 48, outlineStyle: "none", paddingHorizontal: spacing.md } as never, notesInput: { minHeight: 100, paddingVertical: spacing.md, textAlignVertical: "top" }, notesCount: { ...typography.caption, color: colors.textSoft, textAlign: "right" }, choiceGroup: { flex: 1, gap: spacing.xs, minWidth: 220 }, choiceGroupCompact: { minWidth: 220 }, choiceList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, choice: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.md }, choiceSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, choiceText: { ...typography.caption, color: colors.textMuted }, choiceTextSelected: { color: colors.primary }, colorChoices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, colorChoice: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, minWidth: 78, padding: spacing.xs }, colorChoiceSelected: { backgroundColor: "#F7F5FF", borderColor: colors.primary }, colorSwatch: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 32, justifyContent: "center", width: 32 }, colorCheck: { color: colors.surface, fontSize: 14, fontWeight: "900" }, colorCheckDark: { color: colors.text }, colorChoiceText: { ...typography.caption, color: colors.textMuted, fontSize: 11 }, toggle: { alignItems: "center", alignSelf: "flex-start", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md }, toggleSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, toggleCheck: { alignItems: "center", borderColor: colors.textSoft, borderRadius: 4, borderWidth: 1, height: 18, justifyContent: "center", width: 18 }, toggleCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, toggleCheckText: { color: colors.surface, fontSize: 12, fontWeight: "800" }, toggleText: { ...typography.caption, color: colors.textMuted }, toggleTextSelected: { color: colors.primary }, selectInput: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, selectInputOpen: { borderColor: colors.primary }, selectValue: { ...typography.body, color: colors.text, flex: 1 }, selectArrow: { color: colors.primary, fontSize: 20 }, countryMenu: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, left: 0, overflow: "hidden", position: "absolute", right: 0, shadowColor: colors.shadow, shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.16, shadowRadius: 18, top: 76, zIndex: 30 }, countrySearch: { ...typography.body, borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.text, minHeight: 46, outlineStyle: "none", paddingHorizontal: spacing.md } as never, countryList: { maxHeight: 220 }, countryOption: { alignItems: "center", backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", minHeight: 44, paddingHorizontal: spacing.md }, countryOptionSelected: { backgroundColor: "#EFECFF" }, countryOptionText: { ...typography.body, color: colors.text, flex: 1 }, countryOptionTextSelected: { color: colors.primary, fontWeight: "700" }, countryCode: { ...typography.caption, color: colors.textSoft }, noCountries: { ...typography.body, color: colors.textMuted, padding: spacing.md, textAlign: "center" }, readOnlyInput: { backgroundColor: colors.surfaceMuted, justifyContent: "center", paddingVertical: spacing.xs }, readOnlyValue: { ...typography.body, color: colors.text }, detectedLabel: { ...typography.caption, color: colors.textSoft, fontSize: 10 }, actions: { flexDirection: "row", gap: spacing.sm }, action: { flex: 1 }, error: { ...typography.caption, color: colors.error }, saved: { ...typography.caption, color: colors.success }
});
