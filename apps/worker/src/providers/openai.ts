import OpenAI from "openai";
import type { AIProvider } from "@ai-dashboard/shared";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required");
    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}
