"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { categories, getProduct } from "@/data/catalog";
import { useCartCount } from "@/lib/cart";
import { Logo } from "./Logo";
import { ProductArt } from "./ProductArt";

function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="flex h-11 w-full max-w-[420px] items-center rounded-full border-2 border-brand bg-white pl-5 pr-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="명함, 스티커, 현수막 검색"
        aria-label="상품 검색"
        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-mute"
      />
      <button type="submit" aria-label="검색" className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand-dark">
        <Search size={16} />
      </button>
    </form>
  );
}

function CartLink() {
  const count = useCartCount();
  return (
    <Link href="/cart" className="relative flex flex-col items-center gap-0.5 px-2 text-[11px] text-ink hover:text-brand">
      <ShoppingCart size={22} />
      <span>장바구니</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-[18px] text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const wrapRef = useRef<HTMLElement>(null);

  // 페이지 이동 시 메뉴 닫기 (렌더 중 상태 보정 패턴)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenCat(null);
    setMobile(false);
  }

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenCat(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenCat(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = hover ?? openCat;

  return (
    <header ref={wrapRef} className="sticky top-0 z-40 border-b border-line bg-white" onMouseLeave={() => { setHover(null); setOpenCat(null); }}>
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center gap-6 px-4">
        <button type="button" className="lg:hidden" aria-label="메뉴 열기" onClick={() => setMobile((v) => !v)}>
          {mobile ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Logo />
        <div className="ml-auto hidden flex-1 justify-center md:flex">
          <Suspense fallback={null}>
            <SearchBox />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <button type="button" title="시연용 데모에서는 제공하지 않아요" className="hidden text-[13px] text-mute hover:text-ink sm:block">
            로그인
          </button>
          <button type="button" title="시연용 데모에서는 제공하지 않아요" className="hidden text-[13px] text-mute hover:text-ink sm:block">
            회원가입
          </button>
          <CartLink />
        </div>
      </div>

      {/* GNB */}
      <nav aria-label="주요 카테고리" className="hidden border-t border-line lg:block">
        <div className="mx-auto flex h-[50px] max-w-[1180px] items-center gap-1 px-4">
          {categories.map((c) => {
            const on = active === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-expanded={openCat === c.id}
                onMouseEnter={() => { setHover(c.id); setOpenCat((v) => (v ? c.id : v)); }}
                onClick={() => setOpenCat((v) => (v === c.id ? null : c.id))}
                className={`h-full px-4 text-[15px] font-bold transition-colors ${on ? "text-brand" : "text-ink hover:text-brand"}`}
              >
                {c.name}
                <span className={`mt-[-3px] block h-[3px] rounded-full transition-all ${on ? "bg-brand" : "bg-transparent"}`} />
              </button>
            );
          })}
          <Link href="/products" className="h-[50px] px-4 text-[15px] leading-[50px] text-mute hover:text-brand">전체 상품</Link>
          <Link href="/studio" className="flex h-[50px] items-center gap-1.5 px-4 text-[15px] font-bold text-brand hover:text-brand-dark">명함 스튜디오<span className="rounded bg-accent px-1 text-[10px] font-extrabold text-ink">NEW</span></Link>
          <span className="ml-auto text-xs text-mute">평일 15시까지 접수 시 당일 제작 시작</span>
        </div>
      </nav>

      {/* 메가메뉴 */}
      {openCat && (
        <div className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-[0_18px_30px_-12px_rgba(10,61,46,.25)] lg:block">
          <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(4,1fr)_300px] gap-6 px-4 py-7">
            {categories.map((c) => (
              <div key={c.id} onMouseEnter={() => setHover(c.id)} className={`rounded-xl p-4 transition-colors ${active === c.id ? "bg-brand-soft" : ""}`}>
                <p className="text-base font-extrabold text-brand-dark">{c.name}</p>
                <p className="mb-3 text-xs text-mute">{c.blurb}</p>
                <ul className="space-y-1.5">
                  {c.items.map((it) => (
                    <li key={it.label}>
                      {it.slug ? (
                        <Link href={`/products/${it.slug}`} className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-brand hover:underline">
                          {it.label}
                          {it.tag && <span className={`rounded px-1 text-[10px] font-bold ${it.tag === "BEST" ? "bg-danger text-white" : "bg-accent text-ink"}`}>{it.tag}</span>}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-mute/70" title="시연 데모에서는 준비 중이에요">
                          {it.label}
                          <span className="rounded border border-line px-1 text-[10px]">준비중</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {(() => {
              const p = getProduct("business-card")!;
              return (
                <Link href={`/products/${p.slug}`} className="group relative overflow-hidden rounded-xl">
                  <ProductArt kind={p.art} tone={p.tone} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-sm font-bold text-white">
                    이번 주 인기 · {p.name} →
                  </span>
                </Link>
              );
            })()}
          </div>
        </div>
      )}

      {/* 모바일 메뉴 */}
      {mobile && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-line bg-white px-4 py-4 lg:hidden">
          <div className="mb-4 md:hidden">
            <Suspense fallback={null}>
              <SearchBox />
            </Suspense>
          </div>
          <Link href="/studio" className="mb-4 block rounded-xl bg-brand-soft px-3 py-2.5 font-extrabold text-brand-dark">명함 스튜디오 · 정보만 넣으면 인쇄 파일까지 →</Link>
          {categories.map((c) => (
            <div key={c.id} className="mb-4">
              <p className="mb-1 font-extrabold text-brand-dark">{c.name}</p>
              <ul className="grid grid-cols-2 gap-1">
                {c.items.map((it) => (
                  <li key={it.label} className="text-sm">
                    {it.slug ? <Link href={`/products/${it.slug}`} className="block py-1 hover:text-brand">{it.label}</Link> : <span className="block py-1 text-mute/60">{it.label} (준비중)</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
