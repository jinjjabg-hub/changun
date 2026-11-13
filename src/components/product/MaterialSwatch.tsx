"use client";

import { useId } from "react";
import type { Feel, Paper } from "@/data/catalog";

/**
 * 용지·소재 재질 미리보기 (그림으로 그린 예시).
 * 실제 종이 사진이 아니라 표면 무늬·광택·바탕색을 흉내 낸 것이다.
 */

export const DEFAULT_FEEL: Feel = { tex: "smooth", gloss: 1, tone: "#ffffff", rough: 1 };

/** 이름의 평량(g·μ)으로 두께감 1~5 */
export function thickness(p: Paper): number {
  if (p.feel?.thick) return p.feel.thick;
  const m = /(\d{2,3})\s*(g|μ)/.exec(p.name);
  if (!m) return 3;
  const g = Number(m[1]);
  return g < 110 ? 1 : g < 160 ? 2 : g < 240 ? 3 : g < 320 ? 4 : 5;
}

export const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
};

export function Surface({ feel, id }: { feel: Feel; id: string }) {
  const { tex, gloss, tone, rough } = feel;
  const dark = isDark(tone);
  const ink = dark ? "#ffffff" : "#000000";
  const grainAmt = [0.025, 0.045, 0.07, 0.11][rough];
  return (
    <>
      <defs>
        {/* 종이 결: 잔 노이즈 */}
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={tex === "felt" ? 0.18 : 0.9} numOctaves={tex === "felt" ? 4 : 2} seed={3} />
          <feColorMatrix type="matrix" values={`0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 ${grainAmt * 4} -${grainAmt * 1.6}`} />
        </filter>
        {/* 크라프트·한지: 긴 섬유 */}
        <filter id={`${id}-fiber`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.45" numOctaves={3} seed={8} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 1.4 -0.55" />
        </filter>
        {/* 광택: 비스듬한 빛 반사 */}
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.38" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={gloss === 2 ? 0.75 : gloss === 1 ? 0.3 : 0} />
          <stop offset="0.62" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-pearl`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.5} />
          <stop offset="0.3" stopColor="#f4e9ff" stopOpacity={0.35} />
          <stop offset="0.55" stopColor="#e6f4ff" stopOpacity={0.45} />
          <stop offset="0.8" stopColor="#fff3df" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#8d939c" />
          <stop offset="0.35" stopColor="#e9ecf0" />
          <stop offset="0.6" stopColor="#a6acb4" />
          <stop offset="1" stopColor="#dfe2e6" />
        </linearGradient>
        <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
          {["#ffb3c7", "#ffe59e", "#b8f5c8", "#a8d8ff", "#d6b8ff", "#ffb3c7"].map((c, i) => <stop key={c + i} offset={i / 5} stopColor={c} />)}
        </linearGradient>
        <pattern id={`${id}-linen`} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M0 0.5H3M0 2H3" stroke={ink} strokeOpacity={0.11} strokeWidth="0.5" />
          <path d="M0.5 0V3M2 0V3" stroke={ink} strokeOpacity={0.08} strokeWidth="0.5" />
        </pattern>
        <pattern id={`${id}-laid`} width="40" height="2.4" patternUnits="userSpaceOnUse">
          <path d="M0 1.2H40" stroke={ink} strokeOpacity={0.06} strokeWidth="0.5" />
          <path d="M20 0V2.4" stroke={ink} strokeOpacity={0.05} strokeWidth="0.6" />
        </pattern>
        <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill={ink} opacity={0.05} />
          <rect x="2" y="2" width="2" height="2" fill={ink} opacity={0.05} />
        </pattern>
        <pattern id={`${id}-mesh`} width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill={tone} />
          <circle cx="2.5" cy="2.5" r="0.75" fill="#9aa0a6" />
        </pattern>
        <pattern id={`${id}-clear`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#e7eaee" />
          <rect width="6" height="6" fill="#d3d8de" />
          <rect x="6" y="6" width="6" height="6" fill="#d3d8de" />
        </pattern>
        <pattern id={`${id}-velvet`} width="2" height="2" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="#000" opacity={0.025} />
        </pattern>
      </defs>

      {tex === "clear" ? (
        <>
          <rect width="200" height="120" fill={`url(#${id}-clear)`} />
          <rect width="200" height="120" fill="#ffffff" opacity={0.18} />
        </>
      ) : tex === "metal" ? (
        <rect width="200" height="120" fill={`url(#${id}-metal)`} />
      ) : tex === "holo" ? (
        <rect width="200" height="120" fill={`url(#${id}-holo)`} />
      ) : tex === "mesh" ? (
        <rect width="200" height="120" fill={`url(#${id}-mesh)`} />
      ) : (
        <rect width="200" height="120" fill={tone} />
      )}

      {(tex === "smooth" || tex === "grain" || tex === "felt" || tex === "kraft" || tex === "laid" || tex === "velvet" || tex === "weave" || tex === "linen") && (
        <rect width="200" height="120" filter={`url(#${id}-grain)`} />
      )}
      {(tex === "kraft" || tex === "laid") && <rect width="200" height="120" filter={`url(#${id}-fiber)`} opacity={tex === "laid" ? 0.5 : 0.8} />}
      {tex === "linen" && <rect width="200" height="120" fill={`url(#${id}-linen)`} />}
      {tex === "laid" && <rect width="200" height="120" fill={`url(#${id}-laid)`} />}
      {tex === "weave" && <rect width="200" height="120" fill={`url(#${id}-weave)`} />}
      {tex === "velvet" && <rect width="200" height="120" fill={`url(#${id}-velvet)`} />}
      {tex === "pearl" && <rect width="200" height="120" fill={`url(#${id}-pearl)`} />}
      {tex === "metal" && <rect width="200" height="120" filter={`url(#${id}-grain)`} opacity={0.6} />}
      {gloss > 0 && <rect width="200" height="120" fill={`url(#${id}-gloss)`} />}
    </>
  );
}

