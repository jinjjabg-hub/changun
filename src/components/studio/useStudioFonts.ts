"use client";

import { useEffect, useState } from "react";
import { currentFonts, loadFonts, type FontNeed, type FontSet } from "@/studio/fonts";

/**
 * 필요한 글꼴을 받아 둔다. 받는 동안은 이미 받은 글꼴로(없으면 어림 폭으로) 그리고,
 * 새 글꼴이 도착하면 다시 그린다. 처음 프리텐다드가 오기 전까지는 null.
 */
export function useStudioFonts(needs: FontNeed[] = []): FontSet | null {
  const [version, setVersion] = useState(0);
  const key = Array.from(new Set(needs.map((n) => `${n.family ?? "pretendard"}:${n.weight}`))).sort().join("|");
  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|").map((k) => { const [family, w] = k.split(":"); return { family, weight: Number(w) } as FontNeed; }) : [];
    loadFonts(list).then(() => alive && setVersion((v) => v + 1), () => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return version === 0 ? null : currentFonts();
}
