"use client";

import { useId, useRef, useState } from "react";
import type { Feel, Paper } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * 용지·소재 재질 보여주기.
 *
 * 화면으로 종이를 똑같이 보여줄 수는 없으므로, 고객이 실제로 궁금한 네 가지를
 * "기준 용지와 나란히" 놓고 차이가 드러나게 그린다.
 *   1) 색이 어떻게 나오나   2) 빛에 비추면 어떤가   3) 확대하면 표면이 어떤가   4) 얼마나 두꺼운가
 */

export const DEFAULT_FEEL: Feel = { tex: "smooth", gloss: 1, tone: "#ffffff", rough: 1 };

export const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
};

const isTinted = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return Math.max(r, g, b) - Math.min(r, g, b) > 10 && r + g + b > 600;
};

/* ───────────────────────── 두께 ───────────────────────── */

/** 예상 두께(mm). 평량(g)이 있으면 종이 종류별 부피를 곱하고, μ는 그대로, 없으면 두께감 단계로 어림한다 */
export function caliperMm(p: Paper): number {
  const f = p.feel ?? DEFAULT_FEEL;
  const micron = /(\d{2,3})\s*μ/.exec(p.name);
  if (micron) return Number(micron[1]) / 1000;
  const g = /(\d{2,3})\s*g/.exec(p.name);
  if (g) {
    const bulk = f.tex === "kraft" ? 1.4 : f.tex === "felt" || f.tex === "linen" || f.tex === "laid" ? 1.35 : f.tex === "velvet" ? 1.2 : f.tex === "pearl" ? 1.0 : f.gloss >= 1 ? 0.95 : 1.25;
    return (Number(g[1]) * bulk) / 1000;
  }
  // 두께감 단계 → mm (1: 스티커 수준 0.15mm … 5: 0.9mm)
  return [0.3, 0.15, 0.3, 0.45, 0.6, 0.9][f.thick ?? 0];
}

/** 두께감 1~5 */
export function thickness(p: Paper): number {
  const mm = caliperMm(p);
  return mm < 0.13 ? 1 : mm < 0.2 ? 2 : mm < 0.3 ? 3 : mm < 0.4 ? 4 : 5;
}

/* ───────────────────────── 표면 (입체 질감) ───────────────────────── */

type Layer = { freq: string; oct: number; seed: number };
interface Relief {
  layers: Layer[];
  /** 요철 높이 */
  height: number;
  /** 질감을 살짝 뭉갤 정도 */
  soften?: number;
}

/** 표면 무늬별 요철. 빛을 비스듬히 비춰 입체감을 만든다 */
function reliefOf(f: Feel): Relief | null {
  const r = [0.6, 1, 1.5, 2.2][f.rough];
  switch (f.tex) {
    case "smooth": return { layers: [{ freq: "1.4", oct: 1, seed: 2 }], height: 0.08 * r };
    case "grain": return { layers: [{ freq: "0.7", oct: 3, seed: 4 }], height: 0.7 * r };
    case "felt": return { layers: [{ freq: "0.06", oct: 4, seed: 7 }, { freq: "0.9", oct: 2, seed: 3 }], height: 1.0 * r };
    case "linen": return { layers: [{ freq: "0.9 0.06", oct: 2, seed: 5 }, { freq: "0.06 0.9", oct: 2, seed: 9 }], height: 0.9 * r, soften: 0.25 };
    case "laid": return { layers: [{ freq: "0.012 0.55", oct: 2, seed: 6 }, { freq: "0.8", oct: 2, seed: 1 }], height: 1.4 * r };
    case "kraft": return { layers: [{ freq: "0.035 0.45", oct: 3, seed: 8 }, { freq: "0.6", oct: 2, seed: 2 }], height: 1.2 * r };
    case "velvet": return { layers: [{ freq: "0.9", oct: 2, seed: 3 }], height: 0.5, soften: 0.7 };
    case "weave": return { layers: [{ freq: "0.55 0.035", oct: 2, seed: 4 }, { freq: "0.035 0.55", oct: 2, seed: 6 }], height: 1.3 * r, soften: 0.2 };
    case "metal": return { layers: [{ freq: "0.015 1.4", oct: 2, seed: 2 }], height: 0.5 };
    case "pearl": return { layers: [{ freq: "1.6", oct: 1, seed: 2 }], height: 0.12 };
    case "mesh": return { layers: [{ freq: "0.55 0.035", oct: 2, seed: 4 }, { freq: "0.035 0.55", oct: 2, seed: 6 }], height: 1.4 };
    default: return null;
  }
}

