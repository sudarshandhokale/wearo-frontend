import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CalendarClock, Check, ChevronLeft, Edit3, Plus, Sparkles, Trash2 } from "lucide-react-native";

import { AppService } from "../api/AppService";
import type { AppMetadata, MetadataOption, Outfit, RoutineOccurrence, StylingRoutine, StylingRoutineDraft, StylingRoutineInput } from "../api/types";
import { Button } from "./Button";
import { OutfitCover } from "./OutfitCover";
import { OutfitDetail } from "./OutfitDetail";
import { colors, radius, shadows, spacing, typography } from "../theme";

type Mode = "list" | "edit" | "drafts" | "outfit";
type RoutineMetadata = NonNullable<AppMetadata["routines"]>;

const DAYS = [
  { key: 1, label: "Mon" }, { key: 2, label: "Tue" }, { key: 3, label: "Wed" },
  { key: 4, label: "Thu" }, { key: 5, label: "Fri" }, { key: 6, label: "Sat" }, { key: 7, label: "Sun" }
];

const emptyRoutine: StylingRoutineInput = {
  name: "", routine_type: "", days_of_week: [], local_time: "08:00", usage: "",
  city_mode: "profile", city: null, outfit_strategy: "separate",
  recommendation_lead_minutes: defaultLeadTime("08:00"), reminder_enabled: false, active: true
};

