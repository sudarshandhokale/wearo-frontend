import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, Home, Shirt, Sparkles, UserRound } from "lucide-react-native";

import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { WearoMark, WearoResponsiveLogo, WearoWebLogo } from "../components/WearoLogo";
import { AskWearoScreen } from "../screens/AskWearoScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { OutfitsScreen } from "../screens/OutfitsScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { StyleScreen } from "../screens/StyleScreen";
import { WardrobeScreen } from "../screens/WardrobeScreen";
import type { AppScreen, Navigate, NavigationOptions, NavItem } from "./types";
import { desktopNavItems, mobileNavItems } from "./types";

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>("home");
  const [askRequest, setAskRequest] = useState<{ id: number; prompt?: string; autoSend: boolean; recommendationRequestId?: number | string } | null>(null);
  const [wardrobeItemRequest, setWardrobeItemRequest] = useState<{ id: number; clothingItemId: number | string } | null>(null);
  const [outfitRequest, setOutfitRequest] = useState<{ id: number; outfitId: number | string } | null>(null);
  const [styleSection, setStyleSection] = useState<"stylist" | "saved" | "past">("stylist");
  const [plansSection, setPlansSection] = useState<"plans" | "routines">("plans");
  const { usesSidebar } = useResponsive();

  const navigate: Navigate = (screen, options) => {
    const destination = screen === "ask" || screen === "outfits" || screen === "history" ? "style" : screen;
    if (screen === "ask" || screen === "style") {
      setAskRequest(options?.prompt || options?.recommendationRequestId != null ? { id: Date.now(), prompt: options.prompt, autoSend: options.autoSend === true, recommendationRequestId: options.recommendationRequestId } : null);
      setStyleSection(options?.styleSection || "stylist");
    }
    if (screen === "wardrobe") setWardrobeItemRequest(options?.clothingItemId != null ? { id: Date.now(), clothingItemId: options.clothingItemId } : null);
    if (screen === "outfits") { setOutfitRequest(options?.outfitId != null ? { id: Date.now(), outfitId: options.outfitId } : null); setStyleSection("saved"); }
    if (screen === "history") setStyleSection("past");
    if (screen === "plans") setPlansSection(options?.plansSection || "plans");
    setActiveScreen(destination);
  };
  const screen = useMemo(() => renderScreen(activeScreen, navigate, askRequest, wardrobeItemRequest, outfitRequest, styleSection, setStyleSection, plansSection, setPlansSection), [activeScreen, askRequest, wardrobeItemRequest, outfitRequest, plansSection, styleSection]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        {usesSidebar ? <Sidebar activeScreen={activeScreen} onSelect={navigate} /> : null}
        <View style={styles.content}>
          {!usesSidebar ? (
            <View style={[styles.mobileHeader, activeScreen !== "home" && styles.mobileHeaderCompact]}>
              {activeScreen === "home" ? <WearoResponsiveLogo compact /> : <WearoMark size="sm" />}
            </View>
          ) : null}
          {screen}
        </View>
        {!usesSidebar ? <BottomNav activeScreen={activeScreen} onSelect={navigate} /> : null}
      </View>
    </SafeAreaView>
  );
}

function renderScreen(activeScreen: AppScreen, navigate: Navigate, askRequest: { id: number; prompt?: string; autoSend: boolean; recommendationRequestId?: number | string } | null, wardrobeItemRequest: { id: number; clothingItemId: number | string } | null, outfitRequest: { id: number; outfitId: number | string } | null, styleSection: "stylist" | "saved" | "past", setStyleSection: (value: "stylist" | "saved" | "past") => void, plansSection: "plans" | "routines", setPlansSection: (value: "plans" | "routines") => void): ReactNode {
  switch (activeScreen) {
    case "wardrobe":
      return <WardrobeScreen initialItemRequest={wardrobeItemRequest} onNavigate={navigate} />;
    case "ask":
      return <AskWearoScreen initialRequest={askRequest} onNavigate={navigate} />;
    case "style":
      return <StyleScreen askRequest={askRequest} initialOutfitRequest={outfitRequest} onNavigate={navigate} onSectionChange={setStyleSection} section={styleSection} />;
    case "plans":
      return <PlansScreen onSectionChange={setPlansSection} section={plansSection} />;
    case "outfits":
      return <OutfitsScreen initialOutfitRequest={outfitRequest} onNavigate={navigate} />;
    case "history":
      return <HistoryScreen onNavigate={navigate} />;
    case "profile":
      return <ProfileScreen />;
    case "home":
    default:
      return <HomeScreen onNavigate={navigate} />;
  }
}

function Sidebar({
  activeScreen,
  onSelect
}: {
  activeScreen: AppScreen;
  onSelect: Navigate;
}) {
  return (
    <View style={styles.sidebar}>
      <WearoWebLogo compact />
      <View style={styles.sidebarNav}>
        {desktopNavItems.map((item) => (
          <NavButton
            active={activeScreen === item.key}
            item={item}
            key={item.key}
            mode="sidebar"
            onPress={() => onSelect(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

function BottomNav({
  activeScreen,
  onSelect
}: {
  activeScreen: AppScreen;
  onSelect: Navigate;
}) {
  return (
    <View style={styles.bottomNav}>
      {mobileNavItems.map((item) => (
        <NavButton
          active={activeScreen === item.key}
          item={item}
          key={item.key}
          mode="bottom"
          onPress={() => onSelect(item.key)}
        />
      ))}
    </View>
  );
}

function NavButton({
  active,
  item,
  mode,
  onPress
}: {
  active: boolean;
  item: NavItem;
  mode: "sidebar" | "bottom";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        mode === "sidebar" ? styles.sidebarButton : styles.bottomButton,
        active && (mode === "sidebar" ? styles.sidebarButtonActive : styles.bottomButtonActive),
        pressed && styles.pressed
      ]}
    >
      <NavIcon active={active} screen={item.key} />
      <Text
        numberOfLines={1}
        style={[
          mode === "sidebar" ? styles.sidebarLabel : styles.bottomLabel,
          active && styles.navLabelActive
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function NavIcon({ active, screen }: { active: boolean; screen: AppScreen }) {
  const props = { color: active ? colors.primary : colors.textSoft, size: 21, strokeWidth: active ? 2.5 : 2 };
  if (screen === "wardrobe") return <Shirt {...props} />;
  if (screen === "style") return <Sparkles {...props} />;
  if (screen === "plans") return <CalendarDays {...props} />;
  if (screen === "profile") return <UserRound {...props} />;
  return <Home {...props} />;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: "row"
  },
  content: {
    flex: 1
  },
  mobileHeader: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  mobileHeaderCompact: {
    minHeight: 46
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    gap: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    width: 228
  },
  sidebarNav: {
    gap: spacing.xs
  },
  sidebarButton: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  sidebarButtonActive: {
    backgroundColor: "#F0EEFF"
  },
  bottomNav: {
    ...shadows.card,
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: 2,
    justifyContent: "space-between",
    left: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: spacing.sm
  },
  bottomButton: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    minHeight: 56,
    minWidth: 0,
    justifyContent: "center"
  },
  bottomButtonActive: {
    backgroundColor: "#F5F3FF"
  },
  sidebarLabel: {
    ...typography.button,
    color: colors.textMuted
  },
  bottomLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9
  },
  navLabelActive: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.8
  }
});
