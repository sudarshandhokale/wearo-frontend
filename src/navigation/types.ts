export type AppScreen = "home" | "wardrobe" | "ask" | "outfits" | "history" | "profile";

export type NavigationOptions = {
  prompt?: string;
  autoSend?: boolean;
  clothingItemId?: number | string;
};

export type Navigate = (screen: AppScreen, options?: NavigationOptions) => void;

export type NavItem = {
  key: AppScreen;
  label: string;
};

export const mobileNavItems: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "ask", label: "Ask" },
  { key: "outfits", label: "Outfits" },
  { key: "history", label: "History" },
  { key: "profile", label: "Profile" }
];

export const desktopNavItems: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "ask", label: "Ask WEARO" },
  { key: "outfits", label: "Outfits" },
  { key: "history", label: "History" },
  { key: "profile", label: "Profile" }
];
