"use client";

import { useEffect, useState } from "react";
import { loadFonts, type FontSet } from "@/studio/fonts";

/** 폰트를 내려받는 동안은 null (어림 폭으로 그린 뒤, 도착하면 정확한 폭으로 다시 그린다) */
export function useStudioFonts(): FontSet | null {
  const [fonts, setFonts] = useState<FontSet | null>(null);
  useEffect(() => {
    let alive = true;
    loadFonts().then((f) => alive && setFonts(f), () => {});
    return () => {
      alive = false;
    };
  }, []);
  return fonts;
}