export function StylingRoutines({ metadata, roles }: { metadata?: RoutineMetadata; roles: MetadataOption[] }) {
  const [mode, setMode] = useState<Mode>("list");
  const [routines, setRoutines] = useState<StylingRoutine[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [prompt, setPrompt] = useState("");
  const [drafts, setDrafts] = useState<StylingRoutineInput[]>([]);
  const [form, setForm] = useState<StylingRoutineInput>(emptyRoutine);
  const [editingId, setEditingId] = useState<StylingRoutine["id"] | null>(null);
  const [editingDraft, setEditingDraft] = useState<number | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StylingRoutine["id"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [routineResponse, occurrenceResponse] = await Promise.all([AppService.stylingRoutines(), AppService.routineOccurrences()]);
      setRoutines(routineResponse.data);
      setOccurrences(occurrenceResponse.data);
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!occurrences.some((item) => item.status === "queued" || item.status === "generating")) return;
    const timeout = setTimeout(() => void load(), 4000);
    return () => clearTimeout(timeout);
  }, [load, occurrences]);

  const today = useMemo(() => occurrences.filter((item) => sameLocalDay(item.scheduled_for, new Date())), [occurrences]);
  const upcoming = useMemo(() => occurrences.filter((item) => !sameLocalDay(item.scheduled_for, new Date())), [occurrences]);

  async function parseDrafts() {
    if (!prompt.trim()) { setError("Describe at least one recurring activity."); return; }
    setSubmitting(true); setError(null);
    try {
      const response = await AppService.stylingRoutineDrafts(prompt.trim());
      const raw = Array.isArray(response.data) ? response.data : response.data.drafts;
      const normalized = (raw || []).map(normalizeDraft);
      if (!normalized.length) throw new Error("No routines were found. Try including days and a time.");
      setDrafts(normalized); setMode("drafts");
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setSubmitting(false); }
  }

  function startNew() { setEditingId(null); setEditingDraft(null); setForm(defaultFromMetadata(metadata)); setError(null); setMode("edit"); }
  function startEdit(routine: StylingRoutine) { setEditingId(routine.id); setEditingDraft(null); setForm(toInput(routine)); setError(null); setMode("edit"); }
  function editDraft(index: number) { setEditingId(null); setEditingDraft(index); setForm(drafts[index] || emptyRoutine); setError(null); setMode("edit"); }

  async function saveForm() {
    const validation = validate(form);
    if (validation) { setError(validation); return; }
    if (editingDraft != null) {
      setDrafts((current) => current.map((item, index) => index === editingDraft ? clean(form) : item));
      setEditingDraft(null); setMode("drafts"); return;
    }
    setSubmitting(true); setError(null);
    try {
      const response = editingId == null ? await AppService.createStylingRoutine(clean(form)) : await AppService.updateStylingRoutine(editingId, clean(form));
      setRoutines((current) => editingId == null ? [response.data, ...current] : current.map((item) => item.id === editingId ? response.data : item));
      setMode("list"); await load();
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setSubmitting(false); }
  }

  async function saveDrafts() {
    const invalid = drafts.map(validate).find(Boolean);
    if (invalid) { setError(invalid); return; }
    setSubmitting(true); setError(null);
    try {
      const saved: StylingRoutine[] = [];
      for (const draft of drafts) saved.push((await AppService.createStylingRoutine(clean(draft))).data);
      setRoutines((current) => [...saved, ...current]); setDrafts([]); setPrompt(""); setMode("list"); await load();
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setSubmitting(false); }
  }

  async function removeRoutine(id: StylingRoutine["id"]) {
    setSubmitting(true); setError(null);
    try { await AppService.deleteStylingRoutine(id); setRoutines((current) => current.filter((item) => item.id !== id)); setConfirmDelete(null); }
    catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setSubmitting(false); }
  }

  if (!metadata) return <View style={styles.empty}><CalendarClock color={colors.primary} size={30} /><Text style={styles.emptyTitle}>Routine options are unavailable</Text><Text style={styles.muted}>Refresh after the backend metadata update is available.</Text></View>;
  if (mode === "outfit" && selectedOutfit) return <View style={styles.stack}><Back title="Back to routines" onPress={() => { setSelectedOutfit(null); setMode("list"); }} /><OutfitDetail initialOutfit={selectedOutfit} onChange={setSelectedOutfit} roles={roles} /></View>;
  if (mode === "edit") return <View style={styles.stack}><Back title={editingDraft != null ? "Edit draft" : editingId == null ? "New routine" : "Edit routine"} onPress={() => setMode(editingDraft != null ? "drafts" : "list")} /><RoutineEditor form={form} metadata={metadata} onChange={setForm} />{error ? <ErrorBanner message={error} /> : null}<Button loading={submitting} onPress={() => void saveForm()} title={editingDraft != null ? "Update draft" : "Save routine"} /></View>;
  if (mode === "drafts") return <View style={styles.stack}><Back title="Review routine drafts" onPress={() => setMode("list")} /><Text style={styles.muted}>Confirm the details before saving. Each accepted routine is created separately.</Text>{drafts.map((draft, index) => <View key={`${draft.name}-${index}`} style={styles.routineRow}><View style={styles.rowIcon}><CalendarClock color={colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{draft.name}</Text><Text style={styles.muted}>{summary(draft, metadata)}</Text></View><Pressable accessibilityLabel={`Edit ${draft.name}`} onPress={() => editDraft(index)} style={styles.iconButton}><Edit3 color={colors.textMuted} size={18} /></Pressable><Pressable accessibilityLabel={`Remove ${draft.name}`} onPress={() => setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.iconButton}><Trash2 color={colors.error} size={18} /></Pressable></View>)}{error ? <ErrorBanner message={error} /> : null}<Button disabled={!drafts.length} loading={submitting} onPress={() => void saveDrafts()} title={`Save ${drafts.length} ${drafts.length === 1 ? "routine" : "routines"}`} /></View>;

  return <View style={styles.stack}>
    <View style={styles.headingRow}><View style={styles.headingCopy}><Text style={styles.heading}>Recurring routines</Text><Text style={styles.muted}>Weather-aware outfit ideas prepared before your regular activities.</Text></View><Button onPress={startNew} style={styles.newButton} title="Add routine" /></View>
    <View style={styles.promptPanel}><View style={styles.promptHeading}><View style={styles.spark}><Sparkles color={colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.panelTitle}>Describe your week</Text><Text style={styles.muted}>For example: Office weekdays at 8:30 and gym Tuesday and Thursday at 18:00.</Text></View></View><TextInput multiline onChangeText={setPrompt} placeholder="Describe recurring activities, days, and times..." placeholderTextColor={colors.textSoft} style={styles.promptInput} value={prompt} /><Button loading={submitting} onPress={() => void parseDrafts()} title="Create editable drafts" /></View>
    {error ? <ErrorBanner message={error} /> : null}
    {today.length ? <OccurrenceSection items={today} onOpen={(outfit) => { setSelectedOutfit(outfit); setMode("outfit"); }} title="Today" /> : null}
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Loading routines</Text></View> : null}
    {!loading && routines.length ? <View style={styles.section}><Text style={styles.sectionTitle}>Saved routines</Text>{routines.map((routine) => <View key={routine.id} style={styles.routineRow}><View style={[styles.rowIcon, !routine.active && styles.inactive]}>{routine.active ? <Check color={colors.primary} size={19} /> : <CalendarClock color={colors.textSoft} size={19} />}</View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{routine.name}</Text><Text style={styles.muted}>{summary(routine, metadata)}</Text>{routine.outfit_strategy === "combine_with_next" ? <Text style={styles.strategy}>Can combine with the next routine within 4 hours</Text> : null}</View>{confirmDelete === routine.id ? <View style={styles.confirm}><Pressable onPress={() => setConfirmDelete(null)}><Text style={styles.cancel}>Cancel</Text></Pressable><Pressable disabled={submitting} onPress={() => void removeRoutine(routine.id)}><Text style={styles.delete}>Delete</Text></Pressable></View> : <><Pressable accessibilityLabel={`Edit ${routine.name}`} onPress={() => startEdit(routine)} style={styles.iconButton}><Edit3 color={colors.textMuted} size={18} /></Pressable><Pressable accessibilityLabel={`Delete ${routine.name}`} onPress={() => setConfirmDelete(routine.id)} style={styles.iconButton}><Trash2 color={colors.error} size={18} /></Pressable></>}</View>)}</View> : null}
    {!loading && !routines.length ? <View style={styles.empty}><CalendarClock color={colors.primary} size={30} /><Text style={styles.emptyTitle}>No routines yet</Text><Text style={styles.muted}>Add your regular activities and WEARO will prepare outfits around your schedule and weather.</Text></View> : null}
    {upcoming.length ? <OccurrenceSection items={upcoming} onOpen={(outfit) => { setSelectedOutfit(outfit); setMode("outfit"); }} title="Next 7 days" /> : null}
  </View>;
}

