import { StyleSheet, Text, View } from "react-native";

import type { WardrobeItem } from "../services/WardrobeService";
import { colors, radius, spacing, typography } from "../theme";

export function OutfitVisual({ items }: { items: WardrobeItem[] }) {
  return (
    <View style={styles.visual}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.item,
            index === 0 ? styles.topItem : index === 1 ? styles.bottomItem : styles.shoeItem
          ]}
        >
          <View style={[styles.swatch, { backgroundColor: item.swatch }]} />
          <Text numberOfLines={2} style={styles.category}>
            {item.category}
          </Text>
          <Text numberOfLines={2} style={styles.name}>
            {item.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  visual: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 176
  },
  item: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.sm
  },
  topItem: {
    minHeight: 176
  },
  bottomItem: {
    marginTop: spacing.xl
  },
  shoeItem: {
    marginTop: spacing.xxxl
  },
  swatch: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 70,
    width: "100%"
  },
  category: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700"
  }
});
