"use client";

import { useMemo, useState } from "react";
import { useNow } from "@/hooks/useNow";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, CalendarClock, ShoppingCart } from "lucide-react";
import type { Product } from "@/data/catalog";
import {
  allowedSides,
  allowedSizes,
  calculate,
  defaultSelection,
  describeSelection,
  finishAvailability,
  normalize,
  shipDate,
  toggleFinish,
  type Selection,
} from "@/lib/pricing";
import { addToCart } from "@/lib/cart";
import { formatShipDate, num, won } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SampleBadge } from "@/components/site/SampleBadge";
import { ProductArt } from "@/components/site/ProductArt";
import { CutlineTool, type Artwork } from "./CutlineTool";

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

function initialSelection(p: Product, sp: URLSearchParams): Selection {
  const base = defaultSelection(p);
  const qty = Number(sp.get("qty"));
  const fin = sp.get("finishes");
  return normalize(p, {
    ...base,
    paper: sp.get("paper") ?? base.paper,
    size: sp.get("size") ?? base.size,
    side: sp.get("side") ?? base.side,
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

  const price = useMemo(() => calculate(p, sel), [p, sel]);
  const paper = p.papers.find((x) => x.id === sel.paper)!;
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
    addToCart(p.slug, sel, artwork ? { name: artwork.name, thumb: artwork.thumb, marginMm: artwork.marginMm } : undefined);
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
        {p.cutlineFinish && (
          <CutlineTool
            size={p.sizes.find((x) => x.id === sel.size)!}
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
          <div className="grid gap-2 sm:grid-cols-2">
            {p.papers.map((x) => {
              const on = x.id === sel.paper;
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => change({ paper: x.id })}
                  className={cn("rounded-xl border-2 p-3.5 text-left transition-colors", on ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50")}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-bold">{x.name}</span>
                    {on && <Check size={16} className="text-brand" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-mute">{x.desc}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-mute">
                    {x.sizes && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">사이즈 {x.sizes.length}종</span>}
                    {x.finishes && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">후가공 {x.finishes.length}종</span>}
                    {x.factor !== 1 && <span className="rounded bg-white/70 px-1.5 py-0.5 ring-1 ring-line">{x.factor > 1 ? `+${Math.round((x.factor - 1) * 100)}%` : `${Math.round((x.factor - 1) * 100)}%`}</span>}
                  </span>
                </button>
              );
            })}
          </div>
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
                  {!ok && <span className="block text-[11px] no-underline">이 {p.paperLabel}에서 불가</span>}
                </button>
              );
            })}
          </div>
        </Group>

        {p.sides && (
          <Group step={3} title="인쇄 면">
            <div className="inline-flex rounded-lg border-2 border-line p-1">
              {p.sides.map((s) => {
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
                    className={cn("rounded-md px-5 py-2 text-sm font-semibold", on ? "bg-brand text-white" : ok ? "hover:bg-brand-soft" : "text-mute/50")}
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
              {artwork && <li className="font-semibold text-brand">칼선: 자동 생성 적용 (여백 {artwork.marginMm}mm)</li>}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-mute">인쇄비</dt><dd>{won(price.print)}</dd></div>
              {price.finishLines.map((l) => (
                <div key={l.id} className="flex justify-between"><dt className="text-mute">{l.name}</dt><dd>+{won(l.price)}</dd></div>
              ))}
              {sel.sets > 1 && <div className="flex justify-between"><dt className="text-mute">건수</dt><dd>× {sel.sets}종</dd></div>}
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
