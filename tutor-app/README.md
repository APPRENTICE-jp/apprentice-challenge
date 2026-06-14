# アプレンティス 学習アシスタント (tutor-app)

このリポジトリ（アプレンティス Web テスト）の学習者を支援する、**答えではなくヒントを渡すソクラテス式 AI 家庭教師**の Web アプリです。

- 左ペインに QUEST / Skill Doc の教材、右ペインに AI チャットを表示する 2 ペイン構成
- AI は完成コードや論述本文を渡さず、考え方・問いかけ・つまずきの切り分けで導く
- 対象は技術的な学習（Linux / Git / 提出 QUEST「パスワードマネージャー」）に限定
- 「なぜエンジニアか」の論述は対象範囲外（依頼されても丁寧に断る）
- 匿名で質問をログ保存し、`/admin` で頻度・内容を確認できる

## 技術スタック

- Next.js (App Router) + TypeScript / React
- AI: Anthropic Claude **Sonnet 4.6**（`@anthropic-ai/sdk`、ストリーミング）
- 教材は `skilldoc/` `quest/` の Markdown をビルド時にバンドル（`scripts/build-curriculum.ts`）
- 質問ログ: Postgres（Vercel Postgres / Neon、`@neondatabase/serverless`）

## セットアップ（ローカル）

```bash
cd tutor-app
npm install
cp .env.example .env.local   # 値を埋める
npm run dev                  # http://localhost:3000
```

`npm run dev` / `npm run build` は前段で `build:curriculum` が走り、教材バンドル
`src/lib/curriculum.generated.ts` を自動生成します（このファイルは生成物で git 管理外）。

## 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Claude API キー。サーバー側のみで使用 |
| `DATABASE_URL` | 任意 | 質問ログ用 Postgres 接続文字列。未設定ならログはスキップ（チャットは動作） |
| `ADMIN_PASSWORD` | `/admin` 利用時 | 管理ページの Basic 認証パスワード。未設定だと `/admin` は 503 |

> `DATABASE_URL` 未設定でもチャット本体は動作します。ログ用テーブル `questions` は
> 初回アクセス時に自動作成されます（`CREATE TABLE IF NOT EXISTS`）。

## 管理ページ

`/admin` にアクセスすると Basic 認証を求められます（ユーザー名は任意、パスワードは
`ADMIN_PASSWORD`）。教材別の質問数と直近の質問一覧を確認できます。

## Vercel へのデプロイ

1. このリポジトリを Vercel にインポートし、**Root Directory を `tutor-app` に設定**
2. 環境変数（`ANTHROPIC_API_KEY` / `DATABASE_URL` / `ADMIN_PASSWORD`）を設定
   - Postgres は Vercel Postgres（Neon）を作成すると `DATABASE_URL` が自動連携されます
3. デプロイ。ビルド時に教材バンドルが生成されます

## ディレクトリ構成

```
tutor-app/
├── scripts/build-curriculum.ts   # 教材MD → 生成モジュール
├── src/
│   ├── app/
│   │   ├── page.tsx              # 2ペイン（教材ビューア + チャット）
│   │   ├── admin/page.tsx        # 質問ログ閲覧
│   │   └── api/chat/route.ts     # Claudeストリーミング + ログ保存
│   ├── components/               # TutorApp / MaterialViewer / ChatPanel ほか
│   ├── lib/
│   │   ├── system-prompt.ts      # 教育方針 + 教材注入（prompt cache）
│   │   ├── anthropic.ts          # Anthropic クライアント
│   │   ├── db.ts                 # 質問ログ
│   │   └── curriculum.generated.ts  # 生成物（git 管理外）
│   └── middleware.ts             # /admin の Basic 認証
```

## 設計上のポイント

- **答えを渡さない方針**は `src/lib/system-prompt.ts` に集約。教材全文は固定プレフィックスとして
  `cache_control: ephemeral` を付与し、prompt caching でコストを抑える
- 質問ログ保存はチャット応答の成否に影響させない（失敗しても握りつぶす）
- `ANTHROPIC_API_KEY` はサーバー側のみ。クライアントには露出しない
