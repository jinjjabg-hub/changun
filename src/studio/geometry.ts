import { textWidth, type FontSet } from "./fonts";
import { PT_MM, resolveText, type CardInfo, type El, type TextEl } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextLayout {
  text: string;
  /** 자동 축소가 반영된 실제 글자 크기 (mm) */
  sizeMm: number;
  /** 왼쪽 끝 x */
  left: number;
  width: number;
}

/** 글자 한 줄의 실제 배치. 화면 렌더링, 인쇄 검사, PDF 출력이 모두 이 결과를 쓴다. */
export function layoutText(el: TextEl, info: CardInfo, fonts: FontSet | null): TextLayout {
  const text = resolveText(el, info);
  let sizeMm = el.size * PT_MM;
  let width = textWidth(fonts, text, sizeMm, el.weight, el.tracking);
  if (el.maxW && width > el.maxW) {
    // 최소 60%까지만 줄인다. 그래도 넘치면 인쇄 검사에서 경고한다
    const k = Math.max(0.6, el.maxW / width);
    sizeMm *= k;
    width *= k;
  }
  const left = el.align === "center" ? el.x - width / 2 : el.align === "right" ? el.x - width : el.x;
  return { text, sizeMm, left, width };
}

export function boxOf(el: El, info: CardInfo, fonts: FontSet | null): Box | null {
  switch (el.type) {
    case "text": {
      const t = layoutText(el, info, fonts);
      if (!t.text) return null;
      return { x: t.left, y: el.y - t.sizeMm * 0.82, w: t.width, h: t.sizeMm * 1.08 };
    }
    case "rect":
      return { x: el.x, y: el.y, w: el.w, h: el.h };
    case "image":
      return info[el.bind] ? { x: el.x, y: el.y, w: el.w, h: el.h } : null;
    case "qr":
      return info.qrUrl.trim() ? { x: el.x, y: el.y, w: el.size, h: el.size } : null;
    case "circle":
      return { x: el.cx - el.r, y: el.cy - el.r, w: el.r * 2, h: el.r * 2 };
    case "line": {
      const pad = Math.max(el.width, 0.6) / 2;
      return { x: Math.min(el.x1, el.x2) - pad, y: Math.min(el.y1, el.y2) - pad, w: Math.abs(el.x2 - el.x1) + pad * 2, h: Math.abs(el.y2 - el.y1) + pad * 2 };
    }
    case "poly": {
      const xs = el.points.map((p) => p[0]);
      const ys = el.points.map((p) => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
  }
}

/** 객체를 (dx, dy) mm 만큼 옮긴 복사본 */
export function moved(el: El, dx: number, dy: number): El {
  const r = (n: number) => Math.round(n * 100) / 100;
  switch (el.type) {
    case "text":
    case "rect":
    case "image":
    case "qr":
      return { ...el, x: r(el.x + dx), y: r(el.y + dy) };
    case "circle":
      return { ...el, cx: r(el.cx + dx), cy: r(el.cy + dy) };
    case "line":
      return { ...el, x1: r(el.x1 + dx), y1: r(el.y1 + dy), x2: r(el.x2 + dx), y2: r(el.y2 + dy) };
    case "poly":
      return { ...el, points: el.points.map(([x, y]) => [r(x + dx), r(y + dy)] as [number, number]) };
  }
}
