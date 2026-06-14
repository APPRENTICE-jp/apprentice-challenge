/**
 * 教材バンドルスクリプト
 *
 * リポジトリ直下の skilldoc/ と quest/ にある Markdown を走査し、
 * src/lib/curriculum.generated.ts を生成する。
 * これにより実行時のファイルシステム読み取りが不要になり、Vercel 上でも堅牢に動く。
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SOURCES = ["skilldoc", "quest"];
const OUT_FILE = path.resolve(__dirname, "..", "src", "lib", "curriculum.generated.ts");

interface Material {
  slug: string; // 例: "quest/linux/PASSWORD_MANAGER"
  title: string; // 先頭の # 見出し
  category: string; // 例: "skilldoc" / "quest/linux"
  path: string; // リポジトリ相対パス
  content: string; // Markdown 全文
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

async function main() {
  const materials: Material[] = [];

  for (const source of SOURCES) {
    const root = path.join(REPO_ROOT, source);
    const files = await walk(root);
    for (const file of files) {
      const rel = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
      const content = await fs.readFile(file, "utf8");
      const slug = rel.replace(/\.md$/, "");
      const category = path.dirname(rel).replace(/\\/g, "/");
      materials.push({
        slug,
        title: extractTitle(content, path.basename(rel)),
        category,
        path: rel,
        content,
      });
    }
  }

  // カテゴリ→ファイル名で安定ソート
  materials.sort((a, b) => a.slug.localeCompare(b.slug));

  const header = `// このファイルは scripts/build-curriculum.ts により自動生成されます。直接編集しないでください。\n`;
  const typeDef = `export interface Material {\n  slug: string;\n  title: string;\n  category: string;\n  path: string;\n  content: string;\n}\n\n`;
  const data = `export const CURRICULUM: Material[] = ${JSON.stringify(materials, null, 2)};\n`;

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, header + typeDef + data, "utf8");

  console.log(`[build-curriculum] ${materials.length} 件の教材を ${path.relative(process.cwd(), OUT_FILE)} に出力しました`);
}

main().catch((err) => {
  console.error("[build-curriculum] 失敗:", err);
  process.exit(1);
});
