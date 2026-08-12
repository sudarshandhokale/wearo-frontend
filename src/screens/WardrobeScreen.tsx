import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppService, PickedImage, resolveImageUrl } from "../api/AppService";
import type { ClothingItem, ClothingItemInput, MetadataOption } from "../api/types";
import { useAppData } from "../context/AppDataContext";
import { Button } from "../components/Button";
import { PhotoGuide } from "../components/PhotoGuide";
import { ScreenContainer } from "../components/ScreenContainer";
import { useResponsive } from "../hooks/useResponsive";
import { copy } from "../localization/en";
import type { AppScreen } from "../navigation/types";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { pickWardrobeImage, pickWardrobeImages } from "../utils/imagePicker";

type ViewMode = "list" | "form" | "detail";
const initialInput: ClothingItemInput = { name: "", garment_type: "", category: "", subcategory: "", primary_color: "", secondary_colors: [], pattern: "", material: "", season_tags: [], occasion_tags: [], style_tags: [], cultural_tags: [], formality_score: "" };

export function WardrobeScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  void onNavigate;
  const { metadata } = useAppData();
  const { wardrobeColumns } = useResponsive();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [mode, setMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<ClothingItem | null>(null);
  const [form, setForm] = useState<ClothingItemInput>(initialInput);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AppService.clothingItems({ page: nextPage, perPage: 24, category: categoryFilter, status: statusFilter, primaryColor: colorFilter });
      setItems((current) => append ? [...current, ...response.data] : response.data);
      setPage(nextPage);
      setHasMore(Boolean(response.meta?.next_page));
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, colorFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (mode !== "detail" || !selected || selected.status !== "processing") return;

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled || attempts >= 30) return;
      attempts += 1;
      try {
        const response = await AppService.clothingItem(selected.id);
        if (cancelled) return;
        setSelected(response.data);
        setItems((current) => current.map((item) => item.id === response.data.id ? response.data : item));
        if (response.data.status === "processing") timeout = setTimeout(poll, 4000);
      } catch (caughtError) {
        if (!cancelled) {
          setError(messageFor(caughtError));
          timeout = setTimeout(poll, 4000);
        }
      }
    };
    let timeout = setTimeout(poll, 4000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [mode, selected?.id, selected?.status]);

  const categories = metadata?.clothing_items.categories || [];
  const statusOptions = metadata?.clothing_items.statuses || [];
  const selectedCategory = categories.find((category) => category.key === form.category);

  function startAdd() {
    setSelected(null); setForm(initialInput); setImage(null); setError(null); setMode("form");
  }

  function startEdit(item: ClothingItem) {
    setSelected(item); setForm(inputFromItem(item)); setImage(null); setError(null); setMode("form");
  }

  async function chooseImage(source: "camera" | "gallery") {
    try { setError(null); setImage(await pickWardrobeImage(source)); } catch (caughtError) { setError(messageFor(caughtError)); }
  }

  async function addImages(source: "camera" | "gallery") {
    setIsSubmitting(true); setError(null);
    try {
      const images = await pickWardrobeImages(source, source === "gallery");
      if (!images.length) return;
      const created: ClothingItem[] = [];
      for (const pickedImage of images) {
        const response = await AppService.createClothingItem(initialInput, pickedImage);
        created.push(response.data);
      }
      setItems((current) => [...created.reverse(), ...current]);
      if (created.length === 1) {
        setSelected(created[0] || null);
        setMode("detail");
      } else {
        setMode("list");
      }
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setIsSubmitting(false); }
  }

  async function submit() {
    if (!form.category && !image && !selected?.image) { setError("Choose a category or add an image before saving this item."); return; }
    if (form.subcategory && !selectedCategory?.subcategories.some((option) => option.key === form.subcategory)) { setError("Choose a valid subcategory."); return; }
    setIsSubmitting(true); setError(null);
    try {
      const response = selected
        ? await AppService.updateClothingItem(selected.id, form, image)
        : await AppService.createClothingItem(form, image);
      setItems((current) => selected ? current.map((item) => item.id === response.data.id ? response.data : item) : [response.data, ...current]);
      setSelected(response.data); setMode("detail");
    } catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setIsSubmitting(false); }
  }

  async function remove() {
    if (!selected) return;
    setIsSubmitting(true); setError(null);
    try { await AppService.deleteClothingItem(selected.id); setItems((current) => current.filter((item) => item.id !== selected.id)); setSelected(null); setConfirmDelete(false); setMode("list"); }
    catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setIsSubmitting(false); }
  }

  async function reanalyze() {
    if (!selected) return;
    setIsSubmitting(true); setError(null);
    try { const response = await AppService.reanalyzeClothingItem(selected.id); setSelected(response.data); setItems((current) => current.map((item) => item.id === response.data.id ? response.data : item)); }
    catch (caughtError) { setError(messageFor(caughtError)); }
    finally { setIsSubmitting(false); }
  }

  if (mode === "form") {
    if (!selected) {
      return <QuickAdd error={error} isSubmitting={isSubmitting} onBack={() => setMode("list")} onCamera={() => void addImages("camera")} onGallery={() => void addImages("gallery")} />;
    }
    return <ItemForm categories={categories} error={error} form={form} image={image} isSubmitting={isSubmitting} onBack={() => setMode(selected ? "detail" : "list")} onChange={setForm} onImage={chooseImage} onSubmit={submit} seasons={metadata?.style_profile.seasons || []} occasions={metadata?.style_profile.occasions || []} styles={metadata?.style_profile.preferred_styles || []} selectedCategory={selectedCategory} title={selected ? "Edit item" : "Add clothes"} />;
  }

  if (mode === "detail" && selected) {
    return <ItemDetail confirmDelete={confirmDelete} error={error} isSubmitting={isSubmitting} item={selected} metadata={metadata} onBack={() => { setConfirmDelete(false); setMode("list"); }} onDelete={() => setConfirmDelete(true)} onDeleteCancel={() => setConfirmDelete(false)} onDeleteConfirm={remove} onEdit={() => startEdit(selected)} onReanalyze={reanalyze} />;
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.title}>My Wardrobe</Text><Text style={styles.subtitle}>Your clothes, organized and ready to style.</Text></View>
        <Button onPress={startAdd} style={styles.addButton} title="Add clothes" />
      </View>
      <View style={styles.filters}>
        <FilterGroup label="Category" options={categories} selected={categoryFilter} onSelect={setCategoryFilter} />
        <FilterGroup label="Status" options={statusOptions} selected={statusFilter} onSelect={setStatusFilter} />
        <View style={styles.colorFilter}><Text style={styles.filterLabel}>Color</Text><TextInput onChangeText={setColorFilter} onSubmitEditing={() => void load()} placeholder="e.g. navy" placeholderTextColor={colors.textSoft} style={styles.filterInput} value={colorFilter} /></View>
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      {isLoading && !items.length ? <Loading label="Loading your wardrobe" /> : null}
      {!isLoading && !items.length ? <EmptyWardrobe onAdd={startAdd} /> : null}
      {items.length ? <View style={styles.itemGrid}>{items.map((item) => <ItemCard columns={wardrobeColumns} item={item} key={item.id} statuses={statusOptions} onPress={() => { setSelected(item); setMode("detail"); }} />)}</View> : null}
      {hasMore ? <Button loading={isLoading} onPress={() => void load(page + 1, true)} style={styles.loadMore} title="Load more" variant="secondary" /> : null}
    </ScreenContainer>
  );
}

