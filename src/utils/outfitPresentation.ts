export function matchLabel(score: number | null | undefined) {
  if (score == null) return "Picked for you";
  if (score >= 85) return "Excellent match";
  if (score >= 75) return "Great match";
  return "Good match";
}

export function optionPurpose(index: number) {
  return ["BEST MATCH", "MORE STYLISH", "SOMETHING DIFFERENT"][index] || "ANOTHER OPTION";
}
