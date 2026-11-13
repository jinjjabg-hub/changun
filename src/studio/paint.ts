import type { FontSet } from "./fonts";
import { layoutText } from "./geometry";
import { qrPath } from "./qr";
import type { CardInfo, ImageEl, Side, TextEl } from "./types";

/**
 * 한 면을 "그리기 명령 목록"으로 바꾼다. SVG(윤곽선)와 PDF 출력이 같은 목록을 쓴다.
 * 좌표 변환 함수 map 을 받아 원하는 좌표계(mm 또는 pt)로 바로 경로를 만든다.
 */

export type Paint =
  | { kind: "path"; d: string; fill?: string; stroke?: string; strokeWidth?: number; label: string }
  | { kind: "image"; id: string; x: number; y: number; w: number; h: number; label: string };

export type MapFn = (x: number, y: number) => [number, number];

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** 원을 베지어 곡선 4개로 */
function ellipse(cx: number, cy: number, rx: number, ry: number, map: MapFn) {
  const k = 0.5522847498;
  const p = (x: number, y: number) => map(x, y).map(n).join(" ");
  return (
    `M${p(cx + rx, cy)}` +
    `C${p(cx + rx, cy + ry * k)} ${p(cx + rx * k, cy + ry)} ${p(cx, cy + ry)}` +
    `C${p(cx - rx * k, cy + ry)} ${p(cx - rx, cy + ry * k)} ${p(cx - rx, cy)}` +
    `C${p(cx - rx, cy - ry * k)} ${p(cx - rx * k, cy - ry)} ${p(cx, cy - ry)}` +
    `C${p(cx + rx * k, cy - ry)} ${p(cx + rx, cy - ry * k)} ${p(cx + rx, cy)}Z`
  );
}

function roundRect(x: number, y: number, w: number, h: number, r: number, map: MapFn) {
  const p = (px: number, py: number) => map(px, py).map(n).join(" ");
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return `M${p(x, y)}L${p(x + w, y)}L${p(x + w, y + h)}L${p(x, y + h)}Z`;
  const k = r * (1 - 0.5522847498);
  return (
    `M${p(x + r, y)}L${p(x + w - r, y)}C${p(x + w - k, y)} ${p(x + w, y + k)} ${p(x + w, y + r)}` +
    `L${p(x + w, y + h - r)}C${p(x + w, y + h - k)} ${p(x + w - k, y + h)} ${p(x + w - r, y + h)}` +
    `L${p(x + r, y + h)}C${p(x + k, y + h)} ${p(x, y + h - k)} ${p(x, y + h - r)}` +
    `L${p(x, y + r)}C${p(x, y + k)} ${p(x + k, y)} ${p(x + r, y)}Z`
  );
}

/** 글자를 윤곽선 경로로. 자간이 있으면 글자마다 따로 배치한다. */
export function textOutline(el: TextEl, info: CardInfo, fonts: FontSet, map: MapFn): string {
  const t = layoutText(el, info, fonts);
  if (!t.text) return "";
  const font = fonts[el.weight];
  const pieces: { text: string; x: number }[] = [];
  if (el.tracking) {
    let x = t.left;
    for (const ch of t.text) {
      pieces.push({ text: ch, x });
      x += font.getAdvanceWidth(ch, t.sizeMm) + el.tracking * t.sizeMm;
    }
  } else {
    pieces.push({ text: t.text, x: t.left });
  }
  let d = "";
  const p = (x: number, y: number) => map(x, y).map(n).join(" ");
  for (const piece of pieces) {
    for (const c of font.getPath(piece.text, piece.x, el.y, t.sizeMm).commands) {
      if (c.type === "M") d += `M${p(c.x, c.y)}`;
      else if (c.type === "L") d += `L${p(c.x, c.y)}`;
      else if (c.type === "C") d += `C${p(c.x1, c.y1)} ${p(c.x2, c.y2)} ${p(c.x, c.y)}`;
      else if (c.type === "Q") d += `Q${p(c.x1, c.y1)} ${p(c.x, c.y)}`;
      else d += "Z";
    }
  }
  return d;
}

/** 이미지가 실제로 놓이는 사각형. 로고는 비율을 유지해 상자 안에 맞추고, 사진은 상자를 가득 채운다(잘라냄). */
export function imageRect(el: ImageEl, info: CardInfo) {
  const a = info[el.bind];
  if (!a) return null;
  if (el.bind === "photo") return { x: el.x, y: el.y, w: el.w, h: el.h };
  const s = Math.min(el.w / a.w, el.h / a.h);
  const w = a.w * s;
  const h = a.h * s;
  return { x: el.x + (el.w - w) / 2, y: el.y + (el.h - h) / 2, w, h };
}

export function paintSide(side: Side, info: CardInfo, fonts: FontSet, map: MapFn, scale: number): Paint[] {
  const out: Paint[] = [];
  const p = (x: number, y: number) => map(x, y).map(n).join(" ");
  for (const el of side.elements) {
    const label = el.label ?? el.type;
    switch (el.type) {
      case "text": {
        const d = textOutline(el, info, fonts, map);
        if (d) out.push({ kind: "path", d, fill: el.color, label });
        break;
      }
      case "rect": {
        const d = roundRect(el.x, el.y, el.w, el.h, el.radius ?? 0, map);
        out.push(el.stroke ? { kind: "path", d, stroke: el.stroke, strokeWidth: (el.strokeWidth ?? 0.25) * scale, label } : { kind: "path", d, fill: el.fill, label });
        break;
      }
      case "circle": {
        const d = ellipse(el.cx, el.cy, el.r, el.r, map);
        out.push(el.stroke ? { kind: "path", d, stroke: el.stroke, strokeWidth: (el.strokeWidth ?? 0.25) * scale, label } : { kind: "path", d, fill: el.fill, label });
        break;
      }
      case "line":
        out.push({ kind: "path", d: `M${p(el.x1, el.y1)}L${p(el.x2, el.y2)}`, stroke: el.stroke, strokeWidth: el.width * scale, label });
        break;
      case "poly":
        out.push({ kind: "path", d: el.points.map(([x, y], i) => `${i ? "L" : "M"}${p(x, y)}`).join("") + "Z", fill: el.fill, label });
        break;
      case "image": {
        const r = imageRect(el, info);
        if (r) out.push({ kind: "image", id: el.id, ...r, label });
        break;
      }
      case "qr": {
        const q = qrPath(info.qrUrl);
        if (!q) break;
        const k = el.size / q.size;
        let d = "";
        for (const m of q.path.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
          const [x, y, run] = [Number(m[1]), Number(m[2]), Number(m[3])];
          const x0 = el.x + x * k, y0 = el.y + y * k, x1 = x0 + run * k, y1 = y0 + k;
          d += `M${p(x0, y0)}L${p(x1, y0)}L${p(x1, y1)}L${p(x0, y1)}Z`;
        }
        out.push({ kind: "path", d, fill: el.color, label });
        break;
      }
    }
  }
  return out;
}
