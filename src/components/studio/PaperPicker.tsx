"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { getProduct, type Paper } from "@/data/catalog";
import type { FontSet } from "@/studio/fonts";
import { cardSize, type CardInfo, type CardSize, type Side } from "@/studio/types";
import { DEFAULT_FEEL, MaterialChip, MaterialPreview, Surface, thickness } from "@/components/product/MaterialSwatch";
import { cn } from "@/lib/utils";
import { CardSvg } from "./CardSvg";

/** 창운 명함 상품의 용지 목록을 그대로 쓴다 (주문 페이지와 같은 이름·재질) */
export const CARD_PAPERS: Paper[] = getProduct("business-card")?.papers ?? [];
export const paperById = (id: string | undefined) => CARD_PAPERS.find((p) => p.id === id) ?? CARD_PAPERS[0];

/**
 * 고객의 명함 디자인을 고른 용지 위에 겹쳐 보여준다.
 * 잉크는 종이 위에 "곱하기"로 얹히므로, 흰 부분은 종이색이 되고 종이 결이 비쳐 보인다
 * (크라프트에서 흰색이 사라지고, 검은 종이에서 일반 잉크가 거의 안 보이는 것도 그대로 드러난다).
 */
export function CardOnPaper({ side, info, fonts, paper, className, size = cardSize("landscape") }: { side: Side; info: CardInfo; fonts: FontSet | null; paper: Paper; className?: string; size?: CardSize }) {
  const id = useId().replace(/:/g, "");
  const feel = paper.feel ?? DEFAULT_FEEL;
  const thick = thickness(paper);
  const glossOpacity = [0, 0.22, 0.5][feel.gloss];
  return (
    <div className={className}>
      <div className="relative" style={{ aspectRatio: `${size.w} / ${size.h}`, filter: `drop-shadow(0 ${1 + thick}px ${2 + thick * 2}px rgba(0,0,0,.22))` }}>
        <div className="absolute inset-0 overflow-hidden rounded-[3px]">
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
            <Surface feel={{ ...feel, gloss: 0 }} id={id} />
          </svg>
          <div className="absolute inset-0" style={{ mixBlendMode: "multiply" }}>
            <CardSvg side={side} info={info} fonts={fonts} size={size} className="block size-full" />
          </div>
          {glossOpacity > 0 && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
              <defs>
                <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0.3" stopColor="#fff" stopOpacity={0} />
                  <stop offset="0.48" stopColor="#fff" stopOpacity={glossOpacity} />
                  <stop offset="0.62" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <rect width="100" height="100" fill={`url(#${id}-sheen)`} />
            </svg>
          )}
        </div>
      </div>
      <div className="mx-[2px] rounded-b-[2px]" style={{ height: Math.max(1, thick * 0.8), background: `linear-gradient(${feel.tone}, #cfccc4)` }} />
    </div>
  );
}

export function PaperPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const cur = paperById(value);
  const groups = Array.from(new Set(CARD_PAPERS.map((p) => p.group ?? "기타")));
  const list = all ? CARD_PAPERS : CARD_PAPERS.filter((p) => p.recommended || p.id === cur.id);
  const chip = (p: Paper) => {
    const on = p.id === cur.id;
    return (
      <button key={p.id} type="button" aria-pressed={on} onClick={() => onChange(p.id)} title={p.desc} className={cn("flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-colors", on ? "border-brand bg-brand-soft" : "border-line bg-white hover:border-brand/50")}>
        <MaterialChip paper={p} className="size-9 shrink-0 rounded-md shadow-sm ring-1 ring-black/5" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[13px] font-bold leading-tight">{p.name}{on && <Check size={14} className="shrink-0 text-brand" />}</span>
          <span className="block truncate text-[11px] text-mute">{p.feel?.tags?.[0] ?? p.desc}</span>
        </span>
      </button>
    );
  };
  return (
    <div>
      {all ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-1 text-[11px] font-bold text-mute">{g}</p>
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">{CARD_PAPERS.filter((p) => (p.group ?? "기타") === g).map(chip)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">{list.map(chip)}</div>
      )}
      <button type="button" aria-expanded={all} onClick={() => setAll((v) => !v)} className="mt-2 flex items-center gap-1 text-xs font-bold text-brand">
        {all ? "추천 용지만 보기" : `전체 용지 ${CARD_PAPERS.length}종 보기`}<ChevronDown size={14} className={cn("transition-transform", all && "rotate-180")} />
      </button>
    </div>
  );
}

/** 선택한 용지를 기본 용지(스노우지)와 비교 */
export function PaperCompare({ paper }: { paper: Paper }) {
  return <MaterialPreview paper={paper} baseline={CARD_PAPERS[0]} />;
}

export function PaperSummary({ paper, double }: { paper: Paper; double: boolean }) {
  const f = paper.feel ?? DEFAULT_FEEL;
  const href = `/products/business-card/?paper=${paper.id}&side=${double ? "double" : "single"}&qty=200`;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
      <span className="font-bold text-ink">{paper.name}</span>
      <span>{["무광", "반광", "유광"][f.gloss]} · {["아주 매끈", "매끈", "결이 있음", "거침"][f.rough]} · 두께 {thickness(paper)}/5</span>
      {f.tags?.map((t) => <span key={t} className="rounded-full bg-surface px-2 py-0.5 font-semibold text-ink">{t}</span>)}
      <Link href={href} className="ml-auto font-bold text-brand underline">이 용지로 인쇄 주문 보기 →</Link>
    </div>
  );
}
