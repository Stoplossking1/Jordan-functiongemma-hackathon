import { type LlmTokenizer } from './LlmTokenizer.ts';

// sometimes we don't need a precise count and instead want a fast estimate
export class EstimationTokenizer implements LlmTokenizer {
  public countTextTokens(text: string): number {
    // Both Gemini & OpenAI estimate roughly 4 characters per token for English (for other languages this is different)
    const tokenEstimate = Math.ceil(text.length / 4);
    return tokenEstimate;
  }
}
