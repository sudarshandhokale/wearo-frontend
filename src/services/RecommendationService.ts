import { WardrobeItem, WardrobeService } from "./WardrobeService";

export type OutfitRecommendation = {
  id: string;
  title: string;
  occasion: string;
  weather: {
    temperature: string;
    city: string;
    condition: string;
  };
  items: WardrobeItem[];
  why: string;
};

export class RecommendationService {
  static async getTodayRecommendation(): Promise<OutfitRecommendation> {
    const items = await WardrobeService.listPreviewItems();

    return {
      id: "today-hamburg-casual",
      title: "Light city casual",
      occasion: "Everyday",
      weather: {
        temperature: "18°C",
        city: "Hamburg",
        condition: "Mild"
      },
      items,
      why: "Light, breathable and relaxed. The neutral shorts balance the patterned shirt, and the white sneakers keep the look clean."
    };
  }
}
