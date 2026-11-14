import { SHIPPING, type Finish, type Product, type Size } from "@/data/catalog";
import { withRo } from "./format";

export const CUSTOM_SIZE = "custom";

export interface DesignRow {
  /** 디자인 종류 id ("" = 선택 안 함) */
  type: string;
  qty: number;
  /** 추가 편집 id ("" = 선택 안 함) */
  edit: string;
  editQty: number;
}

export interface DesignSelection {
  front: DesignRow;
  back: DesignRow;
  extra: string;
  extraQty: number;
}

export interface Selection {
  paper: string;
  /** 규격 id 또는 CUSTOM_SIZE */
  size: string;
  /** size 가 CUSTOM_SIZE 일 때의 재단 크기 (mm) */
  custom?: { w: number; h: number } | null;
  side: string | null;
  qty: number;
  sets: number;
  finishes: string[];
  /** 디자인 의뢰 (null = 신청 안 함) */
  design?: DesignSelection | null;
}

export interface Availability {
  ok: boolean;
  reason?: string;
}

export interface PriceResult {
  /** 1건 기준 인쇄비 */
  print: number;
  finishLines: { id: string; name: string; price: number }[];
  /** 디자인 의뢰 비용 (건수와 무관하게 한 번만 더한다) */
  designLines: { id: string; name: string; price: number }[];
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
  const ids = paper?.sizes ?? p.sizes.map((s) => s.id);
  return p.customSize ? [...ids, CUSTOM_SIZE] : ids;
};

export const allowedSides = (p: Product, paperId: string) => {
  const paper = p.papers.find((x) => x.id === paperId);
  return (p.sides ?? [])
    .filter((s) => (!paper?.sides || paper.sides.includes(s.id)) && (!s.papers || s.papers.includes(paperId)))
    .map((s) => s.id);
};

/** 현재 선택의 실제 사이즈 (직접 입력이면 입력값으로 만든 가상 규격) */
export function sizeOf(p: Product, sel: Selection): Size {
  if (sel.size === CUSTOM_SIZE && p.customSize && sel.custom) {
    const base = p.sizes[0];
    const { w, h } = sel.custom;
    // 기준 규격의 면적당 단가에 비례 + 비규격 재단 할증. 가장 작은 규격 가격 밑으로는 내려가지 않는다.
    const floor = Math.min(...p.sizes.map((x) => x.factor));
    const factor = Math.max(floor, ((w * h) / (base.w * base.h)) * base.factor) * p.customSize.surcharge;
    return { id: CUSTOM_SIZE, name: `직접 입력 ${w}×${h}mm`, w, h, factor };
  }
  return p.sizes.find((x) => x.id === sel.size) ?? p.sizes[0];
}

/** 양면 인쇄 여부 */
export const isDouble = (p: Product, sel: Selection) => p.sides?.find((s) => s.id === sel.side)?.faces === 2;

export const emptyDesign = (p: Product): DesignSelection => ({
  front: { type: p.design?.types[0]?.id ?? "", qty: 1, edit: "", editQty: 0 },
  back: { type: "", qty: 0, edit: "", editQty: 0 },
  extra: "",
  extraQty: 0,
});

