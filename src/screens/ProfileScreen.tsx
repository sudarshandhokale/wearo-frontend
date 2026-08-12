import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { UpdateUserParams } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppData } from "../context/AppDataContext";
import { colors, radius, spacing, typography } from "../theme";
import { deviceTimezone, inferDeviceCountryCode } from "../utils/deviceLocation";

export function ProfileScreen() {
  const { isSubmitting, logout, updateUser, user } = useAuth();
  const { metadata } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
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
          {!isEditing ? <Button onPress={() => setIsEditing(true)} title="Edit profile" variant="secondary" /> : null}
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
        ) : (
          <>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.details}>
              <Detail label="Preferred city" value={user?.preferred_city ? titleizeLocation(user.preferred_city) : "Not set"} />
              <Detail label="Country" value={countryName} />
              <Detail label="Timezone" value={user?.timezone || "Not set"} />
            </View>
            {saved ? <Text style={styles.saved}>Profile updated.</Text> : null}
            <Button onPress={logout} title="Logout" variant="secondary" />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput autoCapitalize={label.includes("name") || label.includes("city") ? "words" : "none"} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textSoft} style={styles.input} value={value} /></View>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
function formFromUser(user: ReturnType<typeof useAuth>["user"]): UpdateUserParams { return { first_name: user?.first_name || "", last_name: user?.last_name || "", preferred_city: user?.preferred_city || "", country_code: user?.country_code || inferDeviceCountryCode(), timezone: deviceTimezone }; }
function titleize(value: string) { return value.trim().split(/\s+/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" "); }
function titleizeLocation(value: string) { return value.split(/([\s'-]+)/).map((part) => /^[\s'-]+$/.test(part) ? part : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`).join(""); }

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.lg, padding: spacing.xl }, header: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" }, headerCopy: { gap: spacing.xxs }, title: { ...typography.display, color: colors.text }, name: { ...typography.subheading, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, details: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg }, detailRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" }, detailLabel: { ...typography.caption, color: colors.textMuted }, detailValue: { ...typography.caption, color: colors.text, flex: 1, fontWeight: "800", textAlign: "right" },
  form: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.lg, paddingTop: spacing.lg }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, field: { flex: 1, gap: spacing.xs, minWidth: 220, position: "relative" }, countryFieldOpen: { zIndex: 20 }, label: { ...typography.caption, color: colors.textMuted }, input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, minHeight: 48, outlineStyle: "none", paddingHorizontal: spacing.md } as never, selectInput: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, selectInputOpen: { borderColor: colors.primary }, selectValue: { ...typography.body, color: colors.text, flex: 1 }, selectArrow: { color: colors.primary, fontSize: 20 }, countryMenu: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, left: 0, overflow: "hidden", position: "absolute", right: 0, shadowColor: colors.shadow, shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.16, shadowRadius: 18, top: 76, zIndex: 30 }, countrySearch: { ...typography.body, borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.text, minHeight: 46, outlineStyle: "none", paddingHorizontal: spacing.md } as never, countryList: { maxHeight: 220 }, countryOption: { alignItems: "center", backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", minHeight: 44, paddingHorizontal: spacing.md }, countryOptionSelected: { backgroundColor: "#EFECFF" }, countryOptionText: { ...typography.body, color: colors.text, flex: 1 }, countryOptionTextSelected: { color: colors.primary, fontWeight: "700" }, countryCode: { ...typography.caption, color: colors.textSoft }, noCountries: { ...typography.body, color: colors.textMuted, padding: spacing.md, textAlign: "center" }, readOnlyInput: { backgroundColor: colors.surfaceMuted, justifyContent: "center", paddingVertical: spacing.xs }, readOnlyValue: { ...typography.body, color: colors.text }, detectedLabel: { ...typography.caption, color: colors.textSoft, fontSize: 10 }, actions: { flexDirection: "row", gap: spacing.sm }, action: { flex: 1 }, error: { ...typography.caption, color: colors.error }, saved: { ...typography.caption, color: colors.success }
});
