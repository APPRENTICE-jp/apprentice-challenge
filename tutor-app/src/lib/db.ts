import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { QuestionLogRow } from "@/types";

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

/** DATABASE_URL が設定されていれば接続を返す。未設定なら null（ログ機能は無効化）。 */
function getSql(): NeonQueryFunction<false, false> | null {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  sql = neon(url);
  return sql;
}

export function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureSchema(db: NeonQueryFunction<false, false>): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS questions (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          session_id TEXT NOT NULL,
          quest_slug TEXT,
          user_message TEXT NOT NULL,
          assistant_excerpt TEXT,
          model TEXT NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}

/** 質問を記録する。失敗してもチャット本体を止めないよう、呼び出し側で握りつぶす想定。 */
export async function logQuestion(params: {
  sessionId: string;
  questSlug: string | null;
  userMessage: string;
  assistantExcerpt: string | null;
  model: string;
}): Promise<void> {
  const db = getSql();
  if (!db) return;
  await ensureSchema(db);
  await db`
    INSERT INTO questions (session_id, quest_slug, user_message, assistant_excerpt, model)
    VALUES (${params.sessionId}, ${params.questSlug}, ${params.userMessage}, ${params.assistantExcerpt}, ${params.model})
  `;
}

export async function fetchQuestions(limit = 200): Promise<QuestionLogRow[]> {
  const db = getSql();
  if (!db) return [];
  await ensureSchema(db);
  const rows = await db`
    SELECT id, created_at, session_id, quest_slug, user_message, assistant_excerpt, model
    FROM questions
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as QuestionLogRow[];
}

export async function fetchStatsByQuest(): Promise<
  { quest_slug: string | null; count: number }[]
> {
  const db = getSql();
  if (!db) return [];
  await ensureSchema(db);
  const rows = await db`
    SELECT quest_slug, COUNT(*)::int AS count
    FROM questions
    GROUP BY quest_slug
    ORDER BY count DESC
  `;
  return rows as { quest_slug: string | null; count: number }[];
}
