import type { Font } from "opentype.js";
import type { Weight } from "./types";

/**
 * CARD STUDIO 글꼴 (모두 SIL OFL 1.1, public/studio/fonts/LICENSE.txt 참고).
 * 화면 표시(@font-face)와 PDF 윤곽선 변환에 같은 파일을 써서 화면과 인쇄물의 글자 모양·폭이 같다.
 * 글꼴 파일은 쓰일 때만 내려받는다.
 */

export type FamilyId = "pretendard" | "myeongjo" | "songmyung" | "blackhan" | "dohyeon" | "jua" | "pen";

export interface Family {
  id: FamilyId;
  name: string;
  /** 어떤 느낌인지 */
  kind: string;
  /** 편집용 SVG 에 적는 실제 글꼴 이름 (일러스트레이터에 설치돼 있으면 그대로 열린다) */
  realName: string;
  files: Partial<Record<Weight, string>>;
}

export const FAMILIES: Family[] = [
  { id: "pretendard", name: "프리텐다드", kind: "깔끔한 고딕", realName: "Pretendard", files: { 300: "Pretendard-Light.otf", 400: "Pretendard-Regular.otf", 600: "Pretendard-SemiBold.otf", 800: "Pretendard-ExtraBold.otf" } },
  { id: "myeongjo", name: "나눔명조", kind: "단정한 명조", realName: "NanumMyeongjo", files: { 400: "NanumMyeongjo-Regular.ttf", 600: "NanumMyeongjo-Bold.ttf", 800: "NanumMyeongjo-ExtraBold.ttf" } },
  { id: "songmyung", name: "송명", kind: "붓으로 쓴 명조", realName: "Song Myung", files: { 400: "SongMyung-Regular.ttf" } },
  { id: "blackhan", name: "블랙한산스", kind: "아주 굵은 제목", realName: "Black Han Sans", files: { 800: "BlackHanSans-Regular.ttf" } },
  { id: "dohyeon", name: "도현", kind: "각진 제목", realName: "Do Hyeon", files: { 600: "DoHyeon-Regular.ttf" } },
  { id: "jua", name: "주아", kind: "둥글고 귀여운", realName: "Jua", files: { 600: "Jua-Regular.ttf" } },
  { id: "pen", name: "나눔손글씨 펜", kind: "손글씨", realName: "Nanum Pen Script", files: { 400: "NanumPenScript-Regular.ttf" } },
];

export const DEFAULT_FAMILY: FamilyId = "pretendard";
export const familyOf = (id: string | undefined): Family => FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];
export const isFamily = (id: unknown): id is FamilyId => FAMILIES.some((f) => f.id === id);

export const WEIGHTS: { value: Weight; name: string }[] = [
  { value: 300, name: "가늘게" },
  { value: 400, name: "보통" },
  { value: 600, name: "굵게" },
  { value: 800, name: "아주 굵게" },
];

/** 그 글꼴에 있는 굵기 중 요청한 굵기에 가장 가까운 것 */
export function resolveWeight(family: Family, w: Weight): Weight {
  const have = (Object.keys(family.files).map(Number) as Weight[]).sort((a, b) => a - b);
  return have.reduce((best, v) => (Math.abs(v - w) < Math.abs(best - w) ? v : best), have[0]);
}

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const fileUrl = (file: string) => `${base}/studio/fonts/${file}`;

/** 화면용 글꼴 이름 */
export const cssFamily = (id: string | undefined) => `"CS-${familyOf(id).id}", "CS-pretendard", sans-serif`;

export const fontFaceCss = FAMILIES.flatMap((fam) =>
  (Object.entries(fam.files) as [string, string][]).map(([w, file]) => {
    // 굵기가 하나뿐인 글꼴은 모든 굵기에 같은 파일을 쓴다 (브라우저가 가짜 굵게를 만들지 않도록)
    const range = Object.keys(fam.files).length === 1 ? "100 900" : w;
    return `@font-face{font-family:"CS-${fam.id}";font-weight:${range};font-style:normal;font-display:swap;src:url("${fileUrl(file)}") format("${file.endsWith(".otf") ? "opentype" : "truetype"}");}`;
  }),
).join("");