/**
 * 재질 표면 (가로 200 × 세로 120 좌표).
 * zoom > 1 이면 확대해서 본 것처럼 무늬를 크게 그린다.
 */
export function Surface({ feel, id, zoom = 1 }: { feel: Feel; id: string; zoom?: number }) {
  const relief = reliefOf(feel);
  const scaled = (freq: string) => freq.split(" ").map((v) => String(Number(v) / zoom)).join(" ");
  const tone = feel.tone;
  return (
    <>
      <defs>
        {relief && (
          <filter id={`${id}-relief`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {relief.layers.map((l, i) => (
              <feTurbulence key={i} type="fractalNoise" baseFrequency={scaled(l.freq)} numOctaves={l.oct} seed={l.seed} result={`n${i}`} />
            ))}
            {relief.layers.length > 1 ? <feComposite in="n0" in2="n1" operator="arithmetic" k2={0.55} k3={0.45} result="bump" /> : <feMerge result="bump"><feMergeNode in="n0" /></feMerge>}
            {relief.soften ? <feGaussianBlur in="bump" stdDeviation={relief.soften * zoom} result="bump2" /> : <feMerge result="bump2"><feMergeNode in="bump" /></feMerge>}
            <feDiffuseLighting in="bump2" surfaceScale={relief.height * (zoom > 1 ? Math.sqrt(zoom) : 0.5)} diffuseConstant={1} lightingColor="#ffffff" result="light">
              <feDistantLight azimuth={225} elevation={50} />
            </feDiffuseLighting>
            <feComposite in="light" in2="SourceGraphic" operator="arithmetic" k1={1.28} result="lit" />
          </filter>
        )}
        {feel.tex === "kraft" && (
          <filter id={`${id}-fiber`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={scaled("0.02 0.35")} numOctaves={3} seed={11} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.14  0 0 0 0 0.05  0 0 0 1.6 -0.7" />
          </filter>
        )}
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#8d939c" /><stop offset="0.35" stopColor="#eef0f3" /><stop offset="0.6" stopColor="#a6acb4" /><stop offset="1" stopColor="#dfe2e6" />
        </linearGradient>
        <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
          {["#ffb3c7", "#ffe59e", "#b8f5c8", "#a8d8ff", "#d6b8ff", "#ffb3c7"].map((c, i) => <stop key={c + i} offset={i / 5} stopColor={c} />)}
        </linearGradient>
        <linearGradient id={`${id}-pearl`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} /><stop offset="0.3" stopColor="#f1e4ff" stopOpacity={0.45} /><stop offset="0.55" stopColor="#ddf0ff" stopOpacity={0.5} /><stop offset="0.8" stopColor="#fff0d8" stopOpacity={0.45} /><stop offset="1" stopColor="#fff" stopOpacity={0.55} />
        </linearGradient>
        <pattern id={`${id}-clear`} width={12 * zoom} height={12 * zoom} patternUnits="userSpaceOnUse">
          <rect width={12 * zoom} height={12 * zoom} fill="#e9ecef" /><rect width={6 * zoom} height={6 * zoom} fill="#d0d5db" /><rect x={6 * zoom} y={6 * zoom} width={6 * zoom} height={6 * zoom} fill="#d0d5db" />
        </pattern>
        <pattern id={`${id}-holes`} width={6 * zoom} height={6 * zoom} patternUnits="userSpaceOnUse">
          <circle cx={3 * zoom} cy={3 * zoom} r={1.1 * zoom} fill="#5b6067" />
        </pattern>
      </defs>

      {feel.tex === "clear" ? (
        <>
          <rect width="200" height="120" fill={`url(#${id}-clear)`} />
          <rect width="200" height="120" fill="#fff" opacity={0.15} />
        </>
      ) : (
        <rect width="200" height="120" fill={feel.tex === "metal" ? `url(#${id}-metal)` : feel.tex === "holo" ? `url(#${id}-holo)` : tone} filter={relief ? `url(#${id}-relief)` : undefined} />
      )}
      {feel.tex === "kraft" && <rect width="200" height="120" filter={`url(#${id}-fiber)`} />}
      {feel.tex === "pearl" && <rect width="200" height="120" fill={`url(#${id}-pearl)`} />}
      {feel.tex === "mesh" && <rect width="200" height="120" fill={`url(#${id}-holes)`} />}
    </>
  );
}

/** 작은 재질 칩 (용지 목록 안). 무늬 차이가 보이도록 확대해서 그린다 */
export function MaterialChip({ paper, className }: { paper: Paper; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <Surface feel={paper.feel ?? DEFAULT_FEEL} id={id} zoom={2.5} />
    </svg>
  );
}

/* ───────────────────────── 1. 색 표현 ───────────────────────── */

type Ink = "vivid" | "standard" | "soft" | "fabric" | "kraft" | "dark" | "pearl" | "metal" | "clear" | "holo" | "mesh";

function inkOf(f: Feel): Ink {
  if (isDark(f.tone) && f.tex !== "metal") return "dark";
  switch (f.tex) {
    case "kraft": return "kraft";
    case "pearl": return "pearl";
    case "metal": return "metal";
    case "clear": return "clear";
    case "holo": return "holo";
    case "mesh": return "mesh";
    case "weave": case "velvet": return "fabric";
    case "felt": case "linen": case "laid": return "soft";
    default: return f.gloss === 2 ? "vivid" : f.gloss === 1 ? "standard" : "soft";
  }
}

const INK_FILTER: Record<Ink, string> = {
  vivid: "saturate(1.22) contrast(1.07)",
  standard: "none",
  soft: "saturate(0.68) contrast(0.88) blur(0.35px)",
  fabric: "saturate(0.6) contrast(0.82) blur(0.7px)",
  kraft: "saturate(0.8) contrast(0.95)",
  dark: "none",
  pearl: "saturate(0.85) brightness(1.04)",
  metal: "saturate(0.8)",
  clear: "none",
  holo: "none",
  mesh: "saturate(0.7) contrast(0.88) blur(0.4px)",
};

function inkVerdict(f: Feel, ink: Ink): string {
  const base = {
    vivid: "기준보다 색이 쨍하고 사진이 또렷해요.",
    standard: "무난하게, 화면과 가장 비슷하게 나와요.",
    soft: "색이 한 톤 차분하고 부드럽게 나와요. 사진보다는 글자·일러스트에 어울려요.",
    fabric: "원단에 스며들어 색이 부드럽고 윤곽이 살짝 퍼져요.",
    kraft: "갈색 종이색과 섞여요. 흰색은 표현되지 않고 종이색으로 남아요.",
    dark: "일반 잉크는 거의 보이지 않아요. 화이트 인쇄(흰 잉크)로만 표현돼요.",
    pearl: "은은한 펄이 돌아 색이 살짝 뽀얗게 반짝여요.",
    metal: "은색 바탕과 섞여 금속 느낌이 나요. 흰색은 은색으로 나와요.",
    clear: "흰색 부분은 투명하게 비쳐요. 흰색이 필요하면 화이트 인쇄를 추가해야 해요.",
    holo: "무지개빛 바탕과 섞여 보는 각도에 따라 색이 달라져요.",
    mesh: "가까이서 보면 작은 구멍 때문에 그림이 점점이 보여요. 멀리서는 괜찮아요.",
  }[ink];
  return isTinted(f.tone) && ink !== "kraft" ? `${base} 종이가 미색이라 전체가 따뜻한 톤이 돼요.` : base;
}

/** 색 차이를 보기 위한 예시 그림: 노을(그라데이션), 원색 동그라미, 큰 글자, 작은 글자 */
function SampleArt({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d3fc0" /><stop offset="0.55" stopColor="#ff5e7e" /><stop offset="1" stopColor="#ffb347" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="112" height="120" fill={`url(#${id}-sky)`} />
      <circle cx="56" cy="74" r="20" fill="#ffd23f" />
      <path d="M0 92 Q40 70 70 88 T112 84 V120 H0Z" fill="#1d8a4a" />
      <circle cx="136" cy="30" r="12" fill="#e63946" />
      <circle cx="166" cy="30" r="12" fill="#1d6fe0" />
      <circle cx="151" cy="54" r="12" fill="#2bb673" />
      <text x="124" y="92" fontSize="20" fontWeight="800" fill="#111" fontFamily="sans-serif">가Aa</text>
      <text x="124" y="104" fontSize="5.5" fill="#333" fontFamily="sans-serif">작은 글씨 010-1234-5678</text>
      <text x="124" y="111" fontSize="5.5" fill="#333" fontFamily="sans-serif">hello@changun.kr</text>
    </svg>
  );
}

function PrintedTile({ paper, caption }: { paper: Paper; caption: string }) {
  const id = useId().replace(/:/g, "");
  const f = paper.feel ?? DEFAULT_FEEL;
  const ink = inkOf(f);
  return (
    <figure className="min-w-0">
      <div className="relative aspect-[5/3] overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,.18)]">
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          <Surface feel={{ ...f }} id={`${id}s`} />
        </svg>
        <div className="absolute inset-0" style={{ mixBlendMode: "multiply", filter: INK_FILTER[ink], opacity: ink === "clear" ? 0.92 : 1 }}>
          <SampleArt id={id} />
        </div>
        {(ink === "pearl" || ink === "metal" || ink === "holo") && (
          <div className="absolute inset-0 mix-blend-screen" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.45) 48%, transparent 62%)" }} />
        )}
        {ink === "vivid" && <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 35%, rgba(255,255,255,.35) 50%, transparent 60%)" }} />}
      </div>
      <figcaption className="mt-1 truncate text-center text-[11px] text-mute">{caption}</figcaption>
    </figure>
  );
}

