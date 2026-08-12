import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock3, Home, Shirt, Sparkles, UserRound, WandSparkles } from "lucide-react-native";

import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { WearoResponsiveLogo, WearoWebLogo } from "../components/WearoLogo";
import { AskWearoScreen } from "../screens/AskWearoScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { OutfitsScreen } from "../screens/OutfitsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { WardrobeScreen } from "../screens/WardrobeScreen";
import type { AppScreen, Navigate, NavigationOptions, NavItem } from "./types";
import { desktopNavItems, mobileNavItems } from "./types";

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>("home");
  const [askRequest, setAskRequest] = useState<{ id: number; prompt: string; autoSend: boolean } | null>(null);
  const [wardrobeItemRequest, setWardrobeItemRequest] = useState<{ id: number; clothingItemId: number | string } | null>(null);
  const { usesSidebar } = useResponsive();

  const navigate: Navigate = (screen, options) => {
    if (screen === "ask") {
      setAskRequest(options?.prompt ? { id: Date.now(), prompt: options.prompt, autoSend: options.autoSend === true } : null);
    }
    if (screen === "wardrobe") setWardrobeItemRequest(options?.clothingItemId != null ? { id: Date.now(), clothingItemId: options.clothingItemId } : null);
    setActiveScreen(screen);
  };
  const screen = useMemo(() => renderScreen(activeScreen, navigate, askRequest, wardrobeItemRequest), [activeScreen, askRequest, wardrobeItemRequest]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        {usesSidebar ? <Sidebar activeScreen={activeScreen} onSelect={navigate} /> : null}
        <View style={styles.content}>
          {!usesSidebar ? (
            <View style={styles.mobileHeader}>
              <WearoResponsiveLogo compact />
            </View>
          ) : null}
          {screen}
        </View>
        {!usesSidebar ? <BottomNav activeScreen={activeScreen} onSelect={navigate} /> : null}
      </View>
    </SafeAreaView>
  );
}

function renderScreen(activeScreen: AppScreen, navigate: Navigate, askRequest: { id: number; prompt: string; autoSend: boolean } | null, wardrobeItemRequest: { id: number; clothingItemId: number | string } | null): ReactNode {
  switch (activeScreen) {
    case "wardrobe":
      return <WardrobeScreen initialItemRequest={wardrobeItemRequest} onNavigate={navigate} />;
    case "ask":
      return <AskWearoScreen initialRequest={askRequest} onNavigate={navigate} />;
    case "outfits":
      return <OutfitsScreen onNavigate={navigate} />;
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
  if (screen === "ask") return <Sparkles {...props} />;
  if (screen === "outfits") return <WandSparkles {...props} />;
  if (screen === "history") return <Clock3 {...props} />;
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
    minHeight: 76,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    gap: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    width: 244
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
    borderRadius: radius.xl,
    bottom: spacing.md,
    flexDirection: "row",
    gap: 2,
    justifyContent: "space-between",
    left: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: spacing.md
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
