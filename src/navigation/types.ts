export type AppScreen = "home" | "wardrobe" | "ask" | "outfits" | "history" | "profile" | "settings";

export type NavItem = {
  key: AppScreen;
  label: string;
  symbol: string;
};

export const mobileNavItems: NavItem[] = [
  { key: "home", label: "Home", symbol: "⌂" },
  { key: "wardrobe", label: "Wardrobe", symbol: "▦" },
  { key: "ask", label: "WEARO", symbol: "✦" },
  { key: "history", label: "History", symbol: "◷" },
  { key: "profile", label: "Profile", symbol: "○" }
];

export const desktopNavItems: NavItem[] = [
  { key: "home", label: "Home", symbol: "⌂" },
  { key: "wardrobe", label: "Wardrobe", symbol: "▦" },
  { key: "ask", label: "Ask WEARO", symbol: "✦" },
  { key: "outfits", label: "Outfits", symbol: "◇" },
  { key: "history", label: "History", symbol: "◷" },
  { key: "profile", label: "Profile", symbol: "○" },
  { key: "settings", label: "Settings", symbol: "⚙" }
];
