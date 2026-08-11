import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsive } from "../hooks/useResponsive";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { WearoLogo, WearoMark } from "../components/WearoLogo";
import { AskWearoScreen } from "../screens/AskWearoScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { OutfitsScreen } from "../screens/OutfitsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WardrobeScreen } from "../screens/WardrobeScreen";
import type { AppScreen, NavItem } from "./types";
import { desktopNavItems, mobileNavItems } from "./types";

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>("home");
  const { usesSidebar } = useResponsive();

  const screen = useMemo(() => renderScreen(activeScreen, setActiveScreen), [activeScreen]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        {usesSidebar ? <Sidebar activeScreen={activeScreen} onSelect={setActiveScreen} /> : null}
        <View style={styles.content}>{screen}</View>
        {!usesSidebar ? <BottomNav activeScreen={activeScreen} onSelect={setActiveScreen} /> : null}
      </View>
    </SafeAreaView>
  );
}

function renderScreen(activeScreen: AppScreen, setActiveScreen: (screen: AppScreen) => void): ReactNode {
  switch (activeScreen) {
    case "wardrobe":
      return <WardrobeScreen onNavigate={setActiveScreen} />;
    case "ask":
      return <AskWearoScreen onNavigate={setActiveScreen} />;
    case "outfits":
      return <OutfitsScreen onNavigate={setActiveScreen} />;
    case "history":
      return <HistoryScreen onNavigate={setActiveScreen} />;
    case "profile":
      return <ProfileScreen />;
    case "settings":
      return <SettingsScreen />;
    case "home":
    default:
      return <HomeScreen onNavigate={setActiveScreen} />;
  }
}

function Sidebar({
  activeScreen,
  onSelect
}: {
  activeScreen: AppScreen;
  onSelect: (screen: AppScreen) => void;
}) {
  return (
    <View style={styles.sidebar}>
      <WearoLogo />
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
  onSelect: (screen: AppScreen) => void;
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
  const isCenterAction = mode === "bottom" && item.key === "ask";

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
      {isCenterAction ? (
        <View style={[styles.centerAction, active && styles.centerActionActive]}>
          <WearoMark light />
        </View>
      ) : (
        <Text style={[styles.navSymbol, active && styles.navSymbolActive]}>{item.symbol}</Text>
      )}
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
    gap: spacing.xs,
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
    minHeight: 58,
    justifyContent: "center"
  },
  bottomButtonActive: {
    backgroundColor: "#F5F3FF"
  },
  centerAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    marginTop: -24,
    width: 48
  },
  centerActionActive: {
    backgroundColor: colors.primaryPressed
  },
  navSymbol: {
    color: colors.textSoft,
    fontSize: 22,
    fontWeight: "800"
  },
  navSymbolActive: {
    color: colors.primary
  },
  sidebarLabel: {
    ...typography.button,
    color: colors.textMuted
  },
  bottomLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10
  },
  navLabelActive: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.8
  }
});
