import { loadImage } from "@/lib/imageFile";
import { downloadBytes } from "@/lib/printPdf";
import { FONT_FAMILY, type FontSet } from "./fonts";
import { layoutText } from "./geometry";
import { paintSide, type MapFn, type Paint } from "./paint";
import { CARD, type CardInfo, type Design, type ImageEl, type Side, type SideKey } from "./types";

const PT = 72 / 25.4;
/** 재단선 표시를 그릴 바깥 여유 (mm) */
const SLUG = 6;

interface Prepared {
  url: string;
  bytes: Uint8Array;
}

/**
 * 이미지를 출력용으로 준비한다.
 * 사진은 상자 비율로 잘라내고(둥근 사진은 원형으로) PNG로 굽는다. 로고는 원본 화질 그대로 PNG로 옮긴다.
 */
async function prepareImage(el: ImageEl, info: CardInfo): Promise<Prepared | null> {
  const a = info[el.bind];
  if (!a) return null;
  const im = await loadImage(a.url);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  if (el.bind === "photo") {
    const s = Math.max(el.w / a.w, el.h / a.h); // mm per px (cover)
    const sw = el.w / s;
    const sh = el.h / s;
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    if (el.round) {
      ctx.beginPath();
      ctx.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(im, (a.w - sw) / 2, (a.h - sh) / 2, sw, sh, 0, 0, c.width, c.height);
  } else {
    c.width = a.w;
    c.height = a.h;
    ctx.drawImage(im, 0, 0);
  }
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) return null;
  return { url: c.toDataURL("image/png"), bytes: new Uint8Array(await blob.arrayBuffer()) };
}

async function prepareAll(side: Side, info: CardInfo) {
  const map = new Map<string, Prepared>();
  for (const el of side.elements) {
    if (el.type !== "image") continue;
    const p = await prepareImage(el, info);
    if (p) map.set(el.id, p);
  }
  return map;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f = (v: number) => (Math.round(v * 1000) / 1000).toString();

/* ───────────────────────── SVG ───────────────────────── */

const svgOpen = () => {
  const B = CARD.bleed;
  const W = CARD.w + B * 2;
  const H = CARD.h + B * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}mm" height="${H}mm" viewBox="${-B} ${-B} ${W} ${H}">\n`;
};

const paintToSvg = (p: Paint, images: Map<string, Prepared>) => {
  if (p.kind === "image") {
    const im = images.get(p.id);
    return im ? `  <image id="${esc(p.id)}" x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w)}" height="${f(p.h)}" xlink:href="${im.url}" href="${im.url}"/>\n` : "";
  }
  const paint = p.stroke ? `fill="none" stroke="${p.stroke}" stroke-width="${f(p.strokeWidth ?? 0.25)}"` : `fill="${p.fill}"`;
  return `  <path ${paint} d="${p.d}"/>\n`;
};

/**
 * SVG 한 면.
 *  - outline=false: 글자가 <text> 로 남아 일러스트레이터 등에서 고칠 수 있다 (Pretendard 글꼴 필요)
 *  - outline=true : 글자가 윤곽선으로 바뀌어 어디서 열어도 모양이 같다
 */
export async function sideToSvg(side: Side, info: CardInfo, fonts: FontSet, outline: boolean): Promise<string> {
  const images = await prepareAll(side, info);
  const B = CARD.bleed;
  const id: MapFn = (x, y) => [x, y];
  let body = `  <rect id="background" x="${-B}" y="${-B}" width="${CARD.w + B * 2}" height="${CARD.h + B * 2}" fill="${side.bg}"/>\n`;
  if (outline) {
    for (const p of paintSide(side, info, fonts, id, 1)) body += paintToSvg(p, images);
  } else {
    for (const el of side.elements) {
      if (el.type === "text") {
        const t = layoutText(el, info, fonts);
        if (!t.text) continue;
        const spacing = el.tracking ? ` letter-spacing="${f(el.tracking * t.sizeMm)}"` : "";
        body += `  <text id="${esc(el.id)}" x="${f(t.left)}" y="${f(el.y)}" font-family="Pretendard, '${FONT_FAMILY}', sans-serif" font-weight="${el.weight}" font-size="${f(t.sizeMm)}"${spacing} fill="${el.color}" xml:space="preserve">${esc(t.text)}</text>\n`;
      } else {
        for (const p of paintSide({ bg: side.bg, elements: [el] }, info, fonts, id, 1)) body += paintToSvg(p, images);
      }
    }
  }
  return `${svgOpen()}${body}</svg>\n`;
}

