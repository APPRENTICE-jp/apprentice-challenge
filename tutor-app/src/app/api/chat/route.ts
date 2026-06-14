import { getAnthropic, MODEL } from "@/lib/anthropic";
import { buildSystemBlocks } from "@/lib/system-prompt";
import { logQuestion } from "@/lib/db";
import type { ChatRequestBody } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, questSlug, sessionId } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages is required", { status: 400 });
  }
  if (!sessionId) {
    return new Response("sessionId is required", { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";
      try {
        // クライアント生成（APIキー未設定などはここで捕捉して友好的に通知）
        const anthropic = getAnthropic();
        const llmStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: buildSystemBlocks(questSlug),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of llmStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("[chat] streaming error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n（申し訳ありません。応答の生成中にエラーが発生しました。少し待って再度お試しください。）",
          ),
        );
      } finally {
        controller.close();
        // 質問ログ保存（チャット応答の成否に影響させない）
        if (lastUser) {
          logQuestion({
            sessionId,
            questSlug: questSlug ?? null,
            userMessage: lastUser.content,
            assistantExcerpt: assistantText.slice(0, 500) || null,
            model: MODEL,
          }).catch((e) => console.error("[chat] logQuestion failed:", e));
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
