"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, XCircle } from "lucide-react";
import { designToPdf, downloadBytes, downloadText, sideToSvg } from "@/studio/exporters";
import type { FontSet } from "@/studio/fonts";
import { preflight, summarize, type Check } from "@/studio/preflight";
import { CARD, type CardInfo, type Design, type SideKey } from "@/studio/types";
import { cn } from "@/lib/utils";
import { CardSvg } from "./CardSvg";
import { CardOnPaper, PaperCompare, PaperPicker, PaperSummary, paperById } from "./PaperPicker";

const ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle } as const;
const TONE = { pass: "text-brand", warn: "text-[#8a5a06]", fail: "text-danger" } as const;

export function Finish({ design, info, fonts, paperId, onPaper, onFix }: { design: Design; info: CardInfo; fonts: FontSet | null; paperId: string | undefined; onPaper: (id: string) => void; onFix: (t: NonNullable<Check["target"]>) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<"paper" | "trim">("paper");
  const paper = paperById(paperId);
  const hasBack = design.back.elements.length > 0;
  const [error, setError] = useState<string | null>(null);
  const checks = preflight(design, info, fonts, paper);
  const sum = summarize(checks);
  const blocked = sum.fail > 0 || !fonts;
  // 파일 이름은 영문·숫자만 쓴다 (브라우저와 인쇄소 시스템에서 한글 이름이 깨지는 경우가 있다)
  const base = "namecard";

  const run = async (id: string, job: (f: FontSet) => Promise<void>) => {
    if (!fonts) return;
    setBusy(id);
    setError(null);
    try {
      await job(fonts);
    } catch {
      setError("파일을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };
  const pdf = (sides: SideKey[], suffix: string) => run(`pdf-${suffix}`, async (f) => downloadBytes(await designToPdf(design, info, f, sides, paper.name), `${base}-${suffix}.pdf`));
  const svg = (side: SideKey, outline: boolean) =>
    run(`svg-${side}-${outline}`, async (f) => downloadText(await sideToSvg(design[side], info, f, outline), `${base}-${side}${outline ? "-outlined" : "-editable"}.svg`, "image/svg+xml"));

  const btn = "flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40";
  const order: Check["level"][] = ["fail", "warn", "pass"];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">용지 고르기</h2>
          <div className="inline-flex rounded-lg border-2 border-line bg-white p-0.5 text-sm font-bold">
            {([["paper", "용지에 인쇄된 모습"], ["trim", "재단선 보기"]] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("rounded-md px-3 py-1.5", view === v ? "bg-brand text-white" : "hover:bg-brand-soft")}>{t}</button>
            ))}
          </div>
        </div>
        <div className={cn("grid gap-4 rounded-2xl p-4 sm:grid-cols-2 sm:p-6", view === "paper" ? "bg-[#e6e8e5]" : "bg-surface")}>
          {(["front", "back"] as SideKey[]).map((k) => (
            <figure key={k}>
              {view === "paper" ? (
                <CardOnPaper side={design[k]} info={info} fonts={fonts} paper={paper} />
              ) : (
                <CardSvg side={design[k]} info={info} fonts={fonts} guides className="w-full shadow-lg" />
              )}
              <figcaption className="mt-1.5 text-center text-xs text-mute">{k === "front" ? "앞면" : "뒷면"}{view === "trim" && " · 분홍 실선 재단선, 초록 점선 안전 영역"}</figcaption>
            </figure>
          ))}
        </div>
        {view === "paper" && <p className="mt-2 text-xs text-mute">※ 내 디자인을 고른 용지의 질감·색 위에 겹쳐 흉내 낸 모습이에요. 실제 인쇄 색과 질감은 실물 샘플로 확인해 주세요.</p>}
        <div className="mt-3"><PaperSummary paper={paper} double={hasBack} /></div>
        <div className="mt-3"><PaperPicker value={paper.id} onChange={onPaper} /></div>
        <div className="mt-4"><PaperCompare paper={paper} /></div>

        <h2 className="mb-2 mt-8 text-lg font-extrabold">인쇄 규격 자동 검사</h2>
        <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="font-bold text-danger">실패 {sum.fail}</span><span className="font-bold text-[#8a5a06]">경고 {sum.warn}</span><span className="font-bold text-brand">통과 {sum.pass}</span>
          <span className="text-mute">{sum.fail ? "실패 항목을 고쳐야 내려받을 수 있어요." : sum.warn ? "경고는 확인만 하고 내려받을 수 있어요." : "모든 항목을 통과했어요."}</span>
        </p>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {order.flatMap((lv) => checks.filter((c) => c.level === lv)).map((c) => {
            const Icon = ICON[c.level];
            return (
              <li key={c.id} className="flex items-start gap-3 p-3">
                <Icon size={18} className={cn("mt-0.5 shrink-0", TONE[c.level])} />
                <div className="min-w-0 flex-1 text-sm"><p className="font-bold">{c.title}</p><p className="text-xs text-mute">{c.detail}</p></div>
                {c.target && c.level !== "pass" && <button type="button" onClick={() => onFix(c.target!)} className="shrink-0 rounded-lg border-2 border-line px-2.5 py-1 text-xs font-bold hover:border-brand/50">편집기에서 보기</button>}
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="rounded-2xl border-2 border-brand p-5">
          <p className="font-extrabold">파일 내려받기</p>
          <p className="mt-1 text-xs text-mute">재단 {CARD.w}×{CARD.h}mm · 도련 {CARD.bleed}mm · 벡터 · 용지 {paper.name}</p>

          <p className="mb-1.5 mt-4 text-xs font-bold text-mute">인쇄용 PDF (글자 윤곽선 · CMYK 값 · 재단선 표시)</p>
          <div className="grid gap-2">
            <button type="button" disabled={blocked || !!busy} onClick={() => pdf(["front", "back"], "front-back")} className={cn(btn, "bg-brand text-white hover:bg-brand-dark")}><FileDown size={16} /> {busy === "pdf-front-back" ? "만드는 중…" : "PDF · 앞면 + 뒷면 (2쪽)"}</button>
            <button type="button" disabled={blocked || !!busy} onClick={() => pdf(["front"], "front")} className={cn(btn, "border-2 border-brand text-brand hover:bg-brand-soft")}>{busy === "pdf-front" ? "만드는 중…" : "PDF · 앞면만 (단면 명함)"}</button>
          </div>

          <p className="mb-1.5 mt-5 text-xs font-bold text-mute">편집용 SVG (글자를 고칠 수 있음 · 사용한 글꼴이 설치돼 있어야 함)</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={blocked || !!busy} onClick={() => svg("front", false)} className={cn(btn, "border-2 border-line hover:border-brand/50")}>SVG 앞면</button>
            <button type="button" disabled={blocked || !!busy} onClick={() => svg("back", false)} className={cn(btn, "border-2 border-line hover:border-brand/50")}>SVG 뒷면</button>
          </div>
          <p className="mb-1.5 mt-4 text-xs font-bold text-mute">윤곽선 SVG (글꼴 없이도 모양이 같음)</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={blocked || !!busy} onClick={() => svg("front", true)} className={cn(btn, "border-2 border-line hover:border-brand/50")}>SVG 앞면</button>
            <button type="button" disabled={blocked || !!busy} onClick={() => svg("back", true)} className={cn(btn, "border-2 border-line hover:border-brand/50")}>SVG 뒷면</button>
          </div>

          {!fonts && <p className="mt-3 text-xs text-[#8a5a06]">글꼴 파일을 불러오는 중이에요. 잠시만 기다려 주세요.</p>}
          {sum.fail > 0 && <p className="mt-3 text-xs text-danger">실패 항목 {sum.fail}개를 고치면 내려받을 수 있어요.</p>}
          {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
          <ul className="mt-4 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-mute">
            <li>PDF와 SVG는 일러스트레이터에서 열 수 있어요. 정식 .ai 파일은 아직 만들지 않습니다.</li>
            <li>CMYK 값은 화면색을 계산식으로 바꾼 것이라, 실물 샘플 인쇄로 색을 꼭 확인해 주세요.</li>
            <li>시연 단계라 결제 없이 내려받을 수 있어요.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
