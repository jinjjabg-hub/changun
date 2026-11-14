"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { heroSlides } from "@/data/home";
import { ProductArt } from "./ProductArt";

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const n = heroSlides.length;

  useEffect(() => {
    if (!playing || hover) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [playing, hover, n]);

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="주요 이벤트"
      className="relative overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative h-[440px] sm:h-[480px]">
        {heroSlides.map((s, idx) => (
          <div
            key={s.id}
            aria-hidden={idx !== i}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ background: s.tone.bg, color: s.tone.fg }}
          >
            <div className="mx-auto grid h-full max-w-[1180px] items-center gap-6 px-6 sm:px-14 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold tracking-[0.2em] opacity-70">{s.kicker}</p>
                <h2 className="whitespace-pre-line text-[32px] font-extrabold leading-[1.2] sm:text-[44px]">{s.title}</h2>
                <p className="mt-4 text-base opacity-85">{s.sub}</p>
                <Link
                  href={`/products/${s.slug}`}
                  tabIndex={idx === i ? 0 : -1}
                  className="mt-7 inline-flex h-12 items-center rounded-full px-7 text-[15px] font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: s.tone.fg, color: s.tone.bg }}
                >
                  {s.cta} →
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="mx-auto aspect-[4/3] w-[460px] max-w-full overflow-hidden rounded-[28px] shadow-2xl ring-8 ring-white/15">
                  <ProductArt kind={s.art} tone={{ bg: "#ffffff", fg: s.tone.bg, accent: s.tone.accent }} className="size-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-14 mx-auto flex max-w-[1180px] items-center justify-between px-6 sm:px-14">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <span className="tabular-nums">{i + 1} / {n}</span>
          <button type="button" aria-label={playing ? "자동 재생 멈춤" : "자동 재생"} onClick={() => setPlaying((v) => !v)}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <div className="flex gap-1.5">
            {heroSlides.map((s, idx) => (
              <button key={s.id} type="button" aria-label={`${idx + 1}번 슬라이드`} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" aria-label="이전 슬라이드" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="다음 슬라이드" onClick={() => go(1)} className="grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
