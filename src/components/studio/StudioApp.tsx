"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { RefreshCw, RotateCcw } from "lucide-react";
import { INDUSTRIES } from "@/studio/palettes";
import { buildDesign, planDesigns } from "@/studio/planner";
import { clearSaved, loadSaved, save } from "@/studio/store";
import { TEMPLATES } from "@/studio/templates";
import { cardSize, emptyInfo, type CardInfo, type Design, type Orientation, type SideKey } from "@/studio/types";
import { cn } from "@/lib/utils";
import { CardSvg } from "./CardSvg";
import { Editor } from "./Editor";
import { Finish } from "./Finish";
import { InfoForm, validateInfo } from "./InfoForm";
import { useStudioFonts } from "./useStudioFonts";
import { fontNeeds } from "@/studio/fonts";

const STEPS = ["정보 입력", "시안 선택", "편집", "검사 · 내려받기"];

/** 정보 입력 중에 보여줄 미리보기: 업종에 가장 잘 맞는 템플릿 */
function previewDesign(info: CardInfo): Design {
  const o = info.orientation ?? "landscape";
  const pool = TEMPLATES.filter((x) => (x.orientation ?? "landscape") === o);
  const t = pool.find((x) => x.industries[0] === info.industry) ?? pool.find((x) => x.industries.includes(info.industry)) ?? pool[0];
  const pal = info.color !== "auto" ? info.color : (INDUSTRIES.find((i) => i.id === info.industry)?.palettes[0] ?? "navy");
  return buildDesign(t.id, pal, info, "preview")!;
}

