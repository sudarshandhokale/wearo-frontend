import type {
  AppMetadata,
  ClothingItem,
  ClothingItemInput,
  ClothingItemListMeta,
  AiUsage,
  Outfit,
  OutfitFeedbackInput,
  PaginationMeta,
  RecommendationRequest,
  RecommendationResponse,
  StyleProfile,
  StyleProfileInput
} from "./types";
import { Platform } from "react-native";
import { API_BASE_URL, RestService, type RestResult } from "./RestService";
import { tokenStorage } from "../auth/tokenStorage";

export type ClothingItemFilters = {
  page?: number;
  perPage?: number;
  category?: string;
  status?: string;
  primaryColor?: string;
};

export type PickedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

async function token() {
  return tokenStorage.get();
}

function queryString(filters: ClothingItemFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("per_page", String(filters.perPage));
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.primaryColor) params.set("primary_color", filters.primaryColor);
  const value = params.toString();
  return value ? `?${value}` : "";
}

function appendArray(form: FormData, key: string, values: string[]) {
  values.forEach((value) => form.append(`clothing_item[${key}][]`, value));
}

function itemPayload(input: ClothingItemInput) {
  return {
    ...input,
    formality_score: input.formality_score ? Number(input.formality_score) : null
  };
}

async function itemForm(input: ClothingItemInput, image?: PickedImage | null) {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      appendArray(form, key, value);
    } else if (value !== "") {
      form.append(`clothing_item[${key}]`, value);
    }
  });

  if (image) {
    if (Platform.OS === "web") {
      const blob = await fetch(image.uri).then((response) => response.blob());
      form.append("clothing_item[image]", blob, image.name);
    } else {
      form.append("clothing_item[image]", {
        uri: image.uri,
        name: image.name,
        type: image.mimeType
      } as unknown as Blob);
    }
  }

  return form;
}

export const AppService = {
  async metadata() {
    return RestService.GET<AppMetadata>("/api/v1/metadata", await token());
  },
  async styleProfile() {
    return RestService.GET<StyleProfile>("/api/v1/style_profile", await token());
  },
  async updateStyleProfile(input: StyleProfileInput) {
    return RestService.PATCH<StyleProfile>(
      "/api/v1/style_profile",
      { style_profile: input },
      await token()
    );
  },
  async clothingItems(filters: ClothingItemFilters = {}) {
    return RestService.GET<ClothingItem[]>(
      `/api/v1/clothing_items${queryString(filters)}`,
      await token()
    ) as Promise<Omit<RestResult<ClothingItem[]>, "meta"> & { meta: ClothingItemListMeta | null }>;
  },
  async clothingItem(id: ClothingItem["id"]) {
    return RestService.GET<ClothingItem>(`/api/v1/clothing_items/${id}`, await token());
  },
  async createClothingItem(input: ClothingItemInput, image?: PickedImage | null) {
    if (!image) {
      return RestService.POST<ClothingItem>(
        "/api/v1/clothing_items",
        { clothing_item: itemPayload(input) },
        await token()
      );
    }

    return RestService.POST_FORM<ClothingItem>(
      "/api/v1/clothing_items",
      await itemForm(input, image),
      await token()
    );
  },
  async updateClothingItem(id: ClothingItem["id"], input: ClothingItemInput, image?: PickedImage | null) {
    if (!image) {
      return RestService.PATCH<ClothingItem>(
        `/api/v1/clothing_items/${id}`,
        { clothing_item: itemPayload(input) },
        await token()
      );
    }

    return RestService.PATCH_FORM<ClothingItem>(
      `/api/v1/clothing_items/${id}`,
      await itemForm(input, image),
      await token()
    );
  },
  async deleteClothingItem(id: ClothingItem["id"]) {
    return RestService.DELETE<{ message: string }>(`/api/v1/clothing_items/${id}`, await token());
  },
  async reanalyzeClothingItem(id: ClothingItem["id"]) {
    return RestService.POST<ClothingItem>(`/api/v1/clothing_items/${id}/reanalyze`, undefined, await token());
  },
  async recommendations(prompt: string) {
    return RestService.POST<RecommendationResponse>(
      "/api/v1/stylist/recommendations",
      { prompt },
      await token()
    );
  },
  async outfit(id: Outfit["id"]) {
    return RestService.GET<Outfit>(`/api/v1/outfits/${id}`, await token());
  },
  async outfits(page = 1, perPage = 20) {
    return RestService.GET<Outfit[]>(`/api/v1/outfits?page=${page}&per_page=${perPage}`, await token()) as Promise<
      Omit<RestResult<Outfit[]>, "meta"> & { meta: PaginationMeta | null }
    >;
  },
  async updateOutfit(id: Outfit["id"], input: OutfitFeedbackInput) {
    return RestService.PATCH<Outfit>(`/api/v1/outfits/${id}`, { outfit: input }, await token());
  },
  async recommendationRequests(page = 1, perPage = 20) {
    return RestService.GET<RecommendationRequest[]>(
      `/api/v1/recommendation_requests?page=${page}&per_page=${perPage}`,
      await token()
    ) as Promise<Omit<RestResult<RecommendationRequest[]>, "meta"> & { meta: PaginationMeta | null }>;
  },
  async recommendationRequest(id: RecommendationRequest["id"]) {
    return RestService.GET<RecommendationRequest>(`/api/v1/recommendation_requests/${id}`, await token());
  },
  async aiUsage() {
    return RestService.GET<AiUsage>("/api/v1/ai/usage", await token());
  }
};

export function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
