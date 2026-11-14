"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/catalog";
import { calculate, defaultSelection } from "@/lib/pricing";
import { won } from "@/lib/format";
import { ProductArt } from "@/components/site/ProductArt";
import { SampleBadge } from "@/components/site/SampleBadge";

const CATS = ["전체", ...Array.from(new Set(products.map((p) => p.category)))];

export function ProductList() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const [cat, setCat] = useState("전체");
  const list = products.filter(
    (p) => (cat === "전체" || p.category === cat) && (!q || `${p.name}${p.tagline}${p.category}`.includes(q)),
  );
  return (
    <>
      <p className="mt-1 flex items-center gap-2 text-sm text-mute">
        {q ? `‘${q}’ 검색 결과 ${list.length}개` : "옵션을 고르면 가격과 출고일이 바로 계산돼요"} <SampleBadge />
      </p>
      <div className="my-6 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${cat === c ? "border-brand bg-brand text-white" : "border-line hover:border-brand/50"}`}>
            {c}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-20 text-center text-mute">검색 결과가 없어요. 다른 키워드로 찾아보세요.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const r = calculate(p, defaultSelection(p));
            return (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="group block overflow-hidden rounded-2xl border border-line transition-shadow hover:shadow-lg">
                  <div className="overflow-hidden">
                    <ProductArt kind={p.art} tone={p.tone} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-brand">{p.category}</p>
                    <p className="text-lg font-extrabold">{p.name}</p>
                    <p className="mt-0.5 text-sm text-mute">{p.tagline}</p>
                    <p className="mt-3 text-sm">기본 사양 <b className="text-lg text-brand-dark">{won(r.total)}</b>~ <span className="text-[11px] text-mute">(샘플)</span></p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