export function RoutineDraftReview({ drafts: initialDrafts, message, metadata, onCancel, onSaved }: { drafts: StylingRoutineDraft[]; message: string; metadata?: RoutineMetadata; onCancel: () => void; onSaved: () => void }) {
  const [drafts, setDrafts] = useState<StylingRoutineInput[]>(() => initialDrafts.map(normalizeDraft));
  const [editingDraft, setEditingDraft] = useState<number | null>(null);
  const [form, setForm] = useState<StylingRoutineInput>(() => initialDrafts[0] ? normalizeDraft(initialDrafts[0]) : defaultFromMetadata(metadata));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!metadata) return <View style={styles.empty}><CalendarClock color={colors.primary} size={30} /><Text style={styles.emptyTitle}>Routine options are unavailable</Text><Text style={styles.muted}>Refresh after routine metadata is available.</Text></View>;

  function edit(index: number) { setForm(drafts[index] || defaultFromMetadata(metadata)); setEditingDraft(index); setError(null); }
  function updateDraft() {
    const validation = validate(form);
    if (validation) { setError(validation); return; }
    setDrafts((current) => current.map((draft, index) => index === editingDraft ? clean(form) : draft));
    setEditingDraft(null); setError(null);
  }
  async function save() {
    const invalid = drafts.map(validate).find(Boolean);
    if (invalid) { setError(invalid); return; }
    setSubmitting(true); setError(null);
    try {
      for (const draft of drafts) {
        await AppService.createStylingRoutine(clean(draft));
        setDrafts((current) => current.slice(1));
      }
      onSaved();
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setSubmitting(false); }
  }

  if (editingDraft != null) return <View style={styles.stack}><Back title="Edit routine draft" onPress={() => setEditingDraft(null)} /><RoutineEditor form={form} metadata={metadata} onChange={setForm} />{error ? <ErrorBanner message={error} /> : null}<Button onPress={updateDraft} title="Update draft" /></View>;

  return <View style={styles.stack}><Back title="Review recurring activities" onPress={onCancel} /><View style={styles.promptPanel}><View style={styles.promptHeading}><View style={styles.spark}><Sparkles color={colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.panelTitle}>WEARO found a routine</Text><Text style={styles.muted}>{message}</Text></View></View></View>{drafts.map((draft, index) => <View key={`${draft.name}-${index}`} style={styles.routineRow}><View style={styles.rowIcon}><CalendarClock color={colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{draft.name}</Text><Text style={styles.muted}>{summary(draft, metadata)}</Text><Text style={styles.strategy}>Prepared {leadTimeLabel(draft.recommendation_lead_minutes)} before</Text></View><Pressable accessibilityLabel={`Edit ${draft.name}`} onPress={() => edit(index)} style={styles.iconButton}><Edit3 color={colors.textMuted} size={18} /></Pressable><Pressable accessibilityLabel={`Remove ${draft.name}`} onPress={() => setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index))} style={styles.iconButton}><Trash2 color={colors.error} size={18} /></Pressable></View>)}{error ? <ErrorBanner message={error} /> : null}<View style={styles.columns}><Button onPress={onCancel} style={styles.flex} title="Cancel" variant="secondary" /><Button disabled={!drafts.length} loading={submitting} onPress={() => void save()} style={styles.flex} title={`Save ${drafts.length} ${drafts.length === 1 ? "routine" : "routines"}`} /></View><Text style={styles.muted}>Nothing is saved until you confirm.</Text></View>;
}

