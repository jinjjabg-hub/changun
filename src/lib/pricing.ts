import { SHIPPING, type Finish, type Product } from "@/data/catalog";
import { withRo } from "./format";

export interface Selection {
  paper: string;
  size: string;
  side: string | null;
  qty: number;
  sets: number;
  finishes: string[];
}

export interface Availability {
  ok: boolean;
  reason?: string;
}

export interface PriceResult {
  /** 1건 기준 인쇄비 */
  print: number;
  finishLines: { id: string; name: string; price: number }[];
  /** 1건 기준 합계 */
  perSet: number;
  /** 건수 반영 총액 (공급가, VAT 별도) */
  total: number;
  /** 매/장/개 당 평균 단가 */
  perUnit: number;
  tierRate: number;
  leadDays: number;
  fromTable: boolean;
}

const round100 = (n: number) => Math.round(n / 100) * 100;
const round10 = (n: number) => Math.round(n / 10) * 10;

export function defaultSelection(p: Product): Selection {
  return normalize(p, {
    paper: p.defaults?.paper ?? p.papers[0].id,
    size: p.defaults?.size ?? p.sizes[0].id,
    side: p.sides ? p.sides[0].id : null,
    qty: p.defaults?.qty ?? p.quantities[Math.min(2, p.quantities.length - 1)],
    sets: 1,
    finishes: [],
  }).selection;
}

/* ─────────────── 의존 관계 ─────────────── */

export const allowedSizes = (p: Product, paperId: string) => {
  const paper = p.papers.find((x) => x.id === paperId);
  return paper?.sizes ?? p.sizes.map((s) => s.id);
};

export const allowedSides = (p: Product, paperId: string) => {
  const paper = p.papers.find((x) => x.id === paperId);
  return paper?.sides ?? (p.sides ? p.sides.map((s) => s.id) : []);
};

export function finishAvailability(p: Product, sel: Selection, f: Finish): Availability {
  const paper = p.papers.find((x) => x.id === sel.paper);
  if (paper?.finishes && !paper.finishes.includes(f.id)) {
    return { ok: false, reason: `${paper.name}에서는 선택할 수 없어요` };
  }
  if (f.sizes && !f.sizes.includes(sel.size)) {
    const size = p.sizes.find((s) => s.id === sel.size);
    return { ok: false, reason: `${size?.name ?? "이 사이즈"}에서는 선택할 수 없어요` };
  }
  if (f.minQty && sel.qty < f.minQty) {
    return { ok: false, reason: `${f.minQty.toLocaleString()}${p.unit} 이상부터 가능해요` };
  }
  if (f.maxQty && sel.qty > f.maxQty) {
    return { ok: false, reason: `${f.maxQty.toLocaleString()}${p.unit} 이하에서만 가능해요` };
  }
  return { ok: true };
}

/** 새로 켠 후가공과 충돌하는 기존 선택을 제거한다. 제거된 id 목록을 함께 돌려준다. */
export function toggleFinish(p: Product, sel: Selection, id: string) {
  const f = p.finishes.find((x) => x.id === id);
  if (!f) return { selection: sel, removed: [] as string[] };
  if (sel.finishes.includes(id)) {
    return { selection: { ...sel, finishes: sel.finishes.filter((x) => x !== id) }, removed: [] };
  }
  const removed = sel.finishes.filter((otherId) => {
    const o = p.finishes.find((x) => x.id === otherId);
    if (!o) return false;
    const sameGroup = f.group && o.group === f.group;
    return sameGroup || f.excludes?.includes(o.id) || o.excludes?.includes(f.id);
  });
  return {
    selection: { ...sel, finishes: [...sel.finishes.filter((x) => !removed.includes(x)), id] },
    removed,
  };
}

/**
 * 어떤 옵션을 바꾼 뒤 선택 상태를 유효하게 보정한다.
 * 보정이 일어나면 사용자에게 보여줄 안내 문구를 돌려준다.
 */