/* ───────────────────────── 2. 빛에 비추기 ───────────────────────── */

function glossVerdict(f: Feel): string {
  if (f.tex === "pearl") return "빛을 받으면 고운 펄이 은은하게 반짝여요.";
  if (f.tex === "metal") return "금속처럼 빛을 강하게 반사해요.";
  if (f.tex === "holo") return "빛과 각도에 따라 무지개색이 움직여요.";
  if (f.tex === "clear") return "투명 필름이라 빛이 그대로 반사돼요.";
  return [
    "빛 반사가 거의 없어요. 어느 각도에서도 글씨가 잘 읽히고 차분해 보여요.",
    "은은한 광택이에요. 반사가 적당해 무난해요.",
    "조명 아래서 번쩍여요. 각도에 따라 글씨가 반사돼 안 보일 수 있어요.",
  ][f.gloss];
}

function LightTile({ paper }: { paper: Paper }) {
  const id = useId().replace(/:/g, "");
  const f = paper.feel ?? DEFAULT_FEEL;
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const special = f.tex === "pearl" || f.tex === "metal" || f.tex === "holo" || f.tex === "clear";
  // 광택이 클수록 빛 자국이 작고 밝다
  const level = special ? 2 : f.gloss;
  const size = [95, 55, 26][level];
  const alpha = [0.14, 0.5, 0.95][level];
  const move = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const light = `radial-gradient(circle at center, rgba(255,255,255,${alpha}) 0%, rgba(255,255,255,${alpha * 0.45}) ${size * 0.35}%, rgba(255,255,255,0) ${size}%)`;
  const tint = f.tex === "pearl" ? "conic-gradient(from 0deg, rgba(255,190,230,.35), rgba(190,230,255,.35), rgba(255,240,190,.35), rgba(255,190,230,.35))"
    : f.tex === "holo" ? "conic-gradient(from 0deg, rgba(255,0,128,.35), rgba(255,220,0,.35), rgba(0,220,140,.35), rgba(0,140,255,.35), rgba(200,0,255,.35), rgba(255,0,128,.35))" : null;
  return (
    <div
      ref={box}
      onPointerMove={move}
      onPointerLeave={() => setPos(null)}
      className="relative aspect-[5/3] cursor-crosshair touch-none overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,.18)]"
      role="img"
      aria-label={`${paper.name}에 빛을 비춘 모습`}
    >
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <Surface feel={f} id={id} />
      </svg>
      {/* 인쇄된 글자: 광택 용지는 빛 자국 아래에서 글자가 반사돼 흐려진다 */}
      <div className="absolute inset-0 flex flex-col justify-center gap-[6%] px-[10%]" style={{ mixBlendMode: "multiply" }}>
        <span className="h-[14%] w-[55%] rounded-sm bg-[#1b2a3a]" />
        <span className="h-[7%] w-[75%] rounded-sm bg-[#1b2a3a]/70" />
        <span className="h-[7%] w-[62%] rounded-sm bg-[#1b2a3a]/70" />
      </div>
      <div
        className={cn("pointer-events-none absolute size-[220%]", !pos && "motion-safe:animate-[cw-sweep_5s_ease-in-out_infinite]")}
        style={{ left: pos ? `${pos.x - 110}%` : "-60%", top: pos ? `${pos.y - 110}%` : "-80%", background: light, mixBlendMode: "screen" }}
      />
      {tint && (
        <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: tint, transform: `rotate(${pos ? pos.x * 3.6 : 0}deg) scale(1.6)` }} />
      )}
      {!pos && <span className="absolute bottom-1.5 right-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white">움직여서 빛을 비춰 보세요</span>}
    </div>
  );
}

