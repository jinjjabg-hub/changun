"use client";

import { useMemo, useState } from "react";
import { useNow } from "@/hooks/useNow";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, CalendarClock, ChevronDown, ShoppingCart } from "lucide-react";
import type { DesignMenu, DesignOption, Product } from "@/data/catalog";
import {
  CUSTOM_SIZE,
  allowedSides,
  allowedSizes,
  calculate,
  defaultSelection,
  describeSelection,
  emptyDesign,
  isDouble,
  sizeOf,
  finishAvailability,
  normalize,
  shipDate,
  toggleFinish,
  type DesignRow,
  type DesignSelection,
  type Selection,
} from "@/lib/pricing";
import { addToCart } from "@/lib/cart";
import { formatShipDate, num, won } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SampleBadge } from "@/components/site/SampleBadge";
import { ProductArt } from "@/components/site/ProductArt";
import { CutlineTool, type Artwork } from "./CutlineTool";
import { PrintFileTool } from "./PrintFileTool";
import { MaterialChip, MaterialPreview } from "./MaterialSwatch";

function Group({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-6 first:pt-0">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">{step}</span>
        <h3 className="text-base font-extrabold">{title}</h3>
        {hint && <span className="text-xs text-mute">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function CustomSizeInput({ value, range, bleed, onCommit }: { value: { w: number; h: number }; range: NonNullable<Product["customSize"]>; bleed: number; onCommit: (c: { w: number; h: number }) => void }) {
  // 입력 중에는 범위 보정을 하지 않고, 칸을 벗어나거나 Enter 를 누를 때 반영한다
  const [w, setW] = useState(String(value.w));
  const [h, setH] = useState(String(value.h));
  const commit = () => {
    // 보정된 값을 입력칸에도 바로 반영한다 (칸을 다시 만들지 않으므로 Tab 이동 시 포커스가 유지된다)
    const fit = (v: string, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || lo));
    const next = { w: fit(w, range.minW, range.maxW), h: fit(h, range.minH, range.maxH) };
    setW(String(next.w));
    setH(String(next.h));
    if (next.w !== value.w || next.h !== value.h) onCommit(next);
  };
  const field = "h-10 w-20 rounded-lg border-2 border-line bg-white px-2 text-center text-sm outline-none focus:border-brand";
  return (
    <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5">가로 <input className={field} inputMode="numeric" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} aria-label="가로(mm)" /> mm</label>
        <span className="text-mute">×</span>
        <label className="flex items-center gap-1.5">세로 <input className={field} inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} aria-label="세로(mm)" /> mm</label>
      </div>
      <p className="mt-2 text-xs text-mute">
        가로 {range.minW}~{range.maxW}mm, 세로 {range.minH}~{range.maxH}mm · 범위를 벗어나면 가장 가까운 값으로 맞춰져요
        {bleed > 0 && <> · 작업 사이즈 {value.w + bleed * 2}×{value.h + bleed * 2}mm (재단 여백 포함)</>}
        {" "}· 비규격 재단 할증 +{Math.round((range.surcharge - 1) * 100)}%
      </p>
    </div>
  );
}

const QTY = Array.from({ length: 10 }, (_, i) => i + 1);
const selectCls = "h-9 rounded-lg border-2 border-line bg-white px-2 text-sm outline-none focus:border-brand disabled:bg-surface disabled:text-mute/60";

/** 종류 선택 × 건수 = 금액 한 묶음 */
function DesignPick({ label, options, id, qty, onChange, allowNone }: { label: string; options: DesignOption[]; id: string; qty: number; onChange: (id: string, qty: number) => void; allowNone: boolean }) {
  const o = options.find((x) => x.id === id);
  return (
    <div className="flex items-center gap-1.5">
      <select aria-label={label} className={cn(selectCls, "min-w-0 flex-1")} value={id} onChange={(e) => onChange(e.target.value, e.target.value ? Math.max(1, qty) : 0)}>
        {allowNone && <option value="">선택안함</option>}
        {options.map((x) => <option key={x.id} value={x.id}>{x.name} ({won(x.price)})</option>)}
      </select>
      <span className="text-mute">×</span>
      <select aria-label={`${label} 건수`} className={selectCls} value={o ? qty : 0} disabled={!o} onChange={(e) => onChange(id, Number(e.target.value))}>
        {!o && <option value={0}>0</option>}
        {QTY.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="text-mute">건</span>
      <span className="w-[66px] shrink-0 text-right font-bold tabular-nums">{won(o ? o.price * qty : 0)}</span>
    </div>
  );
}

function DesignPanel({ menu, value, double, canBack, initial, onChange }: { menu: DesignMenu; value: DesignSelection | null; double: boolean; canBack: boolean; initial: DesignSelection; onChange: (d: DesignSelection | null) => void }) {
  if (!value) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onChange(initial)} className="h-10 rounded-lg border-2 border-brand bg-white px-4 text-sm font-bold text-brand hover:bg-brand-soft">+ 디자인 의뢰하기</button>
        <span className="text-xs text-mute">담당 디자이너가 시안을 만들어 드려요 · {menu.types[0].name} {won(menu.types[0].price)}부터 (샘플 가격)</span>
      </div>
    );
  }
  const row = (key: "front" | "back", title: string, allowNone: boolean) => {
    const r: DesignRow = value[key];
    const set = (patch: Partial<DesignRow>) => onChange({ ...value, [key]: { ...r, ...patch } });
    return (
      <div className="grid gap-x-4 gap-y-2 border-t border-line py-3 text-sm md:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <span className="pt-1.5 font-bold text-brand">{title}</span>
        <DesignPick label={`${title} 디자인`} options={menu.types} id={r.type} qty={r.qty} allowNone={allowNone} onChange={(type, qty) => set({ type, qty })} />
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-xs font-semibold text-mute">추가편집</span>
          <div className="min-w-0 flex-1"><DesignPick label={`${title} 추가편집`} options={menu.edits} id={r.edit} qty={r.editQty} allowNone onChange={(edit, editQty) => set({ edit, editQty })} /></div>
        </div>
      </div>
    );
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onChange(null)} className="h-9 rounded-lg border-2 border-danger/50 bg-white px-3 text-sm font-bold text-danger hover:bg-danger/5">− 디자인 신청 취소</button>
        <span className="text-xs text-mute">시안 확인 후 인쇄에 들어가요 · 출고일 +{menu.leadDays}일 (영업일)</span>
      </div>
      {row("front", "전면", false)}
      {double ? row("back", "후면", true) : canBack && <p className="border-t border-line py-3 text-xs text-mute">후면 디자인은 양면 인쇄를 선택하면 추가할 수 있어요.</p>}
      <div className="grid gap-x-4 gap-y-2 border-t border-line py-3 text-sm md:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <span className="pt-1.5 font-bold text-brand">옵션</span>
        <DesignPick label="디자인 옵션" options={menu.extras} id={value.extra} qty={value.extraQty} allowNone onChange={(extra, extraQty) => onChange({ ...value, extra, extraQty })} />
      </div>
    </div>
  );
}

