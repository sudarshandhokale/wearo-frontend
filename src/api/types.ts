export type SafegoSuccess<T> = {
  success: true;
  data: T;
  meta: unknown | null;
};

export type SafegoFailure = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

export type SafegoResponse<T> = SafegoSuccess<T> | SafegoFailure;

export type ApiUser = {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  timezone?: string | null;
  country_code?: string | null;
  preferred_city?: string | null;
};

export type AuthResponseData = {
  user: ApiUser;
};

export type RegisterParams = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  timezone: string;
  country_code: string;
  preferred_city: string;
};

export type LoginParams = {
  email: string;
  password: string;
};

export type UpdateUserParams = Pick<
  ApiUser,
  "first_name" | "last_name" | "timezone" | "country_code" | "preferred_city"
>;

export type MetadataOption = {
  key: string;
  label: string;
};

export type ClothingCategory = MetadataOption & {
  subcategories: MetadataOption[];
};

export type AppMetadata = {
  countries: Array<{ code: string; name: string }>;
  timezones: MetadataOption[];
  timezone_countries: Record<string, string>;
  style_profile: {
    preferred_styles: MetadataOption[];
    preferred_colors: MetadataOption[];
    disliked_colors: MetadataOption[];
    fit_preferences: Record<string, MetadataOption[]>;
    occasions: MetadataOption[];
    seasons: MetadataOption[];
  };
  clothing_items: {
    categories: ClothingCategory[];
    statuses: MetadataOption[];
  };
  outfits: {
    roles: MetadataOption[];
    statuses: MetadataOption[];
    base_compositions?: unknown[];
  };
};

export type StyleProfile = {
  id: number | string;
  preferred_styles: string[];
  preferred_colors: string[];
  disliked_colors: string[];
  fit_preferences: Record<string, string>;
  additional_preferences: Record<string, unknown>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type StyleProfileInput = Pick<
  StyleProfile,
  | "preferred_styles"
  | "preferred_colors"
  | "disliked_colors"
  | "fit_preferences"
  | "additional_preferences"
  | "onboarding_completed"
>;

export type ClothingItemStatus = "uploaded" | "processing" | "ready" | "analysis_failed";

export type ClothingItem = {
  id: number | string;
  wardrobe_id: number | string;
  name: string | null;
  garment_type: string | null;
  category: string | null;
  subcategory: string | null;
  primary_color: string | null;
  secondary_colors: string[];
  pattern: string | null;
  material: string | null;
  season_tags: string[];
  occasion_tags: string[];
  style_tags: string[];
  cultural_tags: string[];
  formality_score: number | null;
  status: ClothingItemStatus;
  ai_analyzed_at: string | null;
  image: { signed_id: string; url: string } | null;
  created_at: string;
  updated_at: string;
};

export type ClothingItemInput = {
  name: string;
  garment_type: string;
  category: string;
  subcategory: string;
  primary_color: string;
  secondary_colors: string[];
  pattern: string;
  material: string;
  season_tags: string[];
  occasion_tags: string[];
  style_tags: string[];
  cultural_tags: string[];
  formality_score: string;
};

export type ClothingItemListMeta = {
  current_page?: number;
  next_page?: number | null;
  total_pages?: number;
  total_count?: number;
};

export type OutfitClothingItem = Pick<
  ClothingItem,
  "id" | "name" | "category" | "subcategory" | "primary_color" | "image"
>;

export type OutfitItem = {
  id: number | string;
  clothing_item_id: number | string;
  role: string;
  position: number;
  clothing_item: OutfitClothingItem;
};

export type Outfit = {
  id: number | string;
  recommendation_request_id: number | string | null;
  prompt: string;
  occasion: string | null;
  context: Record<string, unknown>;
  weather_context: Record<string, unknown>;
  recommendation_score: number | null;
  score_breakdown: Record<string, number>;
  explanation: string;
  status: OutfitStatus;
  rating: number | null;
  feedback_note: string | null;
  status_updated_at: string | null;
  recommended_for: string | null;
  items: OutfitItem[];
  created_at: string;
  updated_at: string;
};

export type RecommendationResponse = {
  recommendation: RecommendationRequest;
  context: Record<string, unknown>;
  outfits: Outfit[];
  suggestions: unknown[];
};

export type OutfitStatus = "recommended" | "saved" | "worn" | "dismissed";

export type OutfitFeedbackInput = {
  status?: OutfitStatus;
  rating?: number | null;
  feedback_note?: string | null;
};

export type RecommendationStatus = "processing" | "completed" | "failed";

export type RecommendationRequest = {
  id: number | string;
  prompt: string;
  context: Record<string, unknown>;
  wardrobe_suggestions: unknown[];
  status: RecommendationStatus;
  ranking_source: "ai" | "deterministic" | null;
  provider: string | null;
  model: string | null;
  ai_usage: {
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    attempt_count: number | null;
  };
  failure_code: string | null;
  recommended_for: string | null;
  completed_at: string | null;
  outfits?: Outfit[] | null;
  created_at: string;
  updated_at?: string;
};

export type PaginationMeta = {
  current_page?: number;
  next_page?: number | null;
  total_pages?: number;
  total_count?: number;
};

export type AiUsage = {
  date: string;
  tokens_used: number;
  tokens_reserved: number;
  token_limit: number;
  tokens_remaining: number;
  requests_used: number;
  request_limit: number;
  requests_remaining: number;
};

export type RecommendationErrorDetails = {
  missing_roles?: string[];
};
