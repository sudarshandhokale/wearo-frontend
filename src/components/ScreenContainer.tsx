import { ReactNode, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useResponsive } from "../hooks/useResponsive";
import { spacing } from "../theme";

type ScreenContainerProps = {
  children: ReactNode;
  resetKey?: string | number;
};

export function ScreenContainer({ children, resetKey }: ScreenContainerProps) {
  const { contentMaxWidth, isMobile, usesSidebar } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [resetKey]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        usesSidebar ? styles.desktopScrollContent : styles.mobileScrollContent,
        isMobile && styles.phoneScrollContent
      ]}
      ref={scrollRef}
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
  phoneScrollContent: {
    paddingBottom: 116,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl
  },
  desktopScrollContent: {
    alignItems: "center",
    paddingBottom: 64,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxl
  },
  inner: {
    alignSelf: "center",
    width: "100%"
  }
});
