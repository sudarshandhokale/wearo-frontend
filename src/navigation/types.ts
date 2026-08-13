export type AppScreen = "home" | "wardrobe" | "style" | "plans" | "profile" | "ask" | "outfits" | "history";

export type NavigationOptions = {
  prompt?: string;
  autoSend?: boolean;
  recommendationRequestId?: number | string;
  clothingItemId?: number | string;
  outfitId?: number | string;
  styleSection?: "stylist" | "saved" | "past";
  plansSection?: "plans" | "routines";
};

export type Navigate = (screen: AppScreen, options?: NavigationOptions) => void;

export type NavItem = {
  key: AppScreen;
  label: string;
};

export const mobileNavItems: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "style", label: "Style" },
  { key: "plans", label: "Plans" },
  { key: "profile", label: "Profile" }
];

export const desktopNavItems: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "style", label: "Style" },
  { key: "plans", label: "Plans" },
  { key: "profile", label: "Profile" }
];
