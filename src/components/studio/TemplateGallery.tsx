"use client";

import Link from "next/link";
import { useStudioFonts } from "./useStudioFonts";
import { CardSvg } from "./CardSvg";
import { INDUSTRIES } from "@/studio/palettes";
import { buildDesign } from "@/studio/planner";
import { TEMPLATES } from "@/studio/templates";
import { cardSize, sampleInfo } from "@/studio/types";
import { fontNeeds } from "@/studio/fonts";

/** 템플릿 전체를 예시 정보로 한눈에 보여주는 페이지 */
export function TemplateGallery() {
  const designs = TEMPLATES.map((t, n) => {
    const list = INDUSTRIES.find((i) => i.id === t.industries[0])?.palettes ?? ["navy"];
    return buildDesign(t.id, list[n % list.length], sampleInfo, t.id)!;
  });
  const fonts = useStudioFonts(fontNeeds(designs.flatMap((d) => [d.front, d.back])));
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight">템플릿 {TEMPLATES.length}종</h1>
          <p className="text-sm text-mute">예시 정보로 그린 앞면과 뒷면입니다. 스튜디오에서는 업종과 취향에 맞는 4종을 골라 드려요.</p>
        </div>
        <Link href="/studio" className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">내 명함 만들기 →</Link>
      </div>
      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        {TEMPLATES.map((t, n) => {
          const d = designs[n];
          return (
            <li key={t.id} className="rounded-2xl bg-surface p-4">
              <div className={d.orientation === "portrait" ? "mx-auto grid max-w-[300px] grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
                <CardSvg side={d.front} info={sampleInfo} fonts={fonts} size={cardSize(d.orientation)} className="w-full rounded-[3px] shadow-md" />
                <CardSvg side={d.back} info={sampleInfo} fonts={fonts} size={cardSize(d.orientation)} className="w-full rounded-[3px] shadow-md" />
              </div>
              <p className="mt-3 font-extrabold">{t.name}{d.orientation === "portrait" && <span className="ml-1.5 rounded bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">세로형</span>} <span className="text-xs font-normal text-mute">· {d.palette.name}</span></p>
              <p className="text-xs text-mute">{t.concept}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
