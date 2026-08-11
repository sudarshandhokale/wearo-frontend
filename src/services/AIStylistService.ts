export type SuggestedPrompt = {
  id: string;
  text: string;
};

export class AIStylistService {
  static async suggestedPrompts(): Promise<SuggestedPrompt[]> {
    return [
      { id: "today", text: "What should I wear today?" },
      { id: "picnic", text: "I'm going for a picnic Saturday." },
      { id: "pickup", text: "Give me something casual for Kita pickup." }
    ];
  }
}
