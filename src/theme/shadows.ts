import { Platform } from "react-native";

import { colors } from "./colors";

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: "0 18px 45px rgba(22, 17, 31, 0.10)"
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5
    }
  }),
  soft: Platform.select({
    web: {
      boxShadow: "0 10px 30px rgba(22, 17, 31, 0.08)"
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3
    }
  })
} as const;
