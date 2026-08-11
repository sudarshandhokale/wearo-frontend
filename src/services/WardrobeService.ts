export type WardrobeCategory = "Top" | "Bottom" | "Shoes" | "Outerwear";

export type WardrobeItem = {
  id: string;
  category: WardrobeCategory;
  name: string;
  color: string;
  favorite: boolean;
  lastWorn: string;
  swatch: string;
};

const wardrobeItems: WardrobeItem[] = [
  {
    id: "floral-shirt",
    category: "Top",
    name: "Floral camp shirt",
    color: "Brown",
    favorite: true,
    lastWorn: "15 Aug",
    swatch: "#7A5330"
  },
  {
    id: "black-shorts",
    category: "Bottom",
    name: "Black tailored shorts",
    color: "Black",
    favorite: false,
    lastWorn: "15 Aug",
    swatch: "#222222"
  },
  {
    id: "white-sneakers",
    category: "Shoes",
    name: "White sneakers",
    color: "White",
    favorite: true,
    lastWorn: "13 Aug",
    swatch: "#F7F7F7"
  }
];

export class WardrobeService {
  static async listPreviewItems() {
    return wardrobeItems;
  }
}
