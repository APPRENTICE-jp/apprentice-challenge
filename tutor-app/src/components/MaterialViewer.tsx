"use client";

import { useEffect, useRef } from "react";
import type { Material } from "@/lib/curriculum.generated";
import Markdown from "./Markdown";

export default function MaterialViewer({ material }: { material: Material }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // 教材を切り替えたらスクロール位置を先頭へ
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [material.slug]);

  return (
    <div className="pane-body" ref={bodyRef}>
      <Markdown>{material.content}</Markdown>
    </div>
  );
}