function initialSelection(p: Product, sp: URLSearchParams): Selection {
  const base = defaultSelection(p);
  const qty = Number(sp.get("qty"));
  const fin = sp.get("finishes");
  return normalize(p, {
    ...base,
    paper: sp.get("paper") ?? base.paper,
    size: sp.get("custom") ? CUSTOM_SIZE : (sp.get("size") ?? base.size),
    side: sp.get("side") ?? base.side,
    custom: (() => {
      const m = /^(\d+)x(\d+)$/.exec(sp.get("custom") ?? "");
      return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
    })(),
    qty: qty > 0 ? qty : base.qty,
    finishes: fin ? fin.split(",").filter(Boolean) : [],
  }).selection;
}

export function ProductConfigurator({ product: p }: { product: Product }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [sel, setSel] = useState<Selection>(() => initialSelection(p, new URLSearchParams(sp.toString())));
  const [notices, setNotices] = useState<string[]>([]);
  const now = useNow();
  const [added, setAdded] = useState(false);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [allPapers, setAllPapers] = useState(false);

  const price = useMemo(() => calculate(p, sel), [p, sel]);
  const paper = p.papers.find((x) => x.id === sel.paper)!;
  const size = sizeOf(p, sel);
  const sizeOk = allowedSizes(p, sel.paper);
  const sideOk = allowedSides(p, sel.paper);
  const ship = now ? shipDate(now, price.leadDays) : null;

  const change = (patch: Partial<Selection>) => {
    const { selection, notices: n } = normalize(p, { ...sel, ...patch });
    setSel(selection);
    setNotices(n);
    setAdded(false);
  };

  const onToggle = (id: string) => {
    const { selection, removed } = toggleFinish(p, sel, id);
    const names = removed.map((r) => p.finishes.find((f) => f.id === r)?.name).filter(Boolean);
    setSel(selection);
    setNotices(names.length ? [`‘${p.finishes.find((f) => f.id === id)?.name}’ 선택으로 ${names.map((n) => `‘${n}’`).join(", ")} 가공이 해제되었어요`] : []);
    setAdded(false);
  };

  const submit = (goCheckout: boolean) => {
    addToCart(p.slug, sel, artwork ?? undefined);
    if (goCheckout) router.push("/checkout");
    else setAdded(true);
  };

  const applyArtwork = (a: Artwork) => {
    setArtwork(a);
    setAdded(false);
    const fid = p.cutlineFinish;
    const f = p.finishes.find((x) => x.id === fid);
    if (!f || sel.finishes.includes(f.id)) return setNotices([]);
    if (!finishAvailability(p, sel, f).ok) return setNotices([`칼선을 적용했어요. 현재 옵션에서는 ‘${f.name}’을 선택할 수 없어 담당자 확인이 필요해요`]);
    setSel(toggleFinish(p, sel, f.id).selection);
    setNotices([`칼선을 적용하면서 ‘${f.name}’ 후가공을 함께 선택했어요`]);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        {p.printFile && (
          <PrintFileTool
            size={size}
            double={isDouble(p, sel)}
            bleedMm={p.printFile.bleedMm}
            safeMm={p.printFile.safeMm}
            dpi={p.printFile.dpi}
            scale={p.printFile.scale}
            productName={p.name}
            applied={artwork}
            onApply={(a) => { setArtwork(a); setAdded(false); }}
            onClear={() => setArtwork(null)}
          />
        )}
        {p.cutlineFinish && (
          <CutlineTool
            size={size}
            applied={artwork}
            onApply={applyArtwork}
            onClear={() => setArtwork(null)}
          />
        )}
        {notices.length > 0 && (
          <div role="status" className="cw-fade-up mb-5 flex gap-2 rounded-xl border border-accent/60 bg-accent/15 p-3.5 text-sm text-[#6b4504]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <ul className="space-y-0.5">{notices.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}

        <Group step={1} title={p.paperLabel} hint="선택에 따라 가능한 사이즈·후가공이 달라져요">
          {(() => {
            const card = (x: Product["papers"][number], compact: boolean) => {
              const on = x.id === sel.paper;
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => change({ paper: x.id })}
                  className={cn("flex gap-3 rounded-xl border-2 text-left transition-colors", compact ? "p-2.5" : "p-3.5", on ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50")}
                >
                  <MaterialChip paper={x} className={cn("shrink-0 rounded-md shadow-sm ring-1 ring-black/5", compact ? "size-10" : "size-12")} />
                  <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("font-bold", compact && "text-sm")}>{x.name}</span>
                    {on && <Check size={16} className="shrink-0 text-brand" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-mute">{x.desc}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-mute">
                    {x.sizes && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">사이즈 {x.sizes.length}종</span>}
                    {x.finishes && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">후가공 {x.finishes.length}종</span>}
                    {x.factor !== 1 && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">{x.factor > 1 ? `+${Math.round((x.factor - 1) * 100)}%` : `${Math.round((x.factor - 1) * 100)}%`}</span>}
                  </span>
                  </span>
                </button>
              );
            };
            // 용지가 적으면 전부 펼치고, 많으면 추천만 먼저 보여준 뒤 분류별 전체 목록을 펼친다
            const preview = <div className="mt-4"><p className="mb-1.5 text-xs font-bold text-mute">선택한 {p.paperLabel}은 이런 느낌이에요</p><MaterialPreview paper={paper} baseline={p.papers.find((x) => x.id === p.defaults?.paper) ?? p.papers[0]} /></div>;
            if (p.papers.length <= 6) return <><div className="grid gap-2 sm:grid-cols-2">{p.papers.map((x) => card(x, false))}</div>{preview}</>;
            const groups = Array.from(new Set(p.papers.map((x) => x.group ?? "기타")));
            const short = p.papers.filter((x) => x.recommended || x.id === sel.paper);
            return (
              <>
                {allPapers ? (
                  <div className="space-y-4">
                    {groups.map((g) => (
                      <div key={g}>
                        <p className="mb-1.5 text-xs font-bold text-mute">{g}</p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{p.papers.filter((x) => (x.group ?? "기타") === g).map((x) => card(x, true))}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mb-1.5 text-xs font-bold text-mute">많이 찾는 {p.paperLabel}</p>
                    <div className="grid gap-2 sm:grid-cols-2">{short.map((x) => card(x, false))}</div>
                  </>
                )}
                <button type="button" aria-expanded={allPapers} onClick={() => setAllPapers((v) => !v)} className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-lg border-2 border-line text-sm font-bold text-brand hover:border-brand/50">
                  {allPapers ? `추천 ${p.paperLabel}만 보기` : `전체 ${p.paperLabel} ${p.papers.length}종 보기`}
                  <ChevronDown size={16} className={cn("transition-transform", allPapers && "rotate-180")} />
                </button>
                {preview}
              </>
            );
          })()}
        </Group>

        <Group step={2} title="사이즈">
          <div className="flex flex-wrap gap-2">
            {p.sizes.map((s) => {
              const ok = sizeOk.includes(s.id);
              const on = s.id === sel.size;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!ok}
                  aria-pressed={on}
                  title={ok ? undefined : `${paper.name}에서는 선택할 수 없어요`}
                  onClick={() => change({ size: s.id })}
                  className={cn(
                    "rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-colors",
                    on ? "border-brand bg-brand-soft font-bold" : "border-line",
                    ok ? "hover:border-brand/50" : "bg-surface text-mute/60 line-through decoration-mute/40",
                  )}
                >
                  {s.name}
                  {p.customSize && <span className="block text-[11px] font-normal text-mute no-underline">{s.w}×{s.h}mm</span>}
                  {!ok && <span className="block text-[11px] no-underline">이 {p.paperLabel}에서 불가</span>}
                </button>
              );
            })}
            {p.customSize && (
              <button
                type="button"
                aria-pressed={sel.size === CUSTOM_SIZE}
                onClick={() => change({ size: CUSTOM_SIZE, custom: sel.custom ?? { w: size.w, h: size.h } })}
                className={cn("rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-colors hover:border-brand/50", sel.size === CUSTOM_SIZE ? "border-brand bg-brand-soft font-bold" : "border-line")}
              >
                직접 입력
                <span className="block text-[11px] font-normal text-mute">원하는 크기(mm)</span>
              </button>
            )}
          </div>
          {p.customSize && sel.size === CUSTOM_SIZE && sel.custom && (
            <CustomSizeInput value={sel.custom} range={p.customSize} bleed={p.printFile?.bleedMm ?? 0} onCommit={(c) => change({ custom: c })} />
          )}
        </Group>

        {p.sides && (
          <Group step={3} title={p.sides.length > 2 ? "인쇄도수" : "인쇄 면"}>
            <div className="flex flex-wrap gap-2">
              {p.sides.filter((s) => !s.papers || s.papers.includes(sel.paper)).map((s) => {
                const ok = sideOk.includes(s.id);
                const on = s.id === sel.side;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!ok}
                    aria-pressed={on}
                    title={ok ? undefined : `${paper.name}에서는 선택할 수 없어요`}
                    onClick={() => change({ side: s.id })}
                    className={cn("rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors", on ? "border-brand bg-brand text-white" : ok ? "border-line hover:border-brand/50" : "border-line bg-surface text-mute/50 line-through")}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </Group>
        )}


        <Group step={p.sides ? 4 : 3} title="수량" hint="수량이 많을수록 단가가 내려가요">
          <div className="flex flex-wrap gap-2">
            {p.quantities.map((q) => {
              const on = q === sel.qty;
              const r = calculate(p, { ...sel, qty: q });
              return (
                <button
                  key={q}
                  type="button"
                  aria-pressed={on}
                  onClick={() => change({ qty: q })}
                  className={cn("min-w-[104px] rounded-lg border-2 px-3 py-2 text-left transition-colors", on ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50")}
                >
                  <span className="block text-sm font-bold">{num(q)}{p.unit}</span>
                  <span className="block text-[11px] text-mute">{won(r.print)}</span>
                </button>
              );
            })}
          </div>
          {p.allowSets && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <span className="font-semibold">건수(디자인 종류)</span>
              <select
                value={sel.sets}
                onChange={(e) => change({ sets: Number(e.target.value) })}
                className="h-9 rounded-lg border-2 border-line bg-white px-3 outline-none focus:border-brand"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}종</option>
                ))}
              </select>
              <span className="text-xs text-mute">같은 사양, 내용만 다른 경우</span>
            </label>
          )}
        </Group>

        <Group step={p.sides ? 5 : 4} title="후가공" hint="여러 개 선택할 수 있어요 (일부는 함께 선택 불가)">
          <div className="grid gap-2 sm:grid-cols-2">
            {p.finishes.map((f) => {
              const av = finishAvailability(p, sel, f);
              const on = sel.finishes.includes(f.id);
              const cost = calculate(p, { ...sel, finishes: [f.id] }).finishLines[0]?.price ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!av.ok}
                  aria-pressed={on}
                  onClick={() => onToggle(f.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                    on ? "border-brand bg-brand-soft" : "border-line",
                    av.ok ? "hover:border-brand/50" : "bg-surface opacity-70",
                  )}
                >
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2", on ? "border-brand bg-brand text-white" : "border-line bg-white")}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="text-sm font-bold">{f.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-brand-dark">+{won(cost)}</span>
                    </span>
                    <span className="block text-xs text-mute">{av.ok ? f.desc : av.reason}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Group>

        {p.design && (
          <Group step={p.sides ? 6 : 5} title="디자인" hint="인쇄 파일이 없으면 디자인을 맡길 수 있어요">
            <DesignPanel menu={p.design} value={sel.design ?? null} double={isDouble(p, sel)} canBack={!!p.sides?.some((x) => x.faces === 2)} onChange={(d) => change({ design: d })} initial={emptyDesign(p)} />
          </Group>
        )}
      </div>

      {/* 가격 패널 */}
      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="overflow-hidden rounded-2xl border-2 border-brand bg-white shadow-[0_14px_40px_-16px_rgba(10,61,46,.45)]">
          <ProductArt kind={p.art} tone={p.tone} className="hidden h-36 w-full lg:block" />
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-extrabold">{p.name}</p>
              <SampleBadge />
            </div>
            <ul className="space-y-1 text-[13px] text-mute">
              {describeSelection(p, sel).map((l) => <li key={l}>{l}</li>)}
              {artwork && <li className="font-semibold text-brand">{artwork.label}</li>}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-mute">인쇄비</dt><dd>{won(price.print)}</dd></div>
              {price.finishLines.map((l) => (
                <div key={l.id} className="flex justify-between"><dt className="text-mute">{l.name}</dt><dd>+{won(l.price)}</dd></div>
              ))}
              {sel.sets > 1 && <div className="flex justify-between"><dt className="text-mute">건수</dt><dd>× {sel.sets}종</dd></div>}
              {price.designLines.map((l) => (
                <div key={l.id} className="flex justify-between gap-3"><dt className="text-mute">{l.name}</dt><dd className="shrink-0">+{won(l.price)}</dd></div>
              ))}
            </dl>

            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <span className="text-sm font-bold">합계 <span className="text-[11px] font-normal text-mute">(VAT 별도)</span></span>
              <span key={price.total} className="cw-fade-up text-[28px] font-extrabold leading-none text-brand-dark">{won(price.total)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-mute">{p.unit}당 약 {won(price.perUnit)} · VAT 포함 {won(price.total * 1.1)}</p>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft p-3 text-sm">
              <CalendarClock size={18} className="shrink-0 text-brand" />
              <div>
                <p className="font-bold text-brand-dark">{ship ? `${formatShipDate(ship)} 출고 예정` : "출고일 계산 중…"}</p>
                <p className="text-xs text-mute">영업일 {price.leadDays}일 · 평일 15시 이전 접수 기준</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => submit(false)} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-brand text-[15px] font-bold text-brand hover:bg-brand-soft">
                <ShoppingCart size={17} /> 장바구니
              </button>
              <button type="button" onClick={() => submit(true)} className="h-12 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark">
                바로 주문
              </button>
            </div>
            {added && (
              <p role="status" className="cw-fade-up mt-3 flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark">
                장바구니에 담았어요
                <Link href="/cart" className="underline">보러가기</Link>
              </p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-mute">※ 시연용 샘플 가격입니다. 결제는 진행되지 않습니다.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