/** 가로형 / 세로형 */
function OrientationToggle({ value, onChange }: { value: Orientation | undefined; onChange: (o: Orientation) => void }) {
  const cur = value ?? "landscape";
  return (
    <div className="inline-flex rounded-lg border-2 border-line bg-white p-0.5" role="group" aria-label="명함 방향">
      {([["landscape", "가로형", "h-3 w-5"], ["portrait", "세로형", "h-5 w-3"]] as const).map(([v, t, icon]) => (
        <button key={v} type="button" aria-pressed={cur === v} onClick={() => onChange(v)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold", cur === v ? "bg-brand text-white" : "hover:bg-brand-soft")}>
          <i className={cn("inline-block rounded-[2px] border-[1.5px] border-current", icon)} />{t}
        </button>
      ))}
    </div>
  );
}

function Studio() {
  // 저장된 작업이 있으면 이어서 시작한다 (이 컴포넌트는 브라우저에서만 만들어진다)
  const [saved] = useState(loadSaved);
  const [info, setInfo] = useState<CardInfo>(saved?.info ?? emptyInfo);
  const [step, setStep] = useState(saved?.step ?? 0);
  const [sub, setSub] = useState(0);
  // 시안 번호는 업종·분위기·색 취향별로 센다. 취향을 바꾸면 가장 잘 맞는 시안부터 다시 보여준다
  const tasteKey = `${info.industry}|${info.mood}|${info.color}|${info.orientation ?? "landscape"}`;
  const [seedFor, setSeedFor] = useState<{ key: string; n: number }>(() => ({ key: saved ? `${saved.info.industry}|${saved.info.mood}|${saved.info.color}|${saved.info.orientation ?? "landscape"}` : "", n: saved?.seed ?? 1 }));
  const seed = seedFor.key === tasteKey ? seedFor.n : 1;
  const setSeed = (f: (n: number) => number) => setSeedFor({ key: tasteKey, n: f(seed) });
  const [design, setDesign] = useState<Design | null>(saved?.design ?? null);
  const [options, setOptions] = useState<Design[]>([]);
  const [focus, setFocus] = useState<{ side: SideKey; id: string } | null>(null);
  const [paper, setPaper] = useState<string | undefined>(saved?.paper);

  // 자동 저장. 이미지 때문에 용량을 넘으면 이미지를 빼고 저장한다
  useEffect(() => {
    const v = { info, step, seed, design, paper };
    if (!save(v)) save({ ...v, info: { ...info, logo: null, photo: null } });
  }, [info, step, seed, design, paper]);

  // 시안 4종 (정보나 시드가 바뀌면 다시 만든다)
  useEffect(() => {
    if (step !== 1) return;
    let alive = true;
    planDesigns({ info, seed }).then((d) => alive && setOptions(d));
    return () => {
      alive = false;
    };
  }, [step, info, seed]);

  // 화면에 나온 디자인들에 쓰인 글꼴만 받는다
  const shown = step === 0 ? [previewDesign(info)] : step === 1 ? options : design ? [design] : [];
  const fonts = useStudioFonts(fontNeeds(shown.flatMap((d) => [d.front, d.back])));

  const infoOk = Object.keys(validateInfo(info)).length === 0;
  const canGo = (i: number) => i === 0 || (infoOk && (i === 1 || design !== null));
  const go = (i: number) => {
    if (!canGo(i)) return;
    if (i !== 2) setFocus(null);
    setStep(i);
    window.scrollTo({ top: 0 });
  };
  const reset = () => {
    if (!window.confirm("입력한 정보와 디자인을 모두 지우고 처음부터 다시 시작할까요?")) return;
    clearSaved();
    setInfo(emptyInfo);
    setDesign(null);
    setOptions([]);
    setSeedFor({ key: "", n: 1 });
    setPaper(undefined);
    setSub(0);
    setStep(0);
  };

  const preview = step === 0 ? previewDesign(info) : null;
  const portrait = (info.orientation ?? "landscape") === "portrait";

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-brand">CARD STUDIO <span className="ml-1 rounded bg-accent px-1.5 py-0.5 tracking-normal text-ink">시연</span></p>
          <h1 className="text-[28px] font-extrabold tracking-tight">정보만 넣으면 인쇄용 명함 파일까지</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-mute">
          <span>이 브라우저에 자동 저장</span>
          <Link href="/studio/gallery" className="underline hover:text-brand">템플릿 {TEMPLATES.length}종 보기</Link>
          <button type="button" onClick={reset} className="flex items-center gap-1 underline hover:text-danger"><RotateCcw size={12} /> 처음부터</button>
        </div>
      </div>

      <ol className="my-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" disabled={!canGo(i)} aria-current={i === step ? "step" : undefined} onClick={() => go(i)} className={cn("flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition-colors disabled:opacity-40", i === step ? "border-brand bg-brand text-white" : i < step ? "border-brand/40 bg-brand-soft text-brand-dark" : "border-line text-mute")}>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs", i === step ? "bg-white text-brand" : "bg-white/70")}>{i + 1}</span>
              <span className="hidden truncate sm:inline">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && preview && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="order-2 lg:order-1"><InfoForm info={info} onChange={setInfo} sub={sub} onSub={setSub} onDone={() => go(1)} /></div>
          <aside className="order-1 lg:sticky lg:top-[150px] lg:order-2 lg:self-start">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-mute">입력하는 대로 바뀌는 미리보기</p>
              <OrientationToggle value={info.orientation} onChange={(orientation) => setInfo({ ...info, orientation })} />
            </div>
            <div className={cn("gap-3 rounded-2xl bg-surface p-4", portrait ? "mx-auto grid max-w-[340px] grid-cols-2" : "space-y-3")}>
              <CardSvg side={preview.front} info={info} fonts={fonts} size={cardSize(preview.orientation)} className="w-full rounded-[3px] shadow-md" />
              <CardSvg side={preview.back} info={info} fonts={fonts} size={cardSize(preview.orientation)} className="w-full rounded-[3px] shadow-md" />
            </div>
            <p className="mt-2 text-xs text-mute">비워 둔 항목은 명함에서 자동으로 빠져요. 다음 단계에서 서로 다른 시안 4종을 보여 드려요.</p>
          </aside>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">업종과 취향에 맞춰 서로 다른 레이아웃 4종을 골랐어요. 마음에 드는 시안을 눌러 편집을 시작하세요.{design && " 새 시안을 고르면 지금까지 편집한 내용은 바뀝니다."}</p>
            <OrientationToggle value={info.orientation} onChange={(orientation) => setInfo({ ...info, orientation })} />
            <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex h-10 items-center gap-1.5 rounded-lg border-2 border-line px-3 text-sm font-bold hover:border-brand/50"><RefreshCw size={15} /> 다른 시안 보기</button>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {options.map((d, i) => (
              <li key={d.id}>
                <button type="button" onClick={() => { setDesign(d); setFocus(null); setStep(2); window.scrollTo({ top: 0 }); }} className="group w-full rounded-2xl border-2 border-line bg-surface p-4 text-left transition-colors hover:border-brand">
                  <div className={cn("mx-auto grid grid-cols-2 gap-3", d.orientation === "portrait" && "max-w-[300px]")}>
                    <CardSvg side={d.front} info={info} fonts={fonts} size={cardSize(d.orientation)} watermark className="w-full rounded-[3px] shadow-md" />
                    <CardSvg side={d.back} info={info} fonts={fonts} size={cardSize(d.orientation)} watermark className="w-full rounded-[3px] shadow-md" />
                  </div>
                  <p className="mt-3 flex items-center justify-between font-extrabold">
                    <span>시안 {i + 1} · {d.templateName} <span className="text-xs font-normal text-mute">· {d.palette.name}</span></span>
                    <span className="rounded-full bg-brand px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">이 시안으로 편집 →</span>
                  </p>
                  <p className="text-xs text-mute">{d.concept}</p>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-mute">※ 시연 단계에서는 AI 호출 없이, 템플릿 {TEMPLATES.length}종 가운데 조건에 맞는 4종을 골라 색과 구성을 맞춥니다.</p>
        </div>
      )}

      {step === 2 && design && (
        <div>
          <Editor key={`${design.id}-${focus?.id ?? ""}`} design={design} info={info} fonts={fonts} focus={focus} onDesign={setDesign} onInfo={setInfo} />
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => go(1)} className="h-11 rounded-xl border-2 border-line px-5 text-sm font-bold hover:border-brand/50">시안 다시 고르기</button>
            <button type="button" onClick={() => go(3)} className="h-11 rounded-xl bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark">인쇄 검사하고 내려받기 →</button>
          </div>
        </div>
      )}

      {step === 3 && design && <Finish design={design} info={info} fonts={fonts} paperId={paper} onPaper={setPaper} onFix={(t) => { setFocus(t); setStep(2); window.scrollTo({ top: 0 }); }} />}
    </div>
  );
}

/** 저장된 작업을 읽어야 하므로 브라우저에서만 그린다 */
export function StudioApp() {
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!ready) return <div className="mx-auto max-w-[1180px] px-4 py-8"><div className="h-[520px] animate-pulse rounded-2xl bg-surface" /></div>;
  return <Studio />;
}
