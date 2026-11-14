"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProduct } from "@/data/catalog";
import { presetHref, type Preset } from "@/data/home";
import { calculate, normalize, defaultSelection } from "@/lib/pricing";
import { won } from "@/lib/format";
import { ProductArt } from "./ProductArt";

function presetPrice(pr: Preset) {
  const p = getProduct(pr.slug)!;
  const base = defaultSelection(p);
  const q = pr.query ?? {};
  const sel = normalize(p, {
    ...base,
    paper: q.paper ?? base.paper,
    size: q.size ?? base.size,
    side: q.side ?? base.side,
    qty: q.qty ?? base.qty,
    finishes: q.finishes ?? [],
  }).selection;
  return calculate(p, sel).total;
}

export function ProductCarousel({ items, numbered = false }: { items: Preset[]; numbered?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // 끝에서 다음을 누르면 처음으로 (loop)
    if (dir === 1 && edge.end) return el.scrollTo({ left: 0, behavior: "smooth" });
    if (dir === -1 && edge.start) return el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    el.scrollBy({ left: dir * (el.clientWidth - 40), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="absolute -top-[58px] right-0 flex gap-2">
        <button type="button" aria-label="이전 상품" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-full border border-line bg-white hover:border-brand hover:bg-brand hover:text-white">
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="다음 상품" onClick={() => move(1)} className="grid size-9 place-items-center rounded-full border border-line bg-white hover:border-brand hover:bg-brand hover:text-white">
          <ChevronRight size={18} />
        </button>
      </div>
      <ul ref={ref} onScroll={measure} className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, idx) => {
          const p = getProduct(it.slug)!;
          return (
            <li key={`${it.slug}-${idx}`} className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]">
              <Link href={presetHref(it)} className="group block">
                <div className="relative overflow-hidden rounded-2xl">
                  <ProductArt kind={p.art} tone={p.tone} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
                  {numbered && (
                    <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-lg bg-brand-dark text-[13px] font-extrabold text-white">{idx + 1}</span>
                  )}
                  {it.tag && (
                    <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-extrabold ${it.tag === "BEST" ? "bg-danger text-white" : "bg-accent text-ink"}`}>{it.tag}</span>
                  )}
                </div>
                <p className="mt-3 truncate text-[15px] font-bold group-hover:text-brand">{it.title}</p>
                <p className="mt-0.5 truncate text-xs text-mute">{it.sub}</p>
                <p className="mt-1.5 text-[15px] font-extrabold text-brand-dark">
                  {won(presetPrice(it))}
                  <span className="ml-1 text-[11px] font-medium text-mute">(샘플)</span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
