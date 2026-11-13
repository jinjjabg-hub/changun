import type { Font } from "opentype.js";
import type { Weight } from "./types";

/** 화면 표시(@font-face)와 PDF 윤곽선 변환에 같은 폰트 파일을 쓴다 → 화면과 인쇄물의 글자 폭이 일치한다. */
export const FONT_FAMILY = "CardStudio Pretendard";
const FILES: Record<Weight, string> = { 300: "Pretendard-Light.otf", 400: "Pretendard-Regular.otf", 600: "Pretendard-SemiBold.otf", 800: "Pretendard-ExtraBold.otf" };
export const WEIGHTS: { value: Weight; name: string }[] = [
  { value: 300, name: "가늘게" },
  { value: 400, name: "보통" },
  { value: 600, name: "굵게" },
  { value: 800, name: "아주 굵게" },
];

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const fontUrl = (w: Weight) => `${base}/studio/fonts/${FILES[w]}`;

export const fontFaceCss = (Object.keys(FILES) as unknown as Weight[])
  .map((w) => `@font-face{font-family:"${FONT_FAMILY}";font-weight:${w};font-style:normal;font-display:swap;src:url("${fontUrl(Number(w) as Weight)}") format("opentype");}`)
  .join("");

export type FontSet = Record<Weight, Font>;

let cache: Promise<FontSet> | null = null;

/** 네 가지 굵기를 한 번만 내려받아 파싱한다 */
export function loadFonts(): Promise<FontSet> {
  cache ??= (async () => {
    const { parse } = await import("opentype.js");
    const entries = await Promise.all(
      (Object.keys(FILES) as unknown as Weight[]).map(async (k) => {
        const w = Number(k) as Weight;
        const res = await fetch(fontUrl(w));
        if (!res.ok) throw new Error(`font ${w}`);
        return [w, parse(await res.arrayBuffer())] as const;
      }),
    );
    return Object.fromEntries(entries) as FontSet;
  })();
  cache.catch(() => {
    cache = null;
  });
  return cache;
}

/** 글자 폭(mm). 폰트가 아직 없으면 글자 종류별 평균 폭으로 어림한다. */
export function textWidth(fonts: FontSet | null, text: string, sizeMm: number, weight: Weight, tracking = 0): number {
  if (!text) return 0;
  const spacing = tracking * sizeMm * text.length;
  if (fonts) return fonts[weight].getAdvanceWidth(text, sizeMm) + spacing;
  let em = 0;
  for (const ch of text) em += ch.charCodeAt(0) > 0x2e7f ? 0.92 : ch === " " ? 0.28 : /[A-Z0-9@]/.test(ch) ? 0.64 : 0.52;
  return em * sizeMm * (1 + (weight - 400) / 4000) + spacing;
}
