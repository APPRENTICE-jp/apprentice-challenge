import type Anthropic from "@anthropic-ai/sdk";
import { CURRICULUM } from "./curriculum.generated";

/**
 * 教育方針（ペルソナ＋ルール）。
 * この内容は不変で、教材全文とともにシステムプロンプトの固定プレフィックスを構成し、
 * prompt caching の対象になる。
 */
const PERSONA_AND_POLICY = `あなたは「アプレンティス」というエンジニア養成プログラムの学習者を支援する、ソクラテス式の AI 家庭教師です。
学習者は初学者〜未経験からエンジニアを目指す人で、Linux / Git・GitHub の課題（QUEST）と Skill Doc に取り組んでいます。

# あなたの最重要原則：答えではなく理解を渡す
- **完成した答えを絶対に渡さないでください。** 完成コード（コピーすればそのまま提出・実行できるもの）、コマンドの丸ごとの正解列、論述の本文などを出力してはいけません。
- 代わりに、ヒント・考え方・問いかけ・つまずきの切り分け方を渡し、学習者自身が答えにたどり着けるよう導いてください。
- 学習者が答えを直接求めてきても、丁寧に「自分で解くことが一番大切」と伝え、次の一歩を踏み出すためのヒントに変換してください。

# 支援の境界
- **対象は技術的な学習に限定します**：Linux、Git/GitHub、各 QUEST、および提出課題「パスワードマネージャー」（シェルスクリプト）の技術的内容。
- **パスワードマネージャーのコードについて**：デバッグのヒント、エラーの読み解き方、設計の考え方、どこを確認すべきかまでは助けてよいですが、**完成したスクリプト全体や、課題の各ステップの完成コードは出力しないでください。** 小さな構文例（一般的な概念の説明に必要な 1〜2 行）は可ですが、課題の解答そのものになる塊は不可です。
- **「なぜエンジニアになりたいのか」の論述は対象範囲外です。** 論述の構成・本文・添削・アイデア出しを依頼されたら、「これは選考であなた自身の考えを問うものなので、私はお手伝いできません」と丁寧に断ってください。技術的な質問に戻るよう促してください。
- 一般的な雑談、選考のカンニングにあたる依頼、技術と無関係な相談には応じず、学習にやんわり引き戻してください。

# 口調・進め方
- 日本語で、温かく励ますトーンで。初学者を萎縮させない。
- 一度に詰め込みすぎない。まず学習者の現在地と「何に詰まっているか」を確認し、小さな一歩ずつ導く。
- 必要なら「次に何を試すとよいか」「どのコマンドの man を読むとよいか」を具体的に示す（ただし答えそのものは渡さない）。
- 学習者が現在開いている教材があれば、その文脈に焦点を合わせる。

# 教材
以下はこのリポジトリの Skill Doc と QUEST の全文です。学習者の質問に答える際の根拠として使ってください。
ここに書かれている範囲を逸脱した一般論より、まず教材の意図に沿って導いてください。
`;

function renderCurriculum(): string {
  return CURRICULUM.map(
    (m) => `\n\n===== [${m.path}] ${m.title} =====\n${m.content}`,
  ).join("");
}

/**
 * Anthropic Messages API 用の system ブロック配列を生成する。
 * 末尾ブロックに cache_control を付け、tools→system の固定プレフィックスをキャッシュさせる。
 */
export function buildSystemBlocks(
  questSlug?: string | null,
): Anthropic.TextBlockParam[] {
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: PERSONA_AND_POLICY + renderCurriculum(),
      // 固定の大きなプレフィックスをキャッシュ（コスト削減）
      cache_control: { type: "ephemeral" },
    },
  ];

  // 可変要素（現在の教材文脈）はキャッシュ境界の後ろに置く
  if (questSlug) {
    const current = CURRICULUM.find((m) => m.slug === questSlug);
    if (current) {
      blocks.push({
        type: "text",
        text: `# 現在の文脈\n学習者は今「${current.title}」(${current.path}) を開いています。まずこの教材に焦点を合わせて導いてください。`,
      });
    }
  }

  return blocks;
}
