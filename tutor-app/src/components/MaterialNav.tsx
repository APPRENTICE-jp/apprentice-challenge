"use client";

import type { Material } from "@/lib/curriculum.generated";

export default function MaterialNav({
  materials,
  selectedSlug,
  onSelect,
}: {
  materials: Material[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  // カテゴリごとにグループ化して <optgroup> 表示
  const groups = new Map<string, Material[]>();
  for (const m of materials) {
    const list = groups.get(m.category) ?? [];
    list.push(m);
    groups.set(m.category, list);
  }

  return (
    <select
      className="nav-select"
      value={selectedSlug}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="教材を選択"
    >
      {[...groups.entries()].map(([category, items]) => (
        <optgroup key={category} label={category}>
          {items.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.title}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
