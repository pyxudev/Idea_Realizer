import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "@ai-dashboard/shared";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");
    this.client = new Anthropic({ apiKey });
    this.model = process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";
  }

  async generate(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    return content.text;
  }
}