/* ───────────────────────── 3. 확대경 ───────────────────────── */

function textureVerdict(f: Feel): string {
  const t = {
    smooth: f.rough === 0 ? "손끝에 걸리는 게 없을 만큼 매끈해요." : "매끈하지만 살짝 종이 느낌이 나요.",
    grain: "잔잔한 종이 결이 있어요.",
    felt: "구름 같은 엠보 무늬가 손끝에 부드럽게 느껴져요.",
    linen: "천처럼 가로세로 격자 무늬가 눌려 있어요.",
    laid: "가는 줄무늬 결과 섬유가 보여요.",
    kraft: "섬유질이 보이는 거친 재생지예요.",
    pearl: "매끈한 표면에 고운 펄 입자가 깔려 있어요.",
    metal: "머리카락 같은 가는 금속 결이 있어요.",
    clear: "매끈한 투명 필름이에요.",
    holo: "매끈한 필름 위에 무지개빛이 깔려 있어요.",
    mesh: "실 사이로 작은 구멍이 촘촘히 뚫려 있어요.",
    weave: "실이 가로세로로 짜인 원단 결이 보여요.",
    velvet: "결이 거의 없고 보드랍고 포근한 촉감이에요.",
  }[f.tex];
  return f.rough === 3 ? `${t} 꽤 거친 편이라 가늘고 작은 글씨는 끊겨 보일 수 있어요.` : t;
}

