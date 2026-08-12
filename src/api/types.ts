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
  full_body_image?: ApiImage | null;
  consents?: UserConsents;
};

export type UserConsents = {
  terms?: { accepted_at: string | null; version: string | null } | null;
  privacy?: { accepted_at: string | null; version: string | null } | null;
  ai_processing?: { accepted_at: string | null } | null;
  adult_confirmed_at?: string | null;
  full_body_image?: { accepted_at: string | null } | null;
};

export type ApiImage = { signed_id: string; url: string };

export type CoverImage = ApiImage & {
  kind: "outfit_try_on" | "outfit_flat_lay" | "polished_item" | "original_item";
  generated: boolean;
  personalized: boolean;
  visualization_id?: number;
  clothing_item_id?: number;
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
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_ai_processing: boolean;
  confirm_adult: boolean;
};

export type RegistrationResult = { message: string };
export type ConsentInput = Pick<RegisterParams, "accept_terms" | "accept_privacy" | "accept_ai_processing" | "confirm_adult">;

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
    fits: MetadataOption[];
    statuses: MetadataOption[];
  };
  outfits: {
    roles: MetadataOption[];
    statuses: MetadataOption[];
    base_compositions?: unknown[];
  };
  legal: {
    minimum_age: number;
    terms: { version: string; url: string };
    privacy: { version: string; url: string };
    ai_processing_required: boolean;
    full_body_image_consent_required: boolean;
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
  fit: string | null;
  formality_score: number | null;
  status: ClothingItemStatus;
  ai_analyzed_at: string | null;
  image: ApiImage | null;
  polished_image: ApiImage | null;
  display_image: ApiImage | null;
  cover_image: CoverImage | null;
  image_polish: { status: string };
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
  fit: string;
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
  "id" | "name" | "category" | "subcategory" | "primary_color" | "image" | "display_image" | "cover_image"
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
  name: string;
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
  cover_images: CoverImage[];
  items: OutfitItem[];
  created_at: string;
  updated_at: string;
};

export type RecommendationResponse = {
  recommendation: RecommendationRequest;
  context: Record<string, unknown>;
  outfits: Outfit[];
  suggestions: ContextualSuggestion[];
};

export type ContextualSuggestion = {
  key: string;
  type: "weather" | "styling" | "wardrobe";
  priority: "essential" | "recommended" | "optional";
  action: "bring" | "use_owned_item" | "add_to_wardrobe" | "consider";
  role: string | null;
  clothing_item_id: number | string | null;
  suggested_subcategories: string[];
  message: string;
  question: string | null;
};

export type WearInput = { worn_on: string; occasion?: string | null; context?: Record<string, unknown> };
export type WearHistory = { id: number | string; outfit_id: number | string; worn_on: string; occasion: string | null; context: Record<string, unknown>; outfit?: Outfit; created_at: string };
export type FeedbackReaction = "liked" | "disliked";
export type DislikeReason = "too_formal" | "too_casual" | "dont_like_colors" | "recently_worn" | "not_comfortable" | "not_my_style" | "other";
export type OutfitFeedback = { id: number | string; outfit_id: number | string; reaction: FeedbackReaction; reason: DislikeReason | null; notes: string | null; created_at: string; updated_at: string };

export type WeatherDay = { date: string; condition?: string; temperature_max?: number; temperature_min?: number; precipitation_probability?: number; [key: string]: unknown };
export type ExternalContext = { city: string | null; country_code: string | null; weather: WeatherDay[] };

export type StylingPlanType = "week" | "vacation";
export type StylingPlanInput = { plan_type: StylingPlanType; city: string; start_date: string; end_date: string; prompt: string };
export type ConversationalStylingPlanInput = { prompt: string; plan_type?: StylingPlanType; city?: string; start_date?: string; end_date?: string };
export type StylingPlanEntry = { id: number | string; planned_for: string; context: Record<string, unknown>; weather_context: Record<string, unknown>; events_context: Record<string, unknown>; outfit: Outfit };
export type PackingItem = { clothing_item_id?: number | string; name?: string; wear_count: number; [key: string]: unknown };
export type StylingPlan = { id: number | string; plan_type: StylingPlanType; status: "processing" | "completed" | "failed"; city: string | null; country_code: string | null; start_date: string; end_date: string; prompt: string | null; weather_context: Record<string, unknown>; packing_summary: { days?: number; unique_item_count?: number; items?: PackingItem[]; gaps?: unknown[]; [key: string]: unknown }; failure_code: string | null; completed_at: string | null; entries: StylingPlanEntry[]; created_at: string; updated_at: string };

export type VisualizationMode = "flat_lay" | "try_on";
export type VisualizationGuidance = {
  personalized: boolean;
  profile_photo_available: boolean;
  fallback_from_try_on: boolean;
  action: "upload_full_body_photo" | null;
  message: string;
};
export type OutfitVisualization = { id: number | string; outfit_id: number | string; mode: VisualizationMode; status: "queued" | "processing" | "ready" | "failed"; provider: string | null; model: string | null; metadata: Record<string, unknown>; guidance: VisualizationGuidance; failure_code: string | null; image: ApiImage | null; completed_at: string | null; created_at: string; updated_at: string };

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