function QuickAdd(props: { error: string | null; isSubmitting: boolean; onBack: () => void; onCamera: () => void; onGallery: () => void }) {
  return <ScreenContainer>
    <View style={styles.subHeader}><BackButton onPress={props.onBack} /><View style={styles.headerCopy}><Text style={styles.title}>Add clothes</Text><Text style={styles.subtitle}>Add clear photos of individual clothing items. WEARO will identify the details automatically.</Text></View></View>
    <View style={styles.quickAddLayout}>
      <View style={styles.quickAddPanel}>
        <View style={styles.quickAddMark}><Text style={styles.quickAddMarkText}>+</Text></View>
        <Text style={styles.quickAddTitle}>Add clothing photos</Text>
        <Text style={styles.quickAddText}>One clothing item per photo gives WEARO the clearest result.</Text>
        <PhotoGuide />
        <View style={styles.quickAddActions}>
          <Button disabled={props.isSubmitting} onPress={props.onCamera} style={styles.quickAddButton} title="Take photo" variant="secondary" />
          <Button disabled={props.isSubmitting} onPress={props.onGallery} style={styles.quickAddButton} title="Choose from gallery" />
        </View>
        <Text style={styles.quickAddHint}>Gallery supports up to 10 photos at once.</Text>
        {props.isSubmitting ? <View style={styles.uploadingRow}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Adding clothing and starting analysis…</Text></View> : null}
        {props.error ? <ErrorBanner message={props.error} /> : null}
      </View>
    </View>
  </ScreenContainer>;
}