/* ───────── 글꼴 파일 불러오기 ───────── */

const loaded = new Map<string, Font>();
const pending = new Map<string, Promise<Font>>();

function loadFile(file: string): Promise<Font> {
  const hit = loaded.get(file);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(file);
  if (!p) {
    p = (async () => {
      const { parse } = await import("opentype.js");
      const res = await fetch(fileUrl(file));
      if (!res.ok) throw new Error(`font ${file}`);
      const font = parse(await res.arrayBuffer());
      loaded.set(file, font);
      return font;
    })();
    pending.set(file, p);
    p.catch(() => pending.delete(file));
  }
  return p;
}

export interface FontSet {
  /** 해당 글꼴·굵기 파일 (아직 안 받았으면 null) */
  get(family: string | undefined, weight: Weight): Font | null;
  has(family: string | undefined, weight: Weight): boolean;
}

/** 지금까지 받은 글꼴로 만든 묶음 */
export function currentFonts(): FontSet {
  const pick = (family: string | undefined, weight: Weight) => {
    const fam = familyOf(family);
    return loaded.get(fam.files[resolveWeight(fam, weight)]!) ?? null;
  };
  return { get: pick, has: (f, w) => pick(f, w) !== null };
}

export type FontNeed = { family: string | undefined; weight: Weight };

/** 필요한 글꼴(+ 빠진 글자를 대신할 프리텐다드)을 받아 둔다 */
export async function loadFonts(needs: FontNeed[] = []): Promise<FontSet> {
  const files = new Set<string>(Object.values(FAMILIES[0].files));
  for (const n of needs) {
    const fam = familyOf(n.family);
    files.add(fam.files[resolveWeight(fam, n.weight)]!);
  }
  await Promise.all([...files].map(loadFile));
  return currentFonts();
}

/* ───────── 글자 배치 ───────── */

export interface Run {
  text: string;
  font: Font;
}

/**
 * 글자열을 글꼴별 조각으로 나눈다. 고른 글꼴에 없는 글자(예: 가운뎃점)는 프리텐다드로 대신한다.
 */
export function runsOf(fonts: FontSet, family: string | undefined, weight: Weight, text: string): Run[] | null {
  const main = fonts.get(family, weight);
  const fallback = fonts.get(DEFAULT_FAMILY, weight);
  if (!main || !fallback) return null;
  const runs: Run[] = [];
  for (const ch of text) {
    const font = main === fallback || ch === " " || main.charToGlyph(ch).index !== 0 ? main : fallback;
    const last = runs[runs.length - 1];
    if (last && last.font === font) last.text += ch;
    else runs.push({ text: ch, font });
  }
  return runs;
}

/** 글자 폭(mm). 글꼴을 아직 못 받았으면 글자 종류별 평균 폭으로 어림한다. */
export function textWidth(fonts: FontSet | null, family: string | undefined, text: string, sizeMm: number, weight: Weight, tracking = 0): number {
  if (!text) return 0;
  const spacing = tracking * sizeMm * Array.from(text).length;
  const runs = fonts ? runsOf(fonts, family, weight, text) : null;
  if (runs) return runs.reduce((w, r) => w + r.font.getAdvanceWidth(r.text, sizeMm), 0) + spacing;
  let em = 0;
  for (const ch of text) em += ch.charCodeAt(0) > 0x2e7f ? 0.92 : ch === " " ? 0.28 : /[A-Z0-9@]/.test(ch) ? 0.64 : 0.52;
  const narrow = family === "pen" ? 0.72 : family === "dohyeon" || family === "blackhan" ? 0.95 : 1;
  return em * sizeMm * narrow * (1 + (weight - 400) / 4000) + spacing;
}

/** 디자인에 쓰인 글꼴 목록 */
export function fontNeeds(sides: { elements: { type: string; font?: string; weight?: Weight }[] }[]): FontNeed[] {
  const out: FontNeed[] = [];
  for (const s of sides) for (const el of s.elements) if (el.type === "text") out.push({ family: el.font, weight: el.weight ?? 400 });
  return out;
}
