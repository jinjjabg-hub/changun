/** 홈 화면 구성 (히어로 슬라이드, 인기·추천 상품 프리셋). 가격은 catalog.ts 에서 계산됩니다. */

export interface Preset {
  slug: string;
  title: string;
  sub: string;
  /** 상세 페이지에 미리 선택해 둘 옵션 */
  query?: { paper?: string; size?: string; side?: string; qty?: number; finishes?: string[] };
  tag?: "BEST" | "NEW";
}

export const heroSlides = [
  { id: 1, kicker: "BUSINESS CARD", title: "명함 100매,\n내일 받는 첫인상", sub: "스노우·아르떼·크라프트까지 용지별 즉시 견적", cta: "명함 주문하기", slug: "business-card", tone: { bg: "#0f5a43", fg: "#ffffff", accent: "#f2a93b" }, art: "card" as const },
  { id: 2, kicker: "CUSTOM STICKER", title: "내 로고 모양 그대로\n스티커로 자르다", sub: "원형·사각·도무송, 방수 소재까지", cta: "스티커 만들기", slug: "sticker", tone: { bg: "#f2a93b", fg: "#2b1a02", accent: "#0f5a43" }, art: "sticker" as const },
  { id: 3, kicker: "BANNER", title: "개업·행사 현수막\n크게, 선명하게", sub: "규격 선택 후 아일렛·로프 마감까지 한 번에", cta: "현수막 견적 보기", slug: "banner-cloth", tone: { bg: "#2a6f97", fg: "#ffffff", accent: "#f2a93b" }, art: "cloth" as const },
  { id: 4, kicker: "FLYER", title: "전단·리플렛\n대량일수록 더 저렴하게", sub: "A3부터 A6, 접지·오시·미싱 후가공", cta: "전단 주문하기", slug: "flyer", tone: { bg: "#e8793a", fg: "#ffffff", accent: "#fff3c4" }, art: "flyer" as const },
];

export const popular: Preset[] = [
  { slug: "business-card", title: "스노우지 명함", sub: "표준형 · 단면 · 200매", query: { qty: 200 }, tag: "BEST" },
  { slug: "sticker", title: "원형 스티커", sub: "아트지 · 50mm · 500개", query: { qty: 500 }, tag: "BEST" },
  { slug: "flyer", title: "A4 전단지", sub: "스노우 120g · 단면 · 1,000장", query: { paper: "snow120", size: "a4", qty: 1000 }, tag: "BEST" },
  { slug: "banner-cloth", title: "가로 3m 현수막", sub: "일반 원단 · 아일렛 4구", query: { size: "w300", qty: 1, finishes: ["eyelet4"] } },
  { slug: "x-banner", title: "X배너 60×160", sub: "PP 합지 · 기본 거치대", query: { size: "x60", qty: 1, finishes: ["stand-basic"] } },
  { slug: "business-card", title: "크라프트 명함", sub: "슬림형 · 양면 · 200매", query: { paper: "kraft250", size: "slim", side: "double", qty: 200 } },
  { slug: "sticker", title: "투명 PET 스티커", sub: "원형 70mm · 화이트 인쇄", query: { paper: "pet", size: "r70", qty: 200, finishes: ["white"] } },
  { slug: "flyer", title: "A5 전단지", sub: "스노우 120g · 양면 · 2,000장", query: { paper: "snow120", size: "a5", side: "double", qty: 2000 } },
];

export const recommended: Preset[] = [
  { slug: "business-card", title: "금박 명함", sub: "아르떼 230g · 금박", query: { paper: "arte230", size: "std", qty: 200, finishes: ["foil-gold"] }, tag: "NEW" },
  { slug: "flyer", title: "3단 접지 리플렛", sub: "스노우 150g · A4", query: { paper: "snow150", size: "a4", qty: 1000, finishes: ["fold3"] } },
  { slug: "sticker", title: "방수 유포지 스티커", sub: "직사각 90×60 · 1,000개", query: { paper: "yupo", size: "r90x60", qty: 1000 } },
  { slug: "x-banner", title: "롤업 배너 85×200", sub: "PP 합지 · 프리미엄 가방", query: { size: "roll85", qty: 1, finishes: ["bag"] } },
  { slug: "banner-cloth", title: "메쉬 현수막", sub: "가로 5m · 로프 마감", query: { paper: "mesh", size: "w500", qty: 1, finishes: ["rope"] } },
  { slug: "business-card", title: "미니 정사각 명함", sub: "60×60 · 모서리 귀도리", query: { size: "square", qty: 200, finishes: ["round"] } },
  { slug: "flyer", title: "쿠폰형 미싱 전단", sub: "A5 · 절취선", query: { paper: "snow120", size: "a5", qty: 1000, finishes: ["perforation"] } },
  { slug: "sticker", title: "홀로그램 박 스티커", sub: "아트지 · 사각 50", query: { paper: "art", size: "s50", qty: 500, finishes: ["holo"] }, tag: "NEW" },
];

export const quickServices = [
  { label: "명함", slug: "business-card" },
  { label: "스티커", slug: "sticker" },
  { label: "전단", slug: "flyer" },
  { label: "현수막", slug: "banner-cloth" },
  { label: "X배너", slug: "x-banner" },
  { label: "장바구니", href: "/cart" },
  { label: "전체 상품", href: "/products" },
];

export function presetHref(p: Preset) {
  const q = new URLSearchParams();
  const o = p.query ?? {};
  if (o.paper) q.set("paper", o.paper);
  if (o.size) q.set("size", o.size);
  if (o.side) q.set("side", o.side);
  if (o.qty) q.set("qty", String(o.qty));
  if (o.finishes?.length) q.set("finishes", o.finishes.join(","));
  const s = q.toString();
  return `/products/${p.slug}${s ? `?${s}` : ""}`;
}
