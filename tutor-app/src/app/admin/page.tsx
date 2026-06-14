import { fetchQuestions, fetchStatsByQuest, isDbEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  if (!isDbEnabled()) {
    return (
      <div className="admin">
        <h1>質問ログ</h1>
        <p>
          DATABASE_URL が未設定のため、質問ログは保存されていません。
          環境変数を設定すると、ここに質問の一覧と頻度が表示されます。
        </p>
      </div>
    );
  }

  const [questions, stats] = await Promise.all([
    fetchQuestions(200),
    fetchStatsByQuest(),
  ]);

  return (
    <div className="admin">
      <h1>質問ログ（直近 {questions.length} 件）</h1>

      <h2>教材別の質問数</h2>
      <table>
        <thead>
          <tr>
            <th>教材 (quest_slug)</th>
            <th>件数</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={i}>
              <td>{s.quest_slug ?? "(未指定)"}</td>
              <td>{s.count}</td>
            </tr>
          ))}
          {stats.length === 0 && (
            <tr>
              <td colSpan={2}>まだ質問がありません。</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: 28 }}>質問一覧</h2>
      <table>
        <thead>
          <tr>
            <th>日時</th>
            <th>教材</th>
            <th>質問</th>
            <th>応答（抜粋）</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td style={{ whiteSpace: "nowrap" }}>{formatDate(q.created_at)}</td>
              <td>{q.quest_slug ?? "—"}</td>
              <td>{q.user_message}</td>
              <td style={{ color: "#6b7280" }}>{q.assistant_excerpt ?? "—"}</td>
            </tr>
          ))}
          {questions.length === 0 && (
            <tr>
              <td colSpan={4}>まだ質問がありません。</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
