export type SuggestedPrompt = {
  id: string;
  text: string;
};

export class AIStylistService {
  static async suggestedPrompts(): Promise<SuggestedPrompt[]> {
    return [
      { id: "today", text: "What should I wear today?" },
      { id: "picnic", text: "I'm going for a picnic Saturday." },
      { id: "dinner", text: "What should I wear to a smart-casual dinner tonight?" }
    ];
  }
}
