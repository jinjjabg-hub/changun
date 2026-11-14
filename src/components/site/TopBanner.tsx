"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const MESSAGES = [
  { text: "신규 가입 없이 바로 견적 확인 · 옵션 선택하면 가격과 출고일이 즉시 계산돼요", href: "/products" },
  { text: "명함 100매 · 스티커 100개부터 소량 제작 OK", href: "/products/business-card" },
  { text: "※ 본 사이트는 시연용 데모이며 표시된 모든 가격은 샘플입니다 (결제 기능 없음)", href: "/products" },
];

export function TopBanner() {
  const [i, setI] = useState(0);
  const [closed, setClosed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || closed) return;
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 5000);
    return () => clearInterval(t);
  }, [paused, closed]);

  if (closed) return null;
  const go = (d: number) => setI((v) => (v + d + MESSAGES.length) % MESSAGES.length);

  return (
    <div
      className="relative bg-brand-dark text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex h-10 max-w-[1180px] items-center justify-center gap-3 px-10 text-[13px]">
        <button type="button" onClick={() => go(-1)} aria-label="이전 안내" className="hidden rounded p-1 text-white/70 hover:text-white sm:block">
          <ChevronLeft size={16} />
        </button>
        <Link key={i} href={MESSAGES[i].href} className="cw-fade-up truncate font-medium hover:underline">
          {MESSAGES[i].text}
        </Link>
        <span className="hidden text-xs tabular-nums text-white/60 sm:block">
          {i + 1} / {MESSAGES.length}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="다음 안내" className="hidden rounded p-1 text-white/70 hover:text-white sm:block">
          <ChevronRight size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="상단 배너 닫기"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/70 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