function RoutineEditor({ form, metadata, onChange }: { form: StylingRoutineInput; metadata: RoutineMetadata; onChange: (value: StylingRoutineInput) => void }) {
  const set = <K extends keyof StylingRoutineInput>(key: K, value: StylingRoutineInput[K]) => onChange({ ...form, [key]: value });
  return <View style={styles.editor}>
    <Field label="Routine name" value={form.name} placeholder="Morning walk" onChange={(value) => set("name", titleCase(value))} />
    <Choice label="Activity" options={metadata.types} selected={form.routine_type} onSelect={(value) => set("routine_type", value)} />
    <Choice label="Wardrobe use" options={metadata.usages} selected={form.usage} onSelect={(value) => set("usage", value)} />
    <View style={styles.field}><Text style={styles.label}>Days</Text><View style={styles.chips}>{DAYS.map((day) => <Chip key={day.key} label={day.label} selected={form.days_of_week.includes(day.key)} onPress={() => set("days_of_week", toggleNumber(form.days_of_week, day.key))} />)}</View></View>
    <View style={styles.columns}><View style={styles.flex}><Field label="Local time" value={form.local_time} placeholder="08:30" onChange={(value) => set("local_time", value.replace(/[^0-9:]/g, "").slice(0, 5))} /></View><View style={styles.flex}><Field label="Lead time (minutes)" value={String(form.recommendation_lead_minutes)} placeholder="60" onChange={(value) => set("recommendation_lead_minutes", Number(value.replace(/\D/g, "")) || 0)} /></View></View>
    <Choice label="City" options={metadata.city_modes} selected={form.city_mode} onSelect={(value) => set("city_mode", value)} />
    {form.city_mode === "fixed" ? <Field label="Fixed city" value={form.city || ""} placeholder="Berlin" onChange={(value) => set("city", titleCase(value))} /> : null}
    <Choice label="Outfit strategy" options={metadata.outfit_strategies} selected={form.outfit_strategy} onSelect={(value) => set("outfit_strategy", value)} />
    <Toggle checked={form.active} label="Active" onPress={() => set("active", !form.active)} />
    <Toggle checked={form.reminder_enabled} label="Reminder enabled" note="Saved now; device push delivery is not available yet." onPress={() => set("reminder_enabled", !form.reminder_enabled)} />
  </View>;
}