/** 작은 재질 칩 (용지 카드 안) */
export function MaterialChip({ paper, className }: { paper: Paper; className?: string }) {
  const id = useId().replace(/:/g, "");
  const feel = paper.feel ?? DEFAULT_FEEL;
  return (
    <svg viewBox="40 20 120 80" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <Surface feel={feel} id={id} />
    </svg>
  );
}

function Meter({ label, value, max, left, right }: { label: string; value: number; max: number; left: string; right: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-mute"><span className="font-semibold text-ink">{label}</span><span>{left} ↔ {right}</span></div>
      <div className="mt-1 flex gap-1" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        {Array.from({ length: max }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < value ? "bg-brand" : "bg-line"}`} />)}
      </div>
    </div>
  );
}

/** 선택한 용지의 큰 미리보기: 재질 위에 인쇄된 예시 + 광택·질감·두께 + 특징 */
export function MaterialPreview({ paper, label, unit }: { paper: Paper; label: string; unit: "card" | "sheet" | "banner" }) {
  const id = useId().replace(/:/g, "");
  const feel = paper.feel ?? DEFAULT_FEEL;
  const dark = isDark(feel.tone);
  const clear = feel.tex === "clear";
  // 인쇄 예시 색: 크라프트는 잉크가 흡수돼 탁하게, 검은 종이는 화이트 인쇄, 투명은 화이트 바탕 위 인쇄
  const muted = feel.tex === "kraft" || feel.tex === "laid";
  const inkMain = dark ? "#f4f4f4" : muted ? "#2c3e33" : "#0f3d2e";
  const inkAccent = dark ? "#e8e8e8" : muted ? "#9b6a33" : "#f2a93b";
  const thick = thickness(paper);
  const glossName = ["무광", "반광", "유광"][feel.gloss];
  const roughName = ["아주 매끈", "매끈", "결이 있음", "거침"][feel.rough];
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
      <div>
        <div className="relative overflow-hidden rounded-xl bg-[#e9ece9] p-5 sm:p-7">
          <div className="relative mx-auto max-w-[360px]" style={{ filter: `drop-shadow(0 ${2 + thick}px ${3 + thick * 2}px rgba(0,0,0,.18))` }}>
            {/* 두께: 아래로 겹친 단면 */}
            <svg viewBox="0 0 200 120" className="block w-full" role="img" aria-label={`${paper.name} 재질 예시`}>
              <defs>
                <clipPath id={`${id}-clip`}><rect width="200" height="120" rx={unit === "card" ? 4 : 1} /></clipPath>
              </defs>
              <g clipPath={`url(#${id}-clip)`}>
                <Surface feel={feel} id={id} />
                {/* 인쇄 예시 */}
                <g opacity={muted ? 0.85 : 1} style={{ mixBlendMode: dark || clear ? "normal" : "multiply" }}>
                  {clear && <rect x="18" y="22" width="92" height="76" rx="6" fill="#ffffff" opacity={0.9} />}
                  <circle cx="44" cy="48" r="12" fill={inkAccent} />
                  <rect x="64" y="40" width="58" height="7" rx="3.5" fill={inkMain} />
                  <rect x="64" y="52" width="38" height="4.5" rx="2.25" fill={inkMain} opacity={0.6} />
                  <rect x="30" y="74" width="72" height="3.5" rx="1.75" fill={inkMain} opacity={0.5} />
                  <rect x="30" y="82" width="56" height="3.5" rx="1.75" fill={inkMain} opacity={0.5} />
                  <text x="182" y="104" textAnchor="end" fontSize="9" fontWeight="700" fill={inkMain} opacity={0.75} fontFamily="sans-serif">{label}</text>
                </g>
                {feel.gloss > 0 && <rect width="200" height="120" fill={`url(#${id}-gloss)`} opacity={0.8} />}
              </g>
            </svg>
            <div className="mx-[3px] rounded-b-[3px]" style={{ height: thick * 1.6, background: `linear-gradient(${feel.tone}, ${dark ? "#000" : "#d9d6cf"})` }} />
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-mute">※ 화면에서 흉내 낸 재질 예시예요. 실제 질감·색은 실물 샘플과 다를 수 있어요.</p>
      </div>
      <div className="space-y-3">
        <div>
          <p className="font-extrabold">{paper.name}</p>
          <p className="text-xs text-mute">{paper.desc}</p>
        </div>
        <Meter label={`광택 · ${glossName}`} value={feel.gloss + 1} max={3} left="무광" right="유광" />
        <Meter label={`표면 · ${roughName}`} value={feel.rough + 1} max={4} left="매끈" right="거침" />
        <Meter label="두께감" value={thick} max={5} left="얇음" right="두꺼움" />
        {feel.tags && (
          <ul className="flex flex-wrap gap-1">
            {feel.tags.map((t) => <li key={t} className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">{t}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