function LoupeTile({ paper }: { paper: Paper }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative aspect-[5/3] overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,.18)]">
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" role="img" aria-label={`${paper.name} 표면 확대`}>
        <Surface feel={paper.feel ?? DEFAULT_FEEL} id={id} zoom={6} />
      </svg>
      <span className="absolute bottom-1.5 right-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white">약 10배 확대</span>
    </div>
  );
}

/* ───────────────────────── 4. 두께 ───────────────────────── */

function thickVerdict(mm: number) {
  if (mm < 0.15) return "얇아서 잘 휘어요. 전단·안내문에 어울려요.";
  if (mm < 0.3) return "적당히 빳빳해요. 일반 명함 두께예요.";
  if (mm < 0.45) return "도톰하고 탄탄해요. 손에 쥐면 고급스러운 느낌이 나요.";
  return "아주 두껍고 잘 휘지 않아요.";
}

function ThicknessTile({ paper }: { paper: Paper }) {
  const mm = caliperMm(paper);
  const f = paper.feel ?? DEFAULT_FEEL;
  const px = (v: number) => Math.max(2, Math.min(60, v * 60));
  const rows = [
    { name: "복사지", mm: 0.1, color: "#f4f4f2" },
    { name: paper.name, mm, color: f.tex === "metal" ? "#c9ccd1" : f.tone, me: true },
    { name: "신용카드", mm: 0.76, color: "#d7dce3" },
  ];
  const sheets = mm / 0.1;
  return (
    <div className="flex aspect-[5/3] flex-col justify-center gap-2.5 rounded-md bg-[#eef0ee] px-3">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <span className={cn("w-[34%] truncate text-right text-[10px]", r.me ? "font-bold text-ink" : "text-mute")}>{r.me ? "이 용지" : r.name}</span>
          <span className="relative flex-1">
            <span className={cn("block rounded-[1px] border", r.me ? "border-brand" : "border-black/15")} style={{ height: px(r.mm), background: r.color, boxShadow: "inset 0 -1px 0 rgba(0,0,0,.12)" }} />
          </span>
          <span className={cn("w-[18%] text-[10px] tabular-nums", r.me ? "font-bold text-ink" : "text-mute")}>{r.mm.toFixed(2)}mm</span>
        </div>
      ))}
      <p className="text-center text-[10px] text-mute">옆에서 본 두께 · 복사지 약 {sheets < 1.5 ? "1" : sheets.toFixed(1).replace(/\.0$/, "")}장{mm < 0.7 ? ` · 신용카드의 약 ${Math.max(1, Math.round((mm / 0.76) * 10)) * 10}%` : " · 신용카드와 비슷"}</p>
    </div>
  );
}

