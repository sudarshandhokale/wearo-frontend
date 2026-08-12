export const copy = {
  stylist: {
    title: "Ask WEARO",
    subtitle: "Tell us where you're going or what you're dressing for.",
    promptLabel: "What are you dressing for?",
    promptPlaceholder: "Casual dinner with friends tonight",
    submit: "Create outfits",
    loadingTitle: "Building your looks",
    loadingText: "WEARO is matching ready pieces from your wardrobe.",
    resultsTitle: "Your outfit options",
    resultsSubtitle: "Choose a look to see every piece and why it works.",
    incompleteTitle: "Your wardrobe needs a few essentials",
    addClothing: "Add clothing",
    tryAgain: "Try another request",
    details: "Outfit details",
    explanation: "Why this works",
    recommendedFor: "Recommended for",
    backToResults: "Back to outfits",
    retry: "Try again"
  },
  clothing: {
    processingTitle: "Analyzing your clothing",
    processingText: "WEARO is identifying the item's details. You can leave this screen while it finishes.",
    failedTitle: "Analysis could not be completed",
    failedText: "Try the analysis again, or edit the item details yourself.",
    reanalyze: "Reanalyze",
    edit: "Edit item"
  },
  visualization: {
    title: "Visualize this look",
    flatLay: "Flat lay",
    tryOn: "Try on",
    disclaimer: "AI creates styling inspiration and may not reproduce garments or fit exactly.",
    flatLayHint: "Creates a clean image of the complete outfit from your wardrobe photos.",
    tryOnHint: "Uses your saved full-body photo to create a personalized visualization.",
    missingPhotoHint: "Upload a full-body photo to visualize this outfit on you. You can remove it from your profile at any time.",
    create: "Create visualization",
    uploadAndCreate: "Upload photo and visualize",
    creating: "Creating visualization",
    failed: "The visualization could not be created. Please try again."
  },
  common: {
    notSet: "Not set",
    score: "Match"
  }
} as const;
