"use client";

import { useMemo, useState } from "react";
import type { Material } from "@/lib/curriculum.generated";
import MaterialNav from "./MaterialNav";
import MaterialViewer from "./MaterialViewer";
import ChatPanel from "./ChatPanel";

export default function TutorApp({ materials }: { materials: Material[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    materials[0]?.slug ?? "",
  );

  const selected = useMemo(
    () => materials.find((m) => m.slug === selectedSlug) ?? materials[0],
    [materials, selectedSlug],
  );

  if (!selected) {
    return <div className="chat-empty">教材が見つかりませんでした。</div>;
  }

  return (
    <div className="app">
      <section className="pane left">
        <div className="pane-header">
          <h1>教材</h1>
          <MaterialNav
            materials={materials}
            selectedSlug={selected.slug}
            onSelect={setSelectedSlug}
          />
        </div>
        <MaterialViewer material={selected} />
      </section>

      <section className="pane right">
        <ChatPanel questSlug={selected.slug} questTitle={selected.title} />
      </section>
    </div>
  );
}
