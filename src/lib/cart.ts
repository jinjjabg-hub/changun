"use client";

import { useSyncExternalStore } from "react";
import { getProduct } from "@/data/catalog";
import { calculate, describeSelection, normalize, type Selection } from "./pricing";

const CART_KEY = "changun.cart.v1";
const ORDERS_KEY = "changun.orders.v1";
const EVT = "changun:store";

export interface CartEntry {
  id: string;
  slug: string;
  selection: Selection;
  addedAt: string;
  /** 올린 그림 (작은 미리보기와 설명만 저장, 원본은 저장하지 않음) */
  artwork?: { name: string; thumb: string; label: string };
}

export interface CartLine extends CartEntry {
  productName: string;
  lines: string[];
  total: number;
  leadDays: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  zip: string;
  address: string;
  addressDetail: string;
  memo: string;
  delivery: "parcel" | "pickup";
  fileMode: "upload-later" | "design-request";
}

export interface Order {
  no: string;
  createdAt: string;
  customer: OrderCustomer;
  items: { productName: string; slug: string; lines: string[]; total: number; leadDays: number }[];
  supply: number;
  vat: number;
  shipping: number;
  grand: number;
}

/* ── 저장소 헬퍼 (SSR / 차단된 storage 에서도 죽지 않게) ── */

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 시연용: 저장 실패는 무시 */
  }
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

/* useSyncExternalStore 는 같은 값이면 같은 참조를 돌려줘야 한다 → raw 문자열 기준으로 캐시 */
function makeStore<T>(key: string, fallback: T[]) {
  let raw: string | null = null;
  let parsed: T[] = fallback;
  return {
    snapshot(): T[] {
      const now = read(key);
      if (now !== raw) {
        raw = now;
        try {
          const v = JSON.parse(now);
          parsed = Array.isArray(v) ? (v as T[]) : fallback;
        } catch {
          parsed = fallback;
        }
      }
      return parsed;
    },
    server: () => fallback,
  };
}

const EMPTY_CART: CartEntry[] = [];
const EMPTY_ORDERS: Order[] = [];
const cartStore = makeStore<CartEntry>(CART_KEY, EMPTY_CART);
const orderStore = makeStore<Order>(ORDERS_KEY, EMPTY_ORDERS);

export const readCart = () => cartStore.snapshot();

/* ── 장바구니 ── */

/** 선택값만 저장하고 가격은 매번 데이터 파일로 다시 계산한다 (가격표를 바꿔도 장바구니가 따라감). */
function priceEntry(e: CartEntry): CartLine | null {
  const p = getProduct(e.slug);
  if (!p) return null;
  const { selection } = normalize(p, e.selection);
  const r = calculate(p, selection);
  return {
    ...e,
    selection,
    productName: p.name,
    lines: [
      ...describeSelection(p, selection),
      ...(e.artwork?.label ? [e.artwork.label] : []),
    ],
    total: r.total,
    leadDays: r.leadDays,
  };
}

export function useCartLines(): { lines: CartLine[]; ready: boolean } {
  const entries = useSyncExternalStore(subscribe, cartStore.snapshot, cartStore.server);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { lines: entries.map(priceEntry).filter((x): x is CartLine => x !== null), ready };
}

export function useCartCount() {
  return useSyncExternalStore(
    subscribe,
    () => cartStore.snapshot().length,
    () => 0,
  );
}

export function addToCart(slug: string, selection: Selection, artwork?: CartEntry["artwork"]) {
  const entry: CartEntry = {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    slug,
    selection,
    addedAt: new Date().toISOString(),
    ...(artwork ? { artwork } : {}),
  };
  write(CART_KEY, JSON.stringify([...cartStore.snapshot(), entry]));
  return entry.id;
}

export function removeFromCart(id: string) {
  write(CART_KEY, JSON.stringify(cartStore.snapshot().filter((e) => e.id !== id)));
}

export function clearCart() {
  write(CART_KEY, "[]");
}

/* ── 주문 ── */

export function useOrder(no: string | null): { order: Order | null; ready: boolean } {
  const orders = useSyncExternalStore(subscribe, orderStore.snapshot, orderStore.server);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { order: no ? (orders.find((o) => o.no === no) ?? null) : null, ready };
}

export function placeOrder(
  customer: OrderCustomer,
  lines: CartLine[],
  totals: { supply: number; vat: number; shipping: number; grand: number },
): Order {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  const no = `CW${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(Math.floor(Math.random() * 10000), 4)}`;
  const order: Order = {
    no,
    createdAt: d.toISOString(),
    customer,
    items: lines.map((l) => ({
      productName: l.productName,
      slug: l.slug,
      lines: l.lines,
      total: l.total,
      leadDays: l.leadDays,
    })),
    ...totals,
  };
  write(ORDERS_KEY, JSON.stringify([order, ...orderStore.snapshot()].slice(0, 20)));
  clearCart();
  return order;
}

export function selectionHref(slug: string, s: Selection) {
  const q = new URLSearchParams({ paper: s.paper, size: s.size, qty: String(s.qty) });
  if (s.side) q.set("side", s.side);
  if (s.custom) q.set("custom", `${s.custom.w}x${s.custom.h}`);
  if (s.finishes.length) q.set("finishes", s.finishes.join(","));
  return `/products/${slug}?${q.toString()}`;
}