export function finishAvailability(p: Product, sel: Selection, f: Finish): Availability {
  const paper = p.papers.find((x) => x.id === sel.paper);
  if (paper?.finishes && !paper.finishes.includes(f.id)) {
    return { ok: false, reason: `${paper.name}에서는 선택할 수 없어요` };
  }
  if (f.sizes && !f.sizes.includes(sel.size)) {
    const size = p.sizes.find((s) => s.id === sel.size);
    return { ok: false, reason: `${sel.size === CUSTOM_SIZE ? "직접 입력 사이즈" : (size?.name ?? "이 사이즈")}에서는 선택할 수 없어요` };
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
  if (next.size === CUSTOM_SIZE && p.customSize) {
    const c = p.customSize;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || lo));
    next.custom = { w: clamp(next.custom?.w ?? p.sizes[0].w, c.minW, c.maxW), h: clamp(next.custom?.h ?? p.sizes[0].h, c.minH, c.maxH) };
  } else {
    next.custom = null;
  }
  if (!sizes.includes(next.size)) {
    const before = p.sizes.find((s) => s.id === next.size)?.name;
    // 가장 가까운(면적 기준) 사이즈로 보정
    const cur = p.sizes.find((s) => s.id === next.size);
    const candidates = p.sizes.filter((s) => sizes.includes(s.id));
    next.custom = null;
    const pick = cur
      ? candidates.reduce((a, b) => (Math.abs(b.factor - cur.factor) < Math.abs(a.factor - cur.factor) ? b : a))
      : candidates[0];
    next.size = pick.id;
    if (before) notices.push(`선택한 용지에서는 ‘${before}’ 사이즈가 불가해 ${withRo(`‘${pick.name}’`)} 바뀌었어요`);
  }

  if (p.sides) {
    const sides = allowedSides(p, next.paper);
    if (!next.side || !sides.includes(next.side)) {
      let pick = p.sides.find((s) => sides.includes(s.id)) ?? p.sides[0];
      // 같은 면 수(단면/양면)를 유지하는 쪽을 우선한다
      const prev = p.sides.find((s) => s.id === next.side);
      const same = p.sides.find((s) => sides.includes(s.id) && (s.faces ?? 1) === (prev?.faces ?? 1));
      if (same) pick = same;
      if (prev) notices.push(`선택한 ${p.paperLabel}에서는 ‘${prev.name}’ 인쇄가 불가해 ${withRo(`‘${pick.name}’`)} 바뀌었어요`);
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

  // 디자인 의뢰: 없는 항목·범위를 벗어난 건수를 정리하고, 단면이면 후면을 비운다
  if (p.design && next.design) {
    const d = next.design;
    const n = (v: number, lo: number) => Math.min(20, Math.max(lo, Math.round(Number(v)) || 0));
    const row = (r: DesignRow | undefined, on: boolean): DesignRow => {
      const type = on && r && p.design!.types.some((t) => t.id === r.type) ? r.type : "";
      const edit = on && r && p.design!.edits.some((t) => t.id === r.edit) ? r.edit : "";
      return { type, qty: type ? n(r!.qty, 1) : 0, edit, editQty: edit ? n(r!.editQty, 1) : 0 };
    };
    const extra = p.design.extras.some((t) => t.id === d.extra) ? d.extra : "";
    next.design = { front: row(d.front, true), back: row(d.back, isDouble(p, next)), extra, extraQty: extra ? n(d.extraQty, 1) : 0 };
  } else {
    next.design = null;
  }
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
  const size = sizeOf(p, sel);
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

  const designLines: PriceResult["designLines"] = [];
  if (p.design && sel.design) {
    const d = sel.design;
    const add = (key: string, label: string, list: { id: string; name: string; price: number }[], id: string, qty: number) => {
      const o = list.find((x) => x.id === id);
      if (o && qty > 0) designLines.push({ id: key, name: `${label} ${o.name} × ${qty}건`, price: o.price * qty });
    };
    add("front", "디자인 전면", p.design.types, d.front.type, d.front.qty);
    add("front-edit", "전면 추가편집", p.design.edits, d.front.edit, d.front.editQty);
    add("back", "디자인 후면", p.design.types, d.back.type, d.back.qty);
    add("back-edit", "후면 추가편집", p.design.edits, d.back.edit, d.back.editQty);
    add("extra", "디자인 옵션", p.design.extras, d.extra, d.extraQty);
  }
  const designTotal = designLines.reduce((s, l) => s + l.price, 0);
  const perSet = print + finishLines.reduce((s, l) => s + l.price, 0);
  const finishLead = Math.max(0, ...sel.finishes.map((id) => p.finishes.find((x) => x.id === id)?.leadDays ?? 0));
  const qtyLead = (p.leadByQty ?? []).reduce((m, t) => (sel.qty >= t.min ? Math.max(m, t.add) : m), 0);

  return {
    print,
    finishLines,
    designLines,
    perSet,
    total: perSet * sel.sets + designTotal,
    perUnit: perSet / sel.qty,
    tierRate: rate,
    leadDays: p.baseLead + (paper.leadDays ?? 0) + finishLead + qtyLead + (designLines.length ? (p.design?.leadDays ?? 0) : 0),
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
  const size = sizeOf(p, sel);
  const side = p.sides?.find((x) => x.id === sel.side);
  const lines = [
    `${p.paperLabel}: ${paper?.name ?? "-"}`,
    `사이즈: ${size.name}${side ? ` · ${side.name}` : ""}`,
    `수량: ${sel.qty.toLocaleString("ko-KR")}${p.unit}${p.allowSets && sel.sets > 1 ? ` × ${sel.sets}종` : ""}`,
  ];
  const fin = sel.finishes.map((id) => p.finishes.find((x) => x.id === id)?.name).filter(Boolean);
  lines.push(`후가공: ${fin.length ? fin.join(", ") : "없음"}`);
  const design = calculate(p, sel).designLines;
  if (design.length) lines.push(`디자인 의뢰: ${design.map((d) => d.name.replace(/^디자인 /, "")).join(", ")}`);
  return lines;
}

export const vatOf = (supply: number) => Math.round(supply * 0.1);
export const shippingFor = (supply: number) => (supply === 0 || supply >= SHIPPING.freeOver ? 0 : SHIPPING.fee);
