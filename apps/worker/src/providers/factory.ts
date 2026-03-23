import type { AIProvider, AIProviderType } from "@ai-dashboard/shared";
import { OpenAIProvider } from "./openai";
import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";

export function createProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider();
    case "claude":
      return new ClaudeProvider();
    case "gemini":
      return new GeminiProvider();
    case "ollama":
      return new OllamaProvider();
    default:
      throw new Error(`Unknown AI provider: ${type}`);
  }
}