function OccurrenceSection({ items, title, onOpen }: { items: RoutineOccurrence[]; title: string; onOpen: (outfit: Outfit) => void }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.occurrenceGrid}>{items.map((item) => <Pressable disabled={!item.outfit} key={item.id} onPress={() => item.outfit && onOpen(item.outfit)} style={styles.occurrence}><View style={styles.occurrenceCover}>{item.outfit ? <OutfitCover coverImages={item.outfit.cover_images} style={styles.cover} /> : <CalendarClock color={colors.primary} size={28} />}</View><View style={styles.occurrenceCopy}><Text style={styles.rowTitle}>{item.routine?.name || "Routine"}</Text><Text style={styles.time}>{formatSchedule(item.scheduled_for)}</Text><Text style={[styles.status, item.status === "failed" && styles.failed]}>{item.status_label || humanize(item.status)}</Text>{item.failure_message ? <Text style={styles.failure}>{item.failure_message}</Text> : null}</View></Pressable>)}</View></View>;
}

function Back({ title, onPress }: { title: string; onPress: () => void }) { return <View style={styles.backRow}><Pressable accessibilityLabel="Go back" onPress={onPress} style={styles.iconButton}><ChevronLeft color={colors.text} size={22} /></Pressable><Text style={styles.heading}>{title}</Text></View>; }
function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textSoft} style={styles.input} value={value} /></View>; }
function Choice({ label, options, selected, onSelect }: { label: string; options: MetadataOption[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.chips}>{options.map((option) => <Chip key={option.key} label={option.label} selected={selected === option.key} onPress={() => onSelect(option.key)} />)}</View></View>; }
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>; }
function Toggle({ checked, label, note, onPress }: { checked: boolean; label: string; note?: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.toggle}><View style={[styles.checkbox, checked && styles.checkboxActive]}>{checked ? <Check color="#FFFFFF" size={15} /> : null}</View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{label}</Text>{note ? <Text style={styles.muted}>{note}</Text> : null}</View></Pressable>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View>; }

