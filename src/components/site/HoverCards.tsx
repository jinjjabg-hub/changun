import Link from "next/link";
import { products } from "@/data/catalog";
import { ProductArt } from "./ProductArt";

/** 호버하면 상품 정보 오버레이가 올라오는 카드 (신상품/카테고리 소개) */
export function HoverCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {products.map((p) => (
        <li key={p.slug}>
          <Link href={`/products/${p.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl">
            <ProductArt kind={p.art} tone={p.tone} className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-x-0 top-0 flex justify-between p-3 text-xs font-bold">
              <span className="rounded-full bg-white/90 px-2 py-1 text-brand-dark">{p.category}</span>
              {p.badge && <span className={`rounded px-1.5 py-1 ${p.badge === "BEST" ? "bg-danger text-white" : "bg-accent text-ink"}`}>{p.badge}</span>}
            </div>
            <div className="absolute inset-x-0 bottom-0 translate-y-[calc(100%-64px)] bg-brand-dark/95 p-4 text-white transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
              <p className="text-lg font-extrabold">{p.name}</p>
              <p className="mt-1 text-[13px] text-white/75">{p.tagline}</p>
              <ul className="mt-3 space-y-1 text-xs text-white/85">
                {p.highlights.map((h) => (
                  <li key={h}>· {h}</li>
                ))}
              </ul>
              <span className="mt-4 inline-flex rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold text-ink">견적 확인하기 →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
