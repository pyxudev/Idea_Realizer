import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "@ai-dashboard/shared";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required");
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GEMINI_MODEL || "gemini-pro";
  }

  async generate(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