function ItemForm(props: { title: string; form: ClothingItemInput; image: PickedImage | null; categories: Array<MetadataOption & { subcategories: MetadataOption[] }>; selectedCategory?: MetadataOption & { subcategories: MetadataOption[] }; seasons: MetadataOption[]; occasions: MetadataOption[]; styles: MetadataOption[]; error: string | null; isSubmitting: boolean; onChange: (form: ClothingItemInput) => void; onImage: (source: "camera" | "gallery") => void; onSubmit: () => void; onBack: () => void }) {
  const update = <K extends keyof ClothingItemInput>(key: K, value: ClothingItemInput[K]) => props.onChange({ ...props.form, [key]: value });
  return <ScreenContainer>
    <View style={styles.subHeader}><BackButton onPress={props.onBack} /><View><Text style={styles.title}>{props.title}</Text><Text style={styles.subtitle}>Add a clear image and WEARO will identify the clothing details.</Text></View></View>
    <View style={styles.formLayout}>
      <View style={styles.imagePanel}>
        {props.image ? <Image source={{ uri: props.image.uri }} style={styles.previewImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderMark}>+</Text><Text style={styles.imagePlaceholderText}>Add a clear photo of one item</Text></View>}
        <View style={styles.imageActions}><Button onPress={() => props.onImage("camera")} style={styles.flexButton} title="Take photo" variant="secondary" /><Button onPress={() => props.onImage("gallery")} style={styles.flexButton} title="Gallery" variant="secondary" /></View>
      </View>
      <View style={styles.formCard}>
        <Field label="Item name" onChange={(value) => update("name", value)} placeholder="Navy textured polo" value={props.form.name} />
        <Field label="Garment type" onChange={(value) => update("garment_type", value)} placeholder="Huipil, saree, polo shirt…" value={props.form.garment_type} />
        <OptionField label="Category" options={props.categories} selected={props.form.category} onSelect={(value) => props.onChange({ ...props.form, category: value, subcategory: "" })} />
        {props.form.category ? <OptionField label="Subcategory" options={props.selectedCategory?.subcategories || []} selected={props.form.subcategory} onSelect={(value) => update("subcategory", value)} /> : null}
        <View style={styles.twoColumns}><View style={styles.flex}><Field label="Primary color" onChange={(value) => update("primary_color", value)} placeholder="navy" value={props.form.primary_color} /></View><View style={styles.flex}><Field label="Pattern" onChange={(value) => update("pattern", value)} placeholder="solid" value={props.form.pattern} /></View></View>
        <View style={styles.twoColumns}><View style={styles.flex}><Field label="Material" onChange={(value) => update("material", value)} placeholder="cotton" value={props.form.material} /></View><View style={styles.flex}><Field keyboardType="number-pad" label="Formality (1–10)" onChange={(value) => update("formality_score", value.replace(/\D/g, "").slice(0, 2))} placeholder="3" value={props.form.formality_score} /></View></View>
        <MultiOptionField label="Seasons" options={props.seasons} selected={props.form.season_tags} onSelect={(value) => update("season_tags", toggle(props.form.season_tags, value))} />
        <MultiOptionField label="Occasions" options={props.occasions} selected={props.form.occasion_tags} onSelect={(value) => update("occasion_tags", toggle(props.form.occasion_tags, value))} />
        <MultiOptionField label="Style tags" options={props.styles} selected={props.form.style_tags} onSelect={(value) => update("style_tags", toggle(props.form.style_tags, value))} />
        <TagField label="Cultural tags" onChange={(values) => update("cultural_tags", values)} placeholder="maya traditional, guatemalan" values={props.form.cultural_tags} />
        {props.error ? <ErrorBanner message={props.error} /> : null}
        <Button loading={props.isSubmitting} onPress={props.onSubmit} title="Save item" />
      </View>
    </View>
  </ScreenContainer>;
}

