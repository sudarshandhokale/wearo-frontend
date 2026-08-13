import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { breakpoints } from "../theme";

export type ViewportSize = "mobile" | "tablet" | "desktop";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const viewport: ViewportSize =
      width >= breakpoints.desktop ? "desktop" : width >= breakpoints.tablet ? "tablet" : "mobile";
    const isDesktop = viewport === "desktop";
    const isTablet = viewport === "tablet";
    const isMobile = viewport === "mobile";
    const usesSidebar = width >= breakpoints.tablet;

    return {
      width,
      height,
      viewport,
      isDesktop,
      isTablet,
      isMobile,
      usesSidebar,
      contentMaxWidth: isDesktop ? 1180 : isTablet ? 900 : 560,
      wardrobeColumns: isDesktop ? 5 : isTablet ? 3 : 2
    };
  }, [height, width]);
}
