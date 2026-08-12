import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppService } from "../api/AppService";
import { WearoResponsiveLogo } from "../components/WearoLogo";
import { colors, radius, spacing, typography } from "../theme";

export type LegalPage = "terms" | "privacy";

type Section = {
  title: string;
  paragraphs: string[];
};

const termsSections: Section[] = [
  {
    title: "1. Using WEARO",
    paragraphs: [
      "WEARO is a personal styling service that helps you organize clothing, describe styling needs, and receive outfit suggestions. You must be at least 18 years old and able to enter into these terms to use the service.",
      "You are responsible for the accuracy of your account information, for keeping your credentials secure, and for activity performed through your account."
    ]
  },
  {
    title: "2. AI styling suggestions",
    paragraphs: [
      "WEARO uses automated systems to analyze the preferences, prompts, wardrobe information, and images you choose to provide. Suggestions may be incomplete or unsuitable for a particular event, climate, dress code, or safety requirement.",
      "You remain responsible for deciding whether a recommendation is appropriate. WEARO does not provide medical, professional, or safety advice."
    ]
  },
  {
    title: "3. Your content",
    paragraphs: [
      "You retain ownership of the photos, prompts, feedback, and other content you submit. You give WEARO permission to process that content only as needed to operate, secure, improve, and personalize the service in accordance with the Privacy Policy.",
      "Only upload content you own or are authorized to use. Do not upload unlawful, harmful, abusive, or privacy-infringing material."
    ]
  },
  {
    title: "4. Acceptable use",
    paragraphs: [
      "Do not misuse the service, attempt unauthorized access, interfere with its operation, reverse engineer protected systems, or use WEARO to violate another person's rights or applicable law."
    ]
  },
  {
    title: "5. Availability and account closure",
    paragraphs: [
      "The service may change, be interrupted, or be discontinued. We may restrict or terminate access when these terms are violated or when necessary to protect WEARO and its users.",
      "You may delete your account from your profile. Account deletion permanently removes account data subject to limited retention required for security, legal compliance, or dispute resolution."
    ]
  },
  {
    title: "6. Disclaimers and responsibility",
    paragraphs: [
      "WEARO is provided on an as-available basis. To the extent permitted by law, we do not guarantee uninterrupted operation or that every recommendation, generated description, or visualization will be accurate.",
      "Nothing in these terms limits rights or remedies that cannot legally be limited under applicable consumer law."
    ]
  },
  {
    title: "7. Changes and contact",
    paragraphs: [
      "We may update these terms as WEARO develops. When acceptance is required, the app will present the updated version before you continue using affected features.",
      "Questions about these terms can be sent to support@wearo.app."
    ]
  }
];

const privacySections: Section[] = [
  {
    title: "1. Information you provide",
    paragraphs: [
      "WEARO collects account and profile details such as your name, email address, city, country, timezone, styling preferences, and consent records. It also stores the wardrobe photos, optional full-body image, prompts, outfit feedback, and planning information you choose to add."
    ]
  },
  {
    title: "2. How we use information",
    paragraphs: [
      "We use your information to authenticate your account, maintain your wardrobe, personalize outfit recommendations, create requested visualizations, remember feedback, provide weather-aware context, secure the service, and respond to support requests.",
      "AI processing is used only after the required consent is recorded. Explicit preferences remain separate from preferences inferred from your feedback."
    ]
  },
  {
    title: "3. Images and AI processing",
    paragraphs: [
      "Wardrobe and profile images are private account media and require authenticated access. A full-body image is optional and requires separate consent before upload.",
      "When you request an AI feature, relevant prompts, preferences, wardrobe data, or images may be processed by configured service providers solely to provide that feature."
    ]
  },
  {
    title: "4. Sharing and service providers",
    paragraphs: [
      "We do not sell your personal information. We may share only the information needed with infrastructure, storage, email, weather, security, and AI providers that help operate WEARO, or when disclosure is required by law."
    ]
  },
  {
    title: "5. Retention and security",
    paragraphs: [
      "We keep information while your account is active and as needed to provide the service. You can remove wardrobe items and profile images or delete your account. Limited records may be retained where required for security, legal compliance, or dispute resolution.",
      "We use access controls and authenticated media delivery to protect account information. No internet service can guarantee absolute security."
    ]
  },
  {
    title: "6. Your choices and rights",
    paragraphs: [
      "You can review and update profile and style information, remove your full-body image, download an export of your data, or permanently delete your account from the Profile screen.",
      "Depending on where you live, you may also have legal rights to access, correct, erase, restrict, or object to certain processing. Contact us to exercise a right that is not available directly in the app."
    ]
  },
  {
    title: "7. Age, changes, and contact",
    paragraphs: [
      "WEARO is intended for adults and is not directed to people under 18. We may update this policy as the service changes and will request renewed acceptance when required.",
      "Privacy questions and requests can be sent to privacy@wearo.app."
    ]
  }
];

export function LegalScreen({ onBack, page }: { onBack: () => void; page: LegalPage }) {
  const [version, setVersion] = useState("2026-08-12");
  const isTerms = page === "terms";
  const sections = isTerms ? termsSections : privacySections;

  useEffect(() => {
    void AppService.metadata()
      .then((response) => setVersion(isTerms ? response.data.legal.terms.version : response.data.legal.privacy.version))
      .catch(() => undefined);
  }, [isTerms]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <WearoResponsiveLogo compact />
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={20} />
          <Text style={styles.backLabel}>Back to WEARO</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.document}>
          <Text style={styles.eyebrow}>WEARO LEGAL</Text>
          <Text style={styles.title}>{isTerms ? "Terms of Service" : "Privacy Policy"}</Text>
          <Text style={styles.updated}>Effective date: {formatDate(version)}</Text>
          <Text style={styles.intro}>
            {isTerms
              ? "These terms explain the rules for using WEARO and its AI-powered personal styling features."
              : "This policy explains what information WEARO handles, why it is used, and the choices available to you."}
          </Text>
          <View style={styles.rule} />
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(version: string) {
  const date = new Date(`${version}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? version : new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 76, paddingHorizontal: spacing.xl },
  backButton: { alignItems: "center", borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", gap: spacing.sm, minHeight: 42, paddingHorizontal: spacing.md },
  backLabel: { ...typography.caption, color: colors.text, fontWeight: "700" },
  scroll: { alignItems: "center", padding: spacing.xl, paddingBottom: 64 },
  document: { maxWidth: 820, width: "100%" },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: "800", marginBottom: spacing.sm },
  title: { ...typography.display, color: colors.text, fontSize: 42 },
  updated: { ...typography.caption, color: colors.textSoft, marginTop: spacing.sm },
  intro: { ...typography.body, color: colors.textMuted, fontSize: 18, lineHeight: 28, marginTop: spacing.xl, maxWidth: 700 },
  rule: { backgroundColor: colors.border, height: 1, marginVertical: spacing.xl },
  section: { gap: spacing.sm, marginBottom: spacing.xl },
  sectionTitle: { ...typography.heading, color: colors.text, fontSize: 22 },
  body: { ...typography.body, color: colors.textMuted, lineHeight: 25 }
});