function ItemDetail(props: { item: ClothingItem; metadata: ReturnType<typeof useAppData>["metadata"]; error: string | null; isSubmitting: boolean; confirmDelete: boolean; onBack: () => void; onEdit: () => void; onDelete: () => void; onDeleteCancel: () => void; onDeleteConfirm: () => void; onReanalyze: () => void }) {
  const url = resolveImageUrl(props.item.image?.url);
  return <ScreenContainer>
    <View style={styles.subHeader}><BackButton onPress={props.onBack} /><View style={styles.headerCopy}><Text style={styles.title}>{props.item.name || "Untitled item"}</Text><StatusBadge status={props.item.status} statuses={props.metadata?.clothing_items.statuses || []} /></View></View>
    <View style={styles.detailLayout}>
      <View style={styles.detailImageFrame}>{url ? <Image source={{ uri: url }} style={styles.detailImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>No image</Text></View>}</View>
      <View style={styles.detailCard}>
        <Text style={styles.detailSectionTitle}>Item details</Text>
        <View style={styles.detailGrid}><Detail label="Garment type" value={props.item.garment_type} /><Detail label="Category" value={labelFor(props.metadata?.clothing_items.categories || [], props.item.category)} /><Detail label="Subcategory" value={subcategoryLabel(props.metadata?.clothing_items.categories || [], props.item.subcategory)} /><Detail label="Color" value={props.item.primary_color} /><Detail label="Pattern" value={props.item.pattern} /><Detail label="Material" value={props.item.material} /><Detail label="Formality" value={props.item.formality_score ? `${props.item.formality_score}/10` : null} /><Detail label="Cultural tags" value={props.item.cultural_tags.map(humanize).join(", ")} /></View>
        {props.item.status === "processing" ? <Notice loading title={copy.clothing.processingTitle} text={copy.clothing.processingText} /> : null}
        {props.item.status === "analysis_failed" ? <Notice title={copy.clothing.failedTitle} text={copy.clothing.failedText} tone="error" /> : null}
        {props.error ? <ErrorBanner message={props.error} /> : null}
        {props.confirmDelete ? <View style={styles.confirmBox}><Text style={styles.confirmTitle}>Remove this item?</Text><Text style={styles.confirmText}>It will be removed from your active wardrobe.</Text><View style={styles.imageActions}><Button onPress={props.onDeleteCancel} style={styles.flexButton} title="Cancel" variant="secondary" /><Button loading={props.isSubmitting} onPress={props.onDeleteConfirm} style={styles.flexButton} title="Remove" /></View></View> : <View style={styles.detailActions}><Button onPress={props.onEdit} style={styles.flexButton} title={copy.clothing.edit} />{props.item.status !== "processing" ? <Button loading={props.isSubmitting} onPress={props.onReanalyze} style={styles.flexButton} title={copy.clothing.reanalyze} variant="secondary" /> : null}<Pressable onPress={props.onDelete}><Text style={styles.deleteText}>Remove item</Text></Pressable></View>}
      </View>
    </View>
  </ScreenContainer>;
}

function ItemCard({ item, columns, statuses, onPress }: { item: ClothingItem; columns: number; statuses: MetadataOption[]; onPress: () => void }) {
  const url = resolveImageUrl(item.image?.url);
  return <Pressable onPress={onPress} style={[styles.itemCard, { width: columns <= 2 ? "47%" : `${Math.floor(100 / columns) - 2}%` }]}>{url ? <Image source={{ uri: url }} style={styles.itemImage} /> : <View style={styles.itemImagePlaceholder}><Text style={styles.itemImagePlaceholderText}>W</Text></View>}<View style={styles.itemCopy}><StatusBadge compact status={item.status} statuses={statuses} /><Text numberOfLines={1} style={styles.itemName}>{item.name || item.garment_type || item.subcategory || "Clothing item"}</Text><Text numberOfLines={1} style={styles.itemMeta}>{[item.garment_type, item.primary_color, item.category].filter(Boolean).join(" · ") || "Details pending"}</Text></View></Pressable>;
}

function EmptyWardrobe({ onAdd }: { onAdd: () => void }) { return <View style={styles.emptyState}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>W</Text></View><Text style={styles.emptyTitle}>Build your wardrobe</Text><Text style={styles.emptyText}>Add a few pieces and WEARO will have the ingredients for your first outfit.</Text><Button onPress={onAdd} style={styles.emptyButton} title="Add your first item" /></View>; }
function FilterGroup({ label, options, selected, onSelect }: { label: string; options: MetadataOption[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.filterGroup}><Text style={styles.filterLabel}>{label}</Text><View style={styles.chips}><Chip label="All" selected={!selected} onPress={() => onSelect("")} />{options.map((option) => <Chip key={option.key} label={option.label} selected={selected === option.key} onPress={() => onSelect(option.key)} />)}</View></View>; }
function OptionField({ label, options, selected, onSelect }: { label: string; options: MetadataOption[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.chips}>{options.map((option) => <Chip key={option.key} label={option.label} selected={selected === option.key} onPress={() => onSelect(option.key)} />)}</View></View>; }
function MultiOptionField({ label, options, selected, onSelect }: { label: string; options: MetadataOption[]; selected: string[]; onSelect: (value: string) => void }) { return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.chips}>{options.map((option) => <Chip key={option.key} label={option.label} selected={selected.includes(option.key)} onPress={() => onSelect(option.key)} />)}</View></View>; }
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>; }
function Field({ label, value, placeholder, onChange, keyboardType = "default" }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; keyboardType?: "default" | "number-pad" }) { return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><TextInput keyboardType={keyboardType} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textSoft} style={styles.input} value={value} /></View>; }
function TagField({ label, values, placeholder, onChange }: { label: string; values: string[]; placeholder: string; onChange: (values: string[]) => void }) { const [text, setText] = useState(values.map(humanize).join(", ")); return <Field label={label} onChange={(value) => { setText(value); onChange(value.split(",").map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean)); }} placeholder={placeholder} value={text} />; }
function BackButton({ onPress }: { onPress: () => void }) { return <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onPress} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>; }
function StatusBadge({ status, statuses, compact = false }: { status: ClothingItem["status"]; statuses: MetadataOption[]; compact?: boolean }) { const tone = status === "ready" ? colors.success : status === "analysis_failed" ? colors.error : status === "processing" ? colors.warning : colors.info; return <View style={[styles.statusBadge, compact && styles.statusBadgeCompact, { backgroundColor: `${tone}18` }]}><View style={[styles.statusDot, { backgroundColor: tone }]} /><Text style={[styles.statusText, { color: tone }]}>{labelFor(statuses, status) || status.replace("_", " ")}</Text></View>; }
function Detail({ label, value }: { label: string; value: string | null | undefined }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value || "Not set"}</Text></View>; }
function Notice({ title, text, tone = "info", loading = false }: { title: string; text: string; tone?: "info" | "error"; loading?: boolean }) { return <View style={[styles.notice, tone === "error" && styles.noticeError]}>{loading ? <ActivityIndicator color={colors.primary} /> : null}<View style={styles.noticeCopy}><Text style={styles.noticeTitle}>{title}</Text><Text style={styles.noticeText}>{text}</Text></View></View>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.errorBanner}><Text style={styles.errorText}>{message}</Text></View>; }
function Loading({ label }: { label: string }) { return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>{label}</Text></View>; }
function inputFromItem(item: ClothingItem): ClothingItemInput { return { name: item.name || "", garment_type: item.garment_type || "", category: item.category || "", subcategory: item.subcategory || "", primary_color: item.primary_color || "", secondary_colors: item.secondary_colors || [], pattern: item.pattern || "", material: item.material || "", season_tags: item.season_tags || [], occasion_tags: item.occasion_tags || [], style_tags: item.style_tags || [], cultural_tags: item.cultural_tags || [], formality_score: item.formality_score ? String(item.formality_score) : "" }; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function labelFor(options: MetadataOption[], key?: string | null) { return options.find((option) => option.key === key)?.label || key || ""; }
function subcategoryLabel(categories: Array<MetadataOption & { subcategories: MetadataOption[] }>, key?: string | null) { return categories.flatMap((category) => category.subcategories).find((option) => option.key === key)?.label || key || ""; }
function messageFor(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }

const styles = StyleSheet.create({
  headerRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", marginBottom: spacing.xl }, headerCopy: { flex: 1, gap: spacing.xs }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, addButton: { minWidth: 130 },
  filters: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, marginBottom: spacing.xl, padding: spacing.lg }, filterGroup: { gap: spacing.xs }, filterLabel: { ...typography.caption, color: colors.textMuted }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, chip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, minHeight: 36, justifyContent: "center", paddingHorizontal: spacing.md }, chipSelected: { backgroundColor: "#EFECFF", borderColor: colors.primary }, chipText: { ...typography.caption, color: colors.textMuted }, chipTextSelected: { color: colors.primary }, colorFilter: { gap: spacing.xs }, filterInput: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 44, outlineStyle: "none", paddingHorizontal: spacing.md } as never,
  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, itemCard: { ...shadows.soft, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden" }, itemImage: { aspectRatio: 0.9, width: "100%" }, itemImagePlaceholder: { alignItems: "center", aspectRatio: 0.9, backgroundColor: "#F0EDFF", justifyContent: "center", width: "100%" }, itemImagePlaceholderText: { color: colors.primary, fontSize: 44, fontWeight: "900" }, itemCopy: { gap: spacing.xxs, padding: spacing.sm }, itemName: { ...typography.button, color: colors.text }, itemMeta: { ...typography.caption, color: colors.textMuted, fontWeight: "500", textTransform: "capitalize" },
  emptyState: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.xxxl }, emptyMark: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 72, justifyContent: "center", width: 72 }, emptyMarkText: { color: colors.primary, fontSize: 34, fontWeight: "900" }, emptyTitle: { ...typography.heading, color: colors.text }, emptyText: { ...typography.body, color: colors.textMuted, maxWidth: 440, textAlign: "center" }, emptyButton: { marginTop: spacing.sm, minWidth: 190 },
  subHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }, backButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, backText: { color: colors.text, fontSize: 34, lineHeight: 36 }, formLayout: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }, imagePanel: { flex: 1, gap: spacing.sm, minWidth: 260 }, imagePlaceholder: { alignItems: "center", aspectRatio: 1, backgroundColor: "#F2F0F7", borderColor: colors.border, borderRadius: radius.lg, borderStyle: "dashed", borderWidth: 1, gap: spacing.sm, justifyContent: "center" }, imagePlaceholderMark: { color: colors.primary, fontSize: 48, fontWeight: "300" }, imagePlaceholderText: { ...typography.body, color: colors.textMuted, textAlign: "center" }, previewImage: { aspectRatio: 1, borderRadius: radius.lg, width: "100%" }, imageActions: { flexDirection: "row", gap: spacing.sm }, flexButton: { flex: 1 }, formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 1.4, gap: spacing.lg, minWidth: 300, padding: spacing.xl }, fieldGroup: { gap: spacing.xs }, fieldLabel: { ...typography.caption, color: colors.textMuted }, input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 48, outlineStyle: "none", paddingHorizontal: spacing.md } as never, twoColumns: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, flex: { flex: 1, minWidth: 150 },
  quickAddLayout: { alignItems: "center", justifyContent: "center", minHeight: 520 }, quickAddPanel: { ...shadows.card, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, maxWidth: 620, padding: spacing.xxxl, width: "100%" }, quickAddMark: { alignItems: "center", backgroundColor: "#EFECFF", borderRadius: radius.pill, height: 84, justifyContent: "center", width: 84 }, quickAddMarkText: { color: colors.primary, fontSize: 46, fontWeight: "300", lineHeight: 50 }, quickAddTitle: { ...typography.heading, color: colors.text, textAlign: "center" }, quickAddText: { ...typography.body, color: colors.textMuted, maxWidth: 440, textAlign: "center" }, quickAddActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", marginTop: spacing.sm, width: "100%" }, quickAddButton: { flexGrow: 1, minWidth: 190 }, quickAddHint: { ...typography.caption, color: colors.textSoft, fontWeight: "500", textAlign: "center" }, uploadingRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  detailLayout: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }, detailImageFrame: { aspectRatio: 0.9, flex: 1, minWidth: 280, overflow: "hidden" }, detailImage: { borderRadius: radius.lg, height: "100%", width: "100%" }, detailCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flex: 1, gap: spacing.lg, minWidth: 300, padding: spacing.xl }, detailSectionTitle: { ...typography.heading, color: colors.text }, detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, detail: { gap: spacing.xxs, width: "46%" }, detailLabel: { ...typography.caption, color: colors.textMuted }, detailValue: { ...typography.body, color: colors.text, textTransform: "capitalize" }, detailActions: { gap: spacing.sm }, deleteText: { ...typography.button, color: colors.error, padding: spacing.sm, textAlign: "center" },
  statusBadge: { alignItems: "center", alignSelf: "flex-start", borderRadius: radius.pill, flexDirection: "row", gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, statusBadgeCompact: { paddingHorizontal: spacing.xs, paddingVertical: 3 }, statusDot: { borderRadius: radius.pill, height: 7, width: 7 }, statusText: { ...typography.caption, textTransform: "capitalize" }, notice: { alignItems: "center", backgroundColor: "#EEF3FF", borderRadius: radius.md, flexDirection: "row", gap: spacing.sm, padding: spacing.md }, noticeCopy: { flex: 1, gap: spacing.xxs }, noticeError: { backgroundColor: "#FFF0ED" }, noticeTitle: { ...typography.button, color: colors.text }, noticeText: { ...typography.caption, color: colors.textMuted, fontWeight: "500" },
  confirmBox: { backgroundColor: "#FFF5F3", borderRadius: radius.md, gap: spacing.sm, padding: spacing.md }, confirmTitle: { ...typography.subheading, color: colors.text }, confirmText: { ...typography.body, color: colors.textMuted }, errorBanner: { backgroundColor: "#FFF0ED", borderRadius: radius.md, padding: spacing.md }, errorText: { ...typography.caption, color: colors.error }, loading: { alignItems: "center", gap: spacing.sm, padding: spacing.xxxl }, loadingText: { ...typography.body, color: colors.textMuted }, loadMore: { alignSelf: "center", marginTop: spacing.xl, minWidth: 160 }
});
