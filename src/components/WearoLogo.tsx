import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type LogoProps = {
  compact?: boolean;
  light?: boolean;
  markOnly?: boolean;
  surface?: boolean;
  size?: "sm" | "md" | "lg";
};

const logoAsset = require("../../assets/wearo-logo-mark.png");
const mobileLogoAsset = require("../../assets/wearo-logo-mobile.png");
const webLogoAsset = require("../../assets/wearo-logo-web.png");

export function WearoMark({ light = false, size = "md" }: Pick<LogoProps, "light" | "size">) {
  return (
    <View style={[styles.mark, styles[`${size}Mark`], light && styles.markLight]}>
      <Image
        accessibilityLabel="WEARO"
        resizeMode="cover"
        source={logoAsset}
        style={[styles.markImage, styles[`${size}MarkImage`]]}
      />
    </View>
  );
}

export function WearoWordmark({ light = false }: Pick<LogoProps, "light">) {
  return <Text style={[styles.wordmark, light && styles.lightText]}>WEARO</Text>;
}

export function WearoLogo({ compact = false, light = false, markOnly = false, size = "md" }: LogoProps) {
  return (
    <View style={[styles.logo, size === "lg" && styles.largeLogo]}>
      <WearoMark light={light} size={size} />
      {!compact && !markOnly ? (
        <View style={[styles.lockupText, size === "lg" && styles.largeLogoText]}>
          <WearoWordmark light={light} />
          <LogoSlogan light={light} compact={size !== "lg"} />
        </View>
      ) : null}
    </View>
  );
}

export function WearoHorizontalLogo({ light = false, size = "md" }: Pick<LogoProps, "light" | "size">) {
  return (
    <View style={[styles.horizontalLogo, size === "lg" && styles.largeHorizontalLogo]}>
      <WearoMark light={light} size={size} />
      <View style={styles.horizontalText}>
        <Text style={[styles.horizontalWordmark, light && styles.lightText]}>WEARO</Text>
        <LogoSlogan light={light} />
      </View>
    </View>
  );
}

export function WearoVerticalLogo({
  light = false,
  size = "lg",
  surface = false
}: Pick<LogoProps, "light" | "size" | "surface">) {
  return (
    <View style={[styles.verticalLogo, surface && styles.verticalLogoSurface]}>
      <WearoMark light={light} size={size} />
      <View style={styles.verticalText}>
        <Text style={[styles.verticalWordmark, light && styles.lightText]}>WEARO</Text>
        <LogoSlogan light={light} />
      </View>
    </View>
  );
}

export function WearoMobileLogo() {
  return (
    <View style={styles.mobileLogoFrame}>
      <Image
        accessibilityLabel="WEARO Your Personal AI Stylist"
        resizeMode="cover"
        source={mobileLogoAsset}
        style={styles.mobileLogoImage}
      />
    </View>
  );
}

export function WearoWebLogo() {
  return (
    <View style={styles.webLogoFrame}>
      <Image
        accessibilityLabel="WEARO Your Personal AI Stylist"
        resizeMode="cover"
        source={webLogoAsset}
        style={styles.webLogoImage}
      />
    </View>
  );
}

function LogoSlogan({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <View style={styles.sloganRow}>
      <View style={[styles.sloganDash, compact && styles.compactSloganDash, light && styles.lightSloganDash]} />
      <Text style={[styles.sloganText, compact && styles.compactSloganText, light && styles.lightSubtitle]}>
        Your Personal AI Stylist
      </Text>
      <View style={[styles.sloganDash, compact && styles.compactSloganDash, light && styles.lightSloganDash]} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  horizontalLogo: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  largeHorizontalLogo: {
    gap: spacing.md
  },
  horizontalText: {
    alignItems: "center",
    gap: 1,
    justifyContent: "center"
  },
  verticalLogo: {
    alignItems: "center",
    gap: spacing.sm
  },
  verticalLogoSurface: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  mobileLogoFrame: {
    borderRadius: radius.xl,
    height: 148,
    overflow: "hidden",
    width: 240
  },
  mobileLogoImage: {
    height: "100%",
    width: "100%"
  },
  webLogoFrame: {
    borderRadius: radius.lg,
    height: 96,
    overflow: "hidden",
    width: 330
  },
  webLogoImage: {
    height: "100%",
    width: "100%"
  },
  verticalText: {
    alignItems: "center",
    gap: 4
  },
  lockupText: {
    alignItems: "center",
    gap: 2
  },
  mark: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42
  },
  smMark: {
    height: 36,
    width: 36
  },
  mdMark: {
    height: 42,
    width: 42
  },
  lgMark: {
    borderRadius: radius.lg,
    height: 74,
    width: 74
  },
  markLight: {},
  markImage: {
    height: 42,
    width: 54
  },
  smMarkImage: {
    height: 36,
    width: 46
  },
  mdMarkImage: {
    height: 42,
    width: 54
  },
  lgMarkImage: {
    height: 74,
    width: 92
  },
  wordmark: {
    color: "#12142D",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 5
  },
  subtitle: {
    ...typography.caption,
    color: colors.lavender,
    fontSize: 10,
    lineHeight: 13
  },
  verticalWordmark: {
    color: "#12142D",
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: 10,
    lineHeight: 40
  },
  sloganRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center"
  },
  sloganDash: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 2,
    opacity: 0.75,
    width: 36
  },
  compactSloganDash: {
    height: 1,
    width: 18
  },
  sloganText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    lineHeight: 17
  },
  compactSloganText: {
    fontSize: 9,
    letterSpacing: 1.4,
    lineHeight: 13
  },
  horizontalWordmark: {
    color: "#12142D",
    fontSize: 24,
    fontWeight: "500",
    letterSpacing: 7,
    lineHeight: 30
  },
  largeLogo: {
    gap: spacing.md
  },
  largeLogoText: {
    gap: 2
  },
  largeSubtitle: {
    fontSize: 11,
    lineHeight: 15
  },
  lightText: {
    color: colors.surface
  },
  lightSubtitle: {
    color: "#D8D3FF"
  },
  lightSloganDash: {
    backgroundColor: "#D8D3FF"
  }
});
