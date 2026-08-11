import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useResponsive } from "../hooks/useResponsive";
import { spacing } from "../theme";

type ScreenContainerProps = {
  children: ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  const { contentMaxWidth, usesSidebar } = useResponsive();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        usesSidebar ? styles.desktopScrollContent : styles.mobileScrollContent
      ]}
    >
      <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1
  },
  mobileScrollContent: {
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  desktopScrollContent: {
    alignItems: "center",
    padding: spacing.xxxl
  },
  inner: {
    alignSelf: "center",
    width: "100%"
  }
});
