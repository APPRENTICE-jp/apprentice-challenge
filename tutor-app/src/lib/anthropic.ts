import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    // ANTHROPIC_API_KEY を環境から解決（サーバー側のみ）
    client = new Anthropic();
  }
  return client;
}