/* ───────────────────────── PDF ───────────────────────── */

/** 화면색(RGB) → CMYK. ICC 프로파일 없이 계산식으로 바꾼 값이다. 무채색은 먹(K)만 쓴다. */
export function hexToCmyk(hex: string): [number, number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return [0, 0, 0, 1];
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
}

export async function designToPdf(design: Design, info: CardInfo, fonts: FontSet, sidesToPrint: SideKey[], paperName?: string): Promise<Uint8Array> {
  const { PDFDocument, cmyk, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`${info.name || "명함"} 명함 ${CARD.w}×${CARD.h}mm`);
  doc.setCreator("CARD STUDIO (시연)");
  if (paperName) {
    doc.setSubject(`용지: ${paperName}`);
    doc.setKeywords([`용지: ${paperName}`, `재단 ${CARD.w}x${CARD.h}mm`, `도련 ${CARD.bleed}mm`]);
  }

  const B = CARD.bleed;
  const pageW = (CARD.w + (B + SLUG) * 2) * PT;
  const pageH = (CARD.h + (B + SLUG) * 2) * PT;
  // 명함 좌표(mm, 왼쪽 위 원점) → drawSvgPath 좌표(pt, 페이지 왼쪽 위 원점, 아래로 증가)
  const map: MapFn = (x, y) => [(x + B + SLUG) * PT, (y + B + SLUG) * PT];
  const col = (hex: string) => cmyk(...hexToCmyk(hex));
  const bleedBox = { x: SLUG * PT, y: SLUG * PT, w: (CARD.w + B * 2) * PT, h: (CARD.h + B * 2) * PT };
  const trimBox = { x: (SLUG + B) * PT, y: (SLUG + B) * PT, w: CARD.w * PT, h: CARD.h * PT };

  for (const key of sidesToPrint) {
    const side = design[key];
    const images = await prepareAll(side, info);
    const page = doc.addPage([pageW, pageH]);
    page.setBleedBox(bleedBox.x, bleedBox.y, bleedBox.w, bleedBox.h);
    page.setTrimBox(trimBox.x, trimBox.y, trimBox.w, trimBox.h);

    // 도련 밖으로 나가는 도형은 잘라낸다
    page.pushOperators(pushGraphicsState(), rectangle(bleedBox.x, bleedBox.y, bleedBox.w, bleedBox.h), clip(), endPath());
    page.drawRectangle({ x: bleedBox.x, y: bleedBox.y, width: bleedBox.w, height: bleedBox.h, color: col(side.bg) });
    for (const p of paintSide(side, info, fonts, map, PT)) {
      if (p.kind === "image") {
        const im = images.get(p.id);
        if (!im) continue;
        const png = await doc.embedPng(im.bytes);
        const [x, y] = map(p.x, p.y + p.h);
        page.drawImage(png, { x, y: pageH - y, width: p.w * PT, height: p.h * PT });
      } else if (p.stroke) {
        page.drawSvgPath(p.d, { x: 0, y: pageH, borderColor: col(p.stroke), borderWidth: p.strokeWidth ?? 0.7 });
      } else if (p.fill && p.fill !== "none") {
        page.drawSvgPath(p.d, { x: 0, y: pageH, color: col(p.fill) });
      }
    }
    page.pushOperators(popGraphicsState());

    // 재단선 표시 (도련 바깥)
    const k = cmyk(0, 0, 0, 1);
    const a = 1 * PT;
    const z = (SLUG - 1.5) * PT;
    for (const x of [trimBox.x, trimBox.x + trimBox.w]) {
      page.drawLine({ start: { x, y: a }, end: { x, y: z }, thickness: 0.25, color: k });
      page.drawLine({ start: { x, y: pageH - z }, end: { x, y: pageH - a }, thickness: 0.25, color: k });
    }
    for (const y of [trimBox.y, trimBox.y + trimBox.h]) {
      page.drawLine({ start: { x: a, y }, end: { x: z, y }, thickness: 0.25, color: k });
      page.drawLine({ start: { x: pageW - z, y }, end: { x: pageW - a, y }, thickness: 0.25, color: k });
    }
  }
  return doc.save();
}

export function downloadText(text: string, filename: string, type: string) {
  downloadBytes(new TextEncoder().encode(text), filename, type);
}

export { downloadBytes };
