import type { Metadata } from "next";
import "highlight.js/styles/github.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "アプレンティス 学習アシスタント",
  description:
    "アプレンティスの QUEST / Skill Doc 学習を支援する、答えではなくヒントを渡す AI 家庭教師",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