/* ───────────────────────── 조합 ───────────────────────── */

function Panel({ no, title, verdict, children }: { no: number; title: string; verdict: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-white p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold"><span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">{no}</span>{title}</p>
      {children}
      <p className="mt-2 text-[13px] leading-snug text-ink">{verdict}</p>
    </section>
  );
}

/**
 * 선택한 용지를 기준 용지와 비교해 보여준다.
 * baseline: 비교 기준 (상품의 기본 용지). 같으면 비교 대신 한 장만 보여준다.
 */
export function MaterialPreview({ paper, baseline }: { paper: Paper; baseline: Paper; label?: string; unit?: string }) {
  const f = paper.feel ?? DEFAULT_FEEL;
  const same = paper.id === baseline.id;
  const mm = caliperMm(paper);
  return (
    <div className="rounded-2xl bg-surface p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-base font-extrabold">{paper.name}</p>
        <p className="text-xs text-mute">{paper.desc}</p>
        {f.tags && <ul className="flex w-full flex-wrap gap-1">{f.tags.map((t) => <li key={t} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-line">{t}</li>)}</ul>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel no={1} title="색이 이렇게 나와요" verdict={same ? `기준 용지예요. ${inkVerdict(f, inkOf(f))}` : inkVerdict(f, inkOf(f))}>
          {same ? (
            <div className="grid grid-cols-2 gap-2">
              <PrintedTile paper={paper} caption={`기준 · ${paper.name}`} />
              <p className="grid place-items-center rounded-md border border-dashed border-line px-2 text-center text-[11px] text-mute">다른 용지를 고르면 여기에 나란히 비교돼요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrintedTile paper={baseline} caption={`기준 · ${baseline.name}`} />
              <PrintedTile paper={paper} caption={`이 용지 · ${paper.name}`} />
            </div>
          )}
        </Panel>
        <Panel no={2} title="빛에 비추면" verdict={glossVerdict(f)}>
          <LightTile paper={paper} />
        </Panel>
        <Panel no={3} title="확대해서 보면" verdict={textureVerdict(f)}>
          <LoupeTile paper={paper} />
        </Panel>
        <Panel no={4} title="두께는" verdict={`약 ${mm.toFixed(2)}mm. ${thickVerdict(mm)}`}>
          <ThicknessTile paper={paper} />
        </Panel>
      </div>
      <p className="mt-2 text-[11px] text-mute">※ 화면으로 흉내 낸 비교예요. 두께는 평량으로 계산한 예상값이고, 실제 색·질감은 실물 샘플과 다를 수 있어요.</p>
    </div>
  );
}