function defaultFromMetadata(metadata?: RoutineMetadata): StylingRoutineInput { return { ...emptyRoutine, routine_type: metadata?.types[0]?.key || "", usage: metadata?.usages[0]?.key || "", city_mode: metadata?.city_modes[0]?.key || "profile", outfit_strategy: metadata?.outfit_strategies[0]?.key || "separate" }; }
function normalizeDraft(draft: StylingRoutineDraft): StylingRoutineInput { return { ...emptyRoutine, ...draft, days_of_week: draft.days_of_week || [], city: draft.city || null, recommendation_lead_minutes: draft.recommendation_lead_minutes ?? defaultLeadTime(draft.local_time), reminder_enabled: draft.reminder_enabled ?? false, active: draft.active ?? true }; }
function toInput(routine: StylingRoutine): StylingRoutineInput { const { name, routine_type, days_of_week, local_time, usage, city_mode, city, outfit_strategy, recommendation_lead_minutes, reminder_enabled, active } = routine; return { name, routine_type, days_of_week, local_time, usage, city_mode, city, outfit_strategy, recommendation_lead_minutes, reminder_enabled, active }; }
function clean(value: StylingRoutineInput): StylingRoutineInput { return { ...value, name: value.name.trim(), city: value.city_mode === "fixed" ? titleCase(value.city?.trim() || "") : null, days_of_week: [...value.days_of_week].sort() }; }
function validate(value: StylingRoutineInput) { if (!value.name.trim()) return "Add a routine name."; if (!value.routine_type || !value.usage) return "Choose an activity and wardrobe use."; if (!value.days_of_week.length) return "Choose at least one day."; if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.local_time)) return "Enter time in 24-hour HH:MM format."; if (value.recommendation_lead_minutes < 1) return "Lead time must be at least 1 minute."; if (value.city_mode === "fixed" && !value.city?.trim()) return "Add a city for a fixed-city routine."; return null; }
function summary(value: StylingRoutineInput | StylingRoutine, metadata: RoutineMetadata) { const days = "day_labels" in value && value.day_labels?.length ? value.day_labels.join(", ") : value.days_of_week.map((day) => DAYS.find((item) => item.key === day)?.label).filter(Boolean).join(", "); const activity = "routine_type_label" in value && value.routine_type_label ? value.routine_type_label : labelFor(metadata.types, value.routine_type); return `${activity} · ${days || "No days"} · ${value.local_time}${value.city_mode === "fixed" && value.city ? ` · ${value.city}` : ""}`; }
function labelFor(options: MetadataOption[], key: string) { return options.find((option) => option.key === key)?.label || humanize(key); }
function toggleNumber(values: number[], value: number) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function titleCase(value: string) { return value.replace(/(^|[\s-])\p{L}/gu, (match) => match.toUpperCase()); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function sameLocalDay(value: string, date: Date) { const parsed = new Date(value); return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth() && parsed.getDate() === date.getDate(); }
function formatSchedule(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(parsed); }
function defaultLeadTime(localTime?: string) { const [hour = 8, minute = 0] = (localTime || "08:00").split(":").map(Number); return hour < 12 ? (hour * 60 + minute) + 240 : 60; }
function leadTimeLabel(minutes: number) { if (minutes < 60) return `${minutes} minutes`; const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return remainder ? `${hours}h ${remainder}m` : `${hours} ${hours === 1 ? "hour" : "hours"}`; }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  stack: { gap: spacing.xl }, headingRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" }, headingCopy: { flex: 1, gap: spacing.xs, minWidth: 240 }, heading: { ...typography.heading, color: colors.text }, muted: { ...typography.caption, color: colors.textMuted, fontWeight: "500" }, newButton: { minWidth: 130 }, promptPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }, promptHeading: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, spark: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.md, height: 42, justifyContent: "center", width: 42 }, panelTitle: { ...typography.subheading, color: colors.text }, promptInput: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 92, outlineStyle: "none", padding: spacing.md, textAlignVertical: "top" } as never,
  section: { gap: spacing.md }, sectionTitle: { ...typography.subheading, color: colors.text }, routineRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.md }, rowIcon: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 40, justifyContent: "center", width: 40 }, inactive: { backgroundColor: colors.surfaceMuted }, rowCopy: { flex: 1, gap: spacing.xxs }, rowTitle: { ...typography.button, color: colors.text }, strategy: { ...typography.caption, color: colors.primary, fontWeight: "500" }, iconButton: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 40, justifyContent: "center", width: 40 }, confirm: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, cancel: { ...typography.caption, color: colors.textMuted }, delete: { ...typography.caption, color: colors.error }, editor: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, padding: spacing.xl }, field: { gap: spacing.xs }, label: { ...typography.caption, color: colors.textMuted }, input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 48, outlineStyle: "none", paddingHorizontal: spacing.md } as never, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, chip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center", minHeight: 38, paddingHorizontal: spacing.md }, chipSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, chipText: { ...typography.caption, color: colors.textMuted }, chipTextSelected: { color: colors.primary }, columns: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, flex: { flex: 1, minWidth: 180 }, toggle: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, checkbox: { alignItems: "center", borderColor: colors.border, borderRadius: 5, borderWidth: 1, height: 23, justifyContent: "center", width: 23 }, checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary }, backRow: { alignItems: "center", flexDirection: "row", gap: spacing.md }, occurrenceGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, occurrence: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: "row", minWidth: 280, overflow: "hidden", width: "48%" }, occurrenceCover: { alignItems: "center", backgroundColor: "#F2F0FA", height: 118, justifyContent: "center", width: 118 }, cover: { height: "100%", width: "100%" }, occurrenceCopy: { flex: 1, gap: spacing.xxs, justifyContent: "center", padding: spacing.sm }, time: { ...typography.caption, color: colors.textMuted }, status: { ...typography.caption, color: colors.success }, failed: { color: colors.error }, failure: { ...typography.caption, color: colors.error, fontWeight: "500" }, empty: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl }, emptyTitle: { ...typography.subheading, color: colors.text }, loading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "center", padding: spacing.lg }, error: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }
});
