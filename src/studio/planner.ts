import { INDUSTRIES, paletteById } from "./palettes";
import { TEMPLATES, type Template } from "./templates";
import { CARD, type CardInfo, type Design, type El, type Side } from "./types";

/**
 * 디자인 기획 엔진.
 *
 * 지금은 "데모 모드": 업종·분위기·색 취향으로 템플릿 4종과 색 조합을 고른다 (AI 호출 없음).
 * 나중에 LLM을 붙일 때는 planDesigns 와 같은 입력·출력을 가진 구현으로 바꾸면 되고,
 * LLM이 돌려준 결과도 sanitizeDesign 을 거쳐 범위를 벗어난 좌표·크기를 보정한다.
 */

export interface PlanRequest {
  info: CardInfo;
  /** 같은 정보로 다른 시안을 받고 싶을 때 바꾸는 값 */
  seed: number;
}

/** 시드 고정 난수 (같은 입력 → 같은 시안) */
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function rank(info: CardInfo, seed: number, shown: Set<string> = new Set()): { t: Template; score: number }[] {
  const rand = rng(seed + 1);
  return TEMPLATES.map((t) => {
    const industry = t.industries.indexOf(info.industry);
    let score = industry === 0 ? 5 : industry > 0 ? 3 : 0;
    // 직전에 보여준 시안은 뒤로 미뤄 "다른 시안 보기"가 실제로 다른 시안을 내놓게 한다
    if (shown.has(t.id)) score -= 4.5;
    if (info.mood !== "any" && t.moods.includes(info.mood)) score += 2.5;
    if (info.photo && (t.id === "education" || t.id === "medical")) score += 1.5;
    return { t, score: score + rand() * 2.2 };
  })
    .sort((a, b) => b.score - a.score);
}

function palettesFor(info: CardInfo, seed: number): string[] {
  const list = INDUSTRIES.find((i) => i.id === info.industry)?.palettes ?? INDUSTRIES[0].palettes;
  if (info.color !== "auto") {
    // 고른 색을 2개 시안에, 나머지는 업종 추천색으로 → 비교할 거리를 남긴다
    const rest = list.filter((p) => p !== info.color);
    return [info.color, rest[seed % rest.length], info.color, rest[(seed + 1) % rest.length]];
  }
  return [0, 1, 2, 3].map((i) => list[(i + seed) % list.length]);
}

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const HEX = /^#[0-9a-f]{6}$/i;
const color = (c: string, fallback: string) => (c === "none" || HEX.test(c) ? c : fallback);

/** 좌표·크기·색이 허용 범위를 벗어나면 보정한다. 지원하지 않는 객체는 버린다. */
export function sanitizeSide(side: Side): Side {
  const B = CARD.bleed;
  const X = (v: number) => clamp(v, -B, CARD.w + B);
  const Y = (v: number) => clamp(v, -B, CARD.h + B);
  const elements: El[] = [];
  for (const el of side.elements) {
    switch (el.type) {
      case "text":
        elements.push({ ...el, x: X(el.x), y: Y(el.y), size: clamp(el.size, 4, 80), color: color(el.color, "#111111"), tracking: el.tracking === undefined ? undefined : clamp(el.tracking, -0.05, 0.6) });
        break;
      case "rect":
        elements.push({ ...el, x: X(el.x), y: Y(el.y), w: clamp(el.w, 0.1, CARD.w + B * 2), h: clamp(el.h, 0.1, CARD.h + B * 2), fill: color(el.fill, "#111111") });
        break;
      case "line":
        elements.push({ ...el, x1: X(el.x1), y1: Y(el.y1), x2: X(el.x2), y2: Y(el.y2), width: clamp(el.width, 0.1, 5), stroke: color(el.stroke, "#111111") });
        break;
      case "circle":
        elements.push({ ...el, cx: clamp(el.cx, -40, CARD.w + 40), cy: clamp(el.cy, -40, CARD.h + 40), r: clamp(el.r, 0.2, 60), fill: color(el.fill, "#111111") });
        break;
      case "poly":
        if (el.points.length >= 3) elements.push({ ...el, points: el.points.map(([x, y]) => [X(x), Y(y)] as [number, number]), fill: color(el.fill, "#111111") });
        break;
      case "image":
        elements.push({ ...el, x: X(el.x), y: Y(el.y), w: clamp(el.w, 2, CARD.w), h: clamp(el.h, 2, CARD.h) });
        break;
      case "qr":
        elements.push({ ...el, x: clamp(el.x, 0, CARD.w - 8), y: clamp(el.y, 0, CARD.h - 8), size: clamp(el.size, 8, 40), color: color(el.color, "#111111") });
        break;
    }
  }
  return { bg: color(side.bg, "#ffffff") === "none" ? "#ffffff" : color(side.bg, "#ffffff"), elements };
}

/** 좌우를 뒤집은 면 (같은 템플릿으로 다른 인상의 시안을 만든다) */
export function mirrorSide(side: Side): Side {
  const W = CARD.w;
  const flipAlign = (a: "left" | "center" | "right") => (a === "left" ? "right" : a === "right" ? "left" : a);
  return {
    bg: side.bg,
    elements: side.elements.map((el): El => {
      switch (el.type) {
        case "text": return { ...el, x: W - el.x, align: flipAlign(el.align) };
        case "rect": return { ...el, x: W - el.x - el.w };
        case "image": return { ...el, x: W - el.x - el.w };
        case "qr": return { ...el, x: W - el.x - el.size };
        case "circle": return { ...el, cx: W - el.cx };
        case "line": return { ...el, x1: W - el.x1, x2: W - el.x2 };
        case "poly": return { ...el, points: el.points.map(([x, y]) => [W - x, y] as [number, number]) };
      }
    }),
  };
}

export function buildDesign(templateId: string, paletteId: string, info: CardInfo, id: string, mirror = false): Design | null {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return null;
  const pal = paletteById(paletteId);
  const { front, back } = t.build({ info, pal });
  const f = mirror && t.mirror ? mirrorSide(front) : front;
  return { id, templateId: t.id, templateName: t.name, concept: t.concept, palette: pal, front: sanitizeSide(f), back: sanitizeSide(back) };
}

/** 같은 배치 계열이 겹치지 않게 4종을 고른다 (모자라면 순위대로 채움) */
function pickFour(info: CardInfo, seed: number, shown?: Set<string>): Template[] {
  const ranked = rank(info, seed, shown);
  const top = ranked[0]?.score ?? 0;
  const picked: Template[] = [];
  // 1) 충분히 어울리는 것 중에서 배치 계열이 겹치지 않게
  for (const { t, score } of ranked) if (picked.length < 4 && score >= top - 3.5 && !picked.some((p) => p.family === t.family)) picked.push(t);
  // 2) 모자라면 점수 순으로 채움
  for (const { t } of ranked) if (picked.length < 4 && !picked.includes(t)) picked.push(t);
  return picked;
}

/** 서로 다른 레이아웃의 시안 4종 */
export async function planDesigns({ info, seed }: PlanRequest): Promise<Design[]> {
  const prev = seed > 1 ? new Set(pickFour(info, seed - 1).map((t) => t.id)) : new Set<string>();
  const picked = pickFour(info, seed, prev);
  const pals = palettesFor(info, seed);
  const rand = rng(seed + 7);
  return picked.map((t, i) => buildDesign(t.id, pals[i], info, `d${seed}-${i}-${t.id}`, rand() < 0.4)!);
}
