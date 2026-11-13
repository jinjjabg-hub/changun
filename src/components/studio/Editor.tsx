"use client";

import { useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Circle, Minus, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react";
import { WEIGHTS, type FontSet } from "@/studio/fonts";
import { boxOf, moved } from "@/studio/geometry";
import { PALETTES } from "@/studio/palettes";
import { recolor } from "@/studio/store";
import { CARD, type Align, type CardInfo, type Design, type El, type SideKey, type Weight } from "@/studio/types";
import { cn } from "@/lib/utils";
import { CardSvg } from "./CardSvg";

const num = "h-9 w-full rounded-lg border-2 border-line bg-white px-2 text-sm outline-none focus:border-brand";
const SIDE_NAME: Record<SideKey, string> = { front: "앞면", back: "뒷면" };
const TYPE_NAME: Record<El["type"], string> = { text: "글자", rect: "사각형", line: "선", circle: "원", poly: "도형", image: "이미지", qr: "QR" };

function Num({ label, value, onChange, step = 0.5, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className="block text-xs font-semibold text-mute">
      {label}
      <input type="number" className={cn(num, "mt-0.5 text-ink")} value={Math.round(value * 100) / 100} step={step} min={min} max={max} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onChange(v); }} />
    </label>
  );
}

function Color({ label, value, swatches, onChange }: { label: string; value: string; swatches: string[]; onChange: (v: string) => void }) {
  return (
    <div className="text-xs font-semibold text-mute">
      {label}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-line bg-white p-0.5" />
        {Array.from(new Set(swatches)).map((c) => (
          <button key={c} type="button" aria-label={`색 ${c}`} onClick={() => onChange(c)} className={cn("size-6 rounded-full ring-1 ring-line", value.toLowerCase() === c.toLowerCase() && "ring-2 ring-brand ring-offset-1")} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

export function Editor({ design, info, fonts, focus, onDesign, onInfo }: {
  design: Design; info: CardInfo; fonts: FontSet | null; focus?: { side: SideKey; id: string } | null;
  onDesign: (d: Design) => void; onInfo: (i: CardInfo) => void;
}) {
  const [side, setSide] = useState<SideKey>(focus?.side ?? "front");
  const [sel, setSel] = useState<string | null>(focus?.id ?? null);
  const [hist, setHist] = useState<{ past: Design[]; future: Design[] }>({ past: [], future: [] });
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [guides, setGuides] = useState(true);
  const svg = useRef<SVGSVGElement>(null);

  const commit = (next: Design) => {
    setHist((h) => ({ past: [...h.past.slice(-49), design], future: [] }));
    onDesign(next);
  };
  const undo = () => {
    const prev = hist.past[hist.past.length - 1];
    if (!prev) return;
    setHist({ past: hist.past.slice(0, -1), future: [design, ...hist.future] });
    onDesign(prev);
  };
  const redo = () => {
    const next = hist.future[0];
    if (!next) return;
    setHist({ past: [...hist.past, design], future: hist.future.slice(1) });
    onDesign(next);
  };

  const cur = design[side];
  const setElements = (elements: El[]) => commit({ ...design, [side]: { ...cur, elements } });
  const patch = (id: string, p: Partial<El>) => setElements(cur.elements.map((e) => (e.id === id ? ({ ...e, ...p } as El) : e)));
  const el = cur.elements.find((e) => e.id === sel) ?? null;
  const pal = design.palette;
  const swatches = [pal.ink, pal.accent, pal.sub, pal.dark, pal.onDark, pal.paper, "#ffffff", "#000000"];

  /* ── 끌어서 옮기기 ── */
  const toMm = (e: { clientX: number; clientY: number }) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const startDrag = (target: El, e: React.PointerEvent) => {
    e.preventDefault();
    setSel(target.id);
    const start = toMm(e);
    let last = { dx: 0, dy: 0 };
    const move = (ev: PointerEvent) => {
      const p = toMm(ev);
      last = { dx: p.x - start.x, dy: p.y - start.y };
      setDrag({ id: target.id, ...last });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      if (Math.abs(last.dx) + Math.abs(last.dy) > 0.2) {
        setElements(cur.elements.map((x) => (x.id === target.id ? moved(x, last.dx, last.dy) : x)));
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const shown = drag ? { ...cur, elements: cur.elements.map((x) => (x.id === drag.id ? moved(x, drag.dx, drag.dy) : x)) } : cur;

  /* ── 추가 · 삭제 · 순서 ── */
  const onDark = () => {
    const n = parseInt(cur.bg.slice(1), 16);
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 128;
  };
  const add = (kind: "text" | "rect" | "circle" | "line") => {
    const id = `u-${Date.now().toString(36)}`;
    const ink = onDark() ? pal.onDark : pal.ink;
    const created: El =
      kind === "text" ? { id, type: "text", label: "새 글자", text: "새 글자", x: CARD.w / 2, y: CARD.h / 2, size: 8, weight: 400, color: ink, align: "center" }
      : kind === "rect" ? { id, type: "rect", label: "사각형", x: 35, y: 20, w: 20, h: 10, fill: pal.accent }
      : kind === "circle" ? { id, type: "circle", label: "원", cx: 45, cy: 25, r: 6, fill: pal.accent }
      : { id, type: "line", label: "선", x1: 30, y1: 25, x2: 60, y2: 25, stroke: ink, width: 0.3 };
    setElements([...cur.elements, created]);
    setSel(id);
  };
  const remove = () => {
    if (!el) return;
    setElements(cur.elements.filter((e) => e.id !== el.id));
    setSel(null);
  };
  const reorder = (dir: 1 | -1) => {
    if (!el) return;
    const i = cur.elements.indexOf(el);
    const j = i + dir;
    if (j < 0 || j >= cur.elements.length) return;
    const next = [...cur.elements];
    [next[i], next[j]] = [next[j], next[i]];
    setElements(next);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input,select,textarea")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (!el) return;
    const step = e.shiftKey ? 2 : 0.5;
    const d = e.key === "ArrowLeft" ? [-step, 0] : e.key === "ArrowRight" ? [step, 0] : e.key === "ArrowUp" ? [0, -step] : e.key === "ArrowDown" ? [0, step] : null;
    if (d) { e.preventDefault(); setElements(cur.elements.map((x) => (x.id === el.id ? moved(x, d[0], d[1]) : x))); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(); }
  };

  const toolBtn = "flex h-9 items-center gap-1.5 rounded-lg border-2 border-line bg-white px-2.5 text-xs font-bold hover:border-brand/50 disabled:opacity-40";

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_220px]" onKeyDown={onKey}>
      {/* 가운데: 캔버스 (모바일에서는 맨 위) */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border-2 border-line bg-white p-0.5">
            {(["front", "back"] as SideKey[]).map((k) => (
              <button key={k} type="button" aria-pressed={side === k} onClick={() => { setSide(k); setSel(null); }} className={cn("rounded-md px-4 py-1.5 text-sm font-bold", side === k ? "bg-brand text-white" : "hover:bg-brand-soft")}>{SIDE_NAME[k]}</button>
            ))}
          </div>
          <button type="button" className={toolBtn} onClick={undo} disabled={!hist.past.length} aria-label="실행 취소"><Undo2 size={15} /> 취소</button>
          <button type="button" className={toolBtn} onClick={redo} disabled={!hist.future.length} aria-label="다시 실행"><Redo2 size={15} /> 다시</button>
          <label className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-mute"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} className="accent-[#0f5a43]" /> 재단선 · 안전 영역</label>
        </div>
        <div tabIndex={0} aria-label="명함 편집 캔버스. 화살표 키로 이동, Delete로 삭제" className="rounded-2xl bg-[repeating-conic-gradient(#eef1ef_0_25%,#fafbfa_0_50%)] bg-[length:16px_16px] p-4 outline-none ring-brand/40 focus-visible:ring-2 sm:p-8">
          <CardSvg svgRef={svg} side={shown} info={info} fonts={fonts} guides={guides} selectedId={sel} onElementPointerDown={startDrag} onBackgroundPointerDown={() => setSel(null)} className="mx-auto w-full max-w-[640px] shadow-xl" />
        </div>
        <p className="mt-2 text-center text-xs text-mute">객체를 눌러 선택하고 끌어서 옮기세요 · 화살표 키로 0.5mm씩(Shift 2mm) · Delete로 삭제</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className={toolBtn} onClick={() => add("text")}><Type size={15} /> 글자 추가</button>
          <button type="button" className={toolBtn} onClick={() => add("rect")}><Square size={15} /> 사각형</button>
          <button type="button" className={toolBtn} onClick={() => add("circle")}><Circle size={15} /> 원</button>
          <button type="button" className={toolBtn} onClick={() => add("line")}><Minus size={15} /> 선</button>
        </div>
      </div>

      {/* 왼쪽: 속성 */}
      <aside className="order-2 space-y-3 lg:order-1">
        <div className="rounded-2xl border border-line p-4">
          {!el ? (
            <div className="space-y-4">
              <p className="text-sm font-extrabold">{SIDE_NAME[side]} 전체</p>
              <Color label="배경색" value={cur.bg} swatches={[pal.paper, pal.dark, pal.accent, "#ffffff", "#000000"]} onChange={(bg) => commit({ ...design, [side]: { ...cur, bg } })} />
              <div className="text-xs font-semibold text-mute">
                색 조합 바꾸기 <span className="font-normal">(위치·크기는 그대로)</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {PALETTES.map((p) => (
                    <button key={p.id} type="button" title={p.name} aria-label={`${p.name} 색 조합`} aria-pressed={pal.id === p.id} onClick={() => commit(recolor(design, p))} className={cn("flex overflow-hidden rounded-full ring-1 ring-line", pal.id === p.id && "ring-2 ring-brand ring-offset-1")}>
                      <i className="block size-6" style={{ background: p.accent }} /><i className="block size-6" style={{ background: p.dark }} />
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-mute">명함에서 객체를 누르면 여기에서 글자, 색, 크기를 바꿀 수 있어요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold">{TYPE_NAME[el.type]} <span className="font-normal text-mute">· {el.label}</span></p>
                <div className="flex gap-1">
                  <button type="button" aria-label="앞으로" title="앞으로" onClick={() => reorder(1)} className="rounded p-1 hover:bg-surface"><ArrowUp size={15} /></button>
                  <button type="button" aria-label="뒤로" title="뒤로" onClick={() => reorder(-1)} className="rounded p-1 hover:bg-surface"><ArrowDown size={15} /></button>
                  <button type="button" aria-label="삭제" title="삭제" onClick={remove} className="rounded p-1 text-danger hover:bg-danger/5"><Trash2 size={15} /></button>
                </div>
              </div>

              {el.type === "text" && (
                <>
                  <label className="block text-xs font-semibold text-mute">
                    내용 {el.bind && <span className="font-normal text-brand">· 고객 정보와 연결됨 (앞뒤 함께 바뀜)</span>}
                    <input className={cn(num, "mt-0.5 text-ink")} value={el.bind ? info[el.bind] : (el.text ?? "")} onChange={(e) => (el.bind ? onInfo({ ...info, [el.bind]: e.target.value }) : patch(el.id, { text: e.target.value, label: e.target.value || "글자" }))} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Num label="크기 (pt)" value={el.size} step={0.5} min={4} max={80} onChange={(size) => patch(el.id, { size: Math.min(80, Math.max(4, size)) })} />
                    <label className="block text-xs font-semibold text-mute">
                      굵기
                      <select className={cn(num, "mt-0.5 text-ink")} value={el.weight} onChange={(e) => patch(el.id, { weight: Number(e.target.value) as Weight })}>
                        {WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="inline-flex rounded-lg border-2 border-line p-0.5">
                      {([["left", AlignLeft, "왼쪽"], ["center", AlignCenter, "가운데"], ["right", AlignRight, "오른쪽"]] as const).map(([a, Icon, name]) => (
                        <button key={a} type="button" aria-label={`${name} 정렬`} aria-pressed={el.align === a} onClick={() => patch(el.id, { align: a as Align })} className={cn("rounded-md p-1.5", el.align === a ? "bg-brand text-white" : "hover:bg-brand-soft")}><Icon size={15} /></button>
                      ))}
                    </div>
                    <label className="flex-1 text-xs font-semibold text-mute">자간<input type="range" min={0} max={0.4} step={0.02} value={el.tracking ?? 0} onChange={(e) => patch(el.id, { tracking: Number(e.target.value) })} className="w-full accent-[#0f5a43]" /></label>
                  </div>
                  <Color label="글자 색" value={el.color} swatches={swatches} onChange={(color) => patch(el.id, { color })} />
                  <div className="grid grid-cols-2 gap-2"><Num label="가로 위치 (mm)" value={el.x} onChange={(x) => patch(el.id, { x })} /><Num label="세로 위치 (mm)" value={el.y} onChange={(y) => patch(el.id, { y })} /></div>
                </>
              )}
              {el.type === "rect" && (
                <>
                  <Color label={el.stroke ? "테두리 색" : "채움 색"} value={el.stroke ?? el.fill} swatches={swatches} onChange={(c) => patch(el.id, el.stroke ? { stroke: c } : { fill: c })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Num label="가로 (mm)" value={el.w} min={0.2} onChange={(w) => patch(el.id, { w: Math.max(0.2, w) })} /><Num label="세로 (mm)" value={el.h} min={0.2} onChange={(h) => patch(el.id, { h: Math.max(0.2, h) })} />
                    <Num label="왼쪽 (mm)" value={el.x} onChange={(x) => patch(el.id, { x })} /><Num label="위 (mm)" value={el.y} onChange={(y) => patch(el.id, { y })} />
                    <Num label="모서리 둥글기" value={el.radius ?? 0} min={0} onChange={(radius) => patch(el.id, { radius: Math.max(0, radius) })} />
                  </div>
                </>
              )}
              {el.type === "circle" && (
                <>
                  <Color label={el.stroke ? "테두리 색" : "채움 색"} value={el.stroke ?? el.fill} swatches={swatches} onChange={(c) => patch(el.id, el.stroke ? { stroke: c } : { fill: c })} />
                  <div className="grid grid-cols-3 gap-2"><Num label="반지름" value={el.r} min={0.2} onChange={(r) => patch(el.id, { r: Math.max(0.2, r) })} /><Num label="중심 가로" value={el.cx} onChange={(cx) => patch(el.id, { cx })} /><Num label="중심 세로" value={el.cy} onChange={(cy) => patch(el.id, { cy })} /></div>
                </>
              )}
              {el.type === "line" && (
                <>
                  <Color label="선 색" value={el.stroke} swatches={swatches} onChange={(stroke) => patch(el.id, { stroke })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Num label="굵기 (mm)" value={el.width} step={0.05} min={0.1} onChange={(width) => patch(el.id, { width: Math.max(0.1, width) })} />
                    <Num label="길이 (mm)" value={Math.hypot(el.x2 - el.x1, el.y2 - el.y1)} min={1} onChange={(len) => { const a = Math.atan2(el.y2 - el.y1, el.x2 - el.x1); patch(el.id, { x2: el.x1 + Math.cos(a) * Math.max(1, len), y2: el.y1 + Math.sin(a) * Math.max(1, len) }); }} />
                  </div>
                </>
              )}
              {el.type === "poly" && <Color label="채움 색" value={el.fill} swatches={swatches} onChange={(fill) => patch(el.id, { fill })} />}
              {el.type === "image" && (
                <>
                  <Num label="크기 · 가로 (mm)" value={el.w} min={3} max={80} onChange={(w) => { const k = Math.min(80, Math.max(3, w)) / el.w; patch(el.id, { w: el.w * k, h: el.h * k }); }} />
                  <div className="grid grid-cols-2 gap-2"><Num label="왼쪽 (mm)" value={el.x} onChange={(x) => patch(el.id, { x })} /><Num label="위 (mm)" value={el.y} onChange={(y) => patch(el.id, { y })} /></div>
                  {el.bind === "photo" && <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={!!el.round} onChange={(e) => patch(el.id, { round: e.target.checked })} className="accent-[#0f5a43]" /> 둥글게 자르기</label>}
                </>
              )}
              {el.type === "qr" && (
                <>
                  <Num label="크기 (mm)" value={el.size} min={8} max={40} onChange={(size) => patch(el.id, { size: Math.min(40, Math.max(8, size)) })} />
                  <Color label="QR 색" value={el.color} swatches={swatches} onChange={(color) => patch(el.id, { color })} />
                  <div className="grid grid-cols-2 gap-2"><Num label="왼쪽 (mm)" value={el.x} onChange={(x) => patch(el.id, { x })} /><Num label="위 (mm)" value={el.y} onChange={(y) => patch(el.id, { y })} /></div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 오른쪽: 레이어 */}
      <aside className="order-3">
        <div className="rounded-2xl border border-line p-3">
          <p className="mb-2 px-1 text-sm font-extrabold">{SIDE_NAME[side]} 객체 <span className="font-normal text-mute">{cur.elements.length}</span></p>
          <ul className="max-h-[420px] space-y-0.5 overflow-y-auto text-[13px]">
            {[...cur.elements].reverse().map((e) => {
              const hidden = !boxOf(e, info, fonts);
              return (
                <li key={e.id}>
                  <button type="button" aria-pressed={sel === e.id} onClick={() => setSel(e.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left", sel === e.id ? "bg-brand-soft font-bold text-brand-dark" : "hover:bg-surface", hidden && "opacity-50")}>
                    <span className="w-10 shrink-0 text-[11px] text-mute">{TYPE_NAME[e.type]}</span>
                    <span className="truncate">{e.label ?? e.id}{hidden && " (값 없음)"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
