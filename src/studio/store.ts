import { loadImage, readAsDataUrl } from "@/lib/imageFile";
import type { Asset, CardInfo, Design, El, Palette, Side } from "./types";

const KEY = "changun.studio.v1";

export interface Saved {
  info: CardInfo;
  step: number;
  seed: number;
  design: Design | null;
}

export function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    return v && typeof v === "object" && v.info ? v : null;
  } catch {
    return null;
  }
}

/** 저장에 실패하면(용량 초과 등) false */
export function save(v: Saved): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/**
 * 올린 이미지를 브라우저 저장소에 넣을 수 있는 크기로 줄인다 (긴 변 1600px).
 * 명함에서 로고·사진은 30mm 안팎으로 쓰이므로 1600px이면 인쇄 해상도로 충분하다.
 */
export async function fileToAsset(file: File): Promise<Asset> {
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error("PNG, JPG, WEBP, SVG 이미지만 올릴 수 있어요.");
  if (file.size > 15 * 1024 * 1024) throw new Error("15MB 이하 이미지만 올릴 수 있어요.");
  const url = await readAsDataUrl(file);
  const im = await loadImage(url);
  const max = 1600;
  const natW = im.naturalWidth || 800;
  const natH = im.naturalHeight || 800;
  const k = Math.min(1, max / Math.max(natW, natH));
  const isVector = file.type === "image/svg+xml";
  if (k === 1 && !isVector && url.length < 1_500_000) return { name: file.name, url, w: natW, h: natH };
  const scale = isVector ? max / Math.max(natW, natH) : k;
  const c = document.createElement("canvas");
  c.width = Math.round(natW * scale);
  c.height = Math.round(natH * scale);
  c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
  return { name: file.name, url: c.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.92), w: c.width, h: c.height };
}

/** 색 조합만 바꾼다. 위치·크기 등 편집 내용은 그대로 두고, 이전 조합의 색을 쓰던 곳만 새 색으로 옮긴다. */
export function recolor(design: Design, next: Palette): Design {
  const prev = design.palette;
  const table = new Map<string, string>();
  for (const k of ["paper", "ink", "sub", "accent", "dark", "onDark"] as const) {
    const from = prev[k].toLowerCase();
    if (!table.has(from)) table.set(from, next[k]);
  }
  const c = (v: string) => table.get(v.toLowerCase()) ?? v;
  const side = (s: Side): Side => ({
    bg: c(s.bg),
    elements: s.elements.map((el): El => {
      switch (el.type) {
        case "text":
        case "qr":
          return { ...el, color: c(el.color) };
        case "rect":
        case "circle":
          return { ...el, fill: c(el.fill), stroke: el.stroke ? c(el.stroke) : el.stroke };
        case "poly":
          return { ...el, fill: c(el.fill) };
        case "line":
          return { ...el, stroke: c(el.stroke) };
        default:
          return el;
      }
    }),
  });
  return { ...design, palette: next, front: side(design.front), back: side(design.back) };
}