export function normalize(p: Product, sel: Selection): { selection: Selection; notices: string[] } {
  const notices: string[] = [];
  const next: Selection = { ...sel, finishes: [...sel.finishes] };

  if (!p.papers.some((x) => x.id === next.paper)) next.paper = p.papers[0].id;

  const sizes = allowedSizes(p, next.paper);
  if (!sizes.includes(next.size)) {
    const before = p.sizes.find((s) => s.id === next.size)?.name;
    // 가장 가까운(면적 기준) 사이즈로 보정
    const cur = p.sizes.find((s) => s.id === next.size);
    const candidates = p.sizes.filter((s) => sizes.includes(s.id));
    const pick = cur
      ? candidates.reduce((a, b) => (Math.abs(b.factor - cur.factor) < Math.abs(a.factor - cur.factor) ? b : a))
      : candidates[0];
    next.size = pick.id;
    if (before) notices.push(`선택한 용지에서는 ‘${before}’ 사이즈가 불가해 ${withRo(`‘${pick.name}’`)} 바뀌었어요`);
  }

  if (p.sides) {
    const sides = allowedSides(p, next.paper);
    if (!next.side || !sides.includes(next.side)) {
      const pick = p.sides.find((s) => sides.includes(s.id)) ?? p.sides[0];
      if (next.side) notices.push(`선택한 소재에서는 ‘${p.sides.find((s) => s.id === next.side)?.name}’이 불가해 ${withRo(`‘${pick.name}’`)} 바뀌었어요`);
      next.side = pick.id;
    }
  } else {
    next.side = null;
  }

  if (!p.quantities.includes(next.qty)) {
    next.qty = p.quantities.reduce((a, b) => (Math.abs(b - next.qty) < Math.abs(a - next.qty) ? b : a));
  }
  next.sets = p.allowSets ? Math.min(Math.max(1, Math.round(next.sets) || 1), 10) : 1;

  const kept: string[] = [];
  for (const id of next.finishes) {
    const f = p.finishes.find((x) => x.id === id);
    if (!f) continue;
    const av = finishAvailability(p, next, f);
    if (!av.ok) {
      notices.push(`‘${f.name}’ 후가공이 해제되었어요 (${av.reason})`);
      continue;
    }
    const clash = kept.find((k) => {
      const o = p.finishes.find((x) => x.id === k)!;
      return (f.group && o.group === f.group) || f.excludes?.includes(o.id) || o.excludes?.includes(f.id);
    });
    if (clash) continue;
    kept.push(id);
  }
  next.finishes = kept;
  return { selection: next, notices };
}

/* ─────────────── 가격 · 출고일 ─────────────── */

export function tierRate(p: Product, qty: number) {
  let rate = p.tiers[0]?.rate ?? 1;
  for (const t of p.tiers) if (qty >= t.min) rate = t.rate;
  return rate;
}

export function calculate(p: Product, sel: Selection): PriceResult {
  const paper = p.papers.find((x) => x.id === sel.paper) ?? p.papers[0];
  const size = p.sizes.find((x) => x.id === sel.size) ?? p.sizes[0];
  const side = p.sides?.find((x) => x.id === sel.side);
  const rate = tierRate(p, sel.qty);

  const tableKey = `${paper.id}:${size.id}:${side?.id ?? "-"}`;
  const tabled = p.priceTable?.[tableKey]?.[sel.qty];
  const rule =
    p.baseUnit * paper.factor * size.factor * (side?.factor ?? 1) * sel.qty * rate;
  const print = (tabled ?? Math.max(p.minPrint, round100(rule))) + (tabled === undefined ? p.setupFee : 0);

  const finishLines = sel.finishes.flatMap((id) => {
    const f = p.finishes.find((x) => x.id === id);
    if (!f) return [];
    const price =
      f.mode === "flat" ? f.price : f.mode === "perUnit" ? f.price * sel.qty : round10((print * f.price) / 100);
    return [{ id, name: f.name, price }];
  });

  const perSet = print + finishLines.reduce((s, l) => s + l.price, 0);
  const finishLead = Math.max(0, ...sel.finishes.map((id) => p.finishes.find((x) => x.id === id)?.leadDays ?? 0));
  const qtyLead = (p.leadByQty ?? []).reduce((m, t) => (sel.qty >= t.min ? Math.max(m, t.add) : m), 0);

  return {
    print,
    finishLines,
    perSet,
    total: perSet * sel.sets,
    perUnit: perSet / sel.qty,
    tierRate: rate,
    leadDays: p.baseLead + (paper.leadDays ?? 0) + finishLead + qtyLead,
    fromTable: tabled !== undefined,
  };
}

/** 영업일(주말 제외) 기준 출고 예정일. 마감 시각 이후 접수는 다음 영업일부터 센다. */
export function shipDate(now: Date, leadDays: number) {
  const d = new Date(now);
  const isBiz = (x: Date) => x.getDay() !== 0 && x.getDay() !== 6;
  // 접수 기준일 확정
  if (now.getHours() >= SHIPPING.cutoffHour || !isBiz(d)) {
    do d.setDate(d.getDate() + 1);
    while (!isBiz(d));
  }
  let left = leadDays;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isBiz(d)) left--;
  }
  return d;
}

export function describeSelection(p: Product, sel: Selection): string[] {
  const paper = p.papers.find((x) => x.id === sel.paper);
  const size = p.sizes.find((x) => x.id === sel.size);
  const side = p.sides?.find((x) => x.id === sel.side);
  const lines = [
    `${p.paperLabel}: ${paper?.name ?? "-"}`,
    `사이즈: ${size?.name ?? "-"}${side ? ` · ${side.name}` : ""}`,
    `수량: ${sel.qty.toLocaleString("ko-KR")}${p.unit}${p.allowSets && sel.sets > 1 ? ` × ${sel.sets}종` : ""}`,
  ];
  const fin = sel.finishes.map((id) => p.finishes.find((x) => x.id === id)?.name).filter(Boolean);
  lines.push(`후가공: ${fin.length ? fin.join(", ") : "없음"}`);
  return lines;
}

export const vatOf = (supply: number) => Math.round(supply * 0.1);
export const shippingFor = (supply: number) => (supply === 0 || supply >= SHIPPING.freeOver ? 0 : SHIPPING.fee);
