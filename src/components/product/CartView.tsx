"use client";

import { useNow } from "@/hooks/useNow";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getProduct, SHIPPING } from "@/data/catalog";
import { removeFromCart, selectionHref, useCartLines } from "@/lib/cart";
import { shippingFor, shipDate, vatOf } from "@/lib/pricing";
import { formatShipDate, won } from "@/lib/format";
import { ProductArt } from "@/components/site/ProductArt";
import { SampleBadge } from "@/components/site/SampleBadge";

export function CartView() {
  const { lines, ready } = useCartLines();
  const now = useNow();

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-24 text-center">
        <p className="text-lg font-bold">장바구니가 비어 있어요</p>
        <p className="mt-1 text-sm text-mute">상품 옵션을 선택하고 장바구니에 담아 보세요.</p>
        <Link href="/products" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 font-bold text-white hover:bg-brand-dark">상품 보러가기</Link>
      </div>
    );
  }

  const supply = lines.reduce((s, l) => s + l.total, 0);
  const vat = vatOf(supply);
  const shipping = shippingFor(supply);
  const lead = Math.max(...lines.map((l) => l.leadDays));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="space-y-4">
        {lines.map((l) => {
          const p = getProduct(l.slug)!;
          return (
            <li key={l.id} className="flex gap-4 rounded-2xl border border-line p-4">
              {l.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element -- localStorage에 저장된 data URL 미리보기
                <img src={l.artwork.thumb} alt="올린 그림 미리보기" className="hidden size-28 shrink-0 rounded-xl bg-surface object-contain sm:block" />
              ) : (
                <ProductArt kind={p.art} tone={p.tone} className="hidden size-28 shrink-0 rounded-xl sm:block" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-extrabold">{l.productName}</p>
                  <button type="button" aria-label={`${l.productName} 삭제`} onClick={() => removeFromCart(l.id)} className="rounded p-1 text-mute hover:text-danger">
                    <Trash2 size={18} />
                  </button>
                </div>
                <ul className="mt-1 space-y-0.5 text-[13px] text-mute">{l.lines.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-xs text-mute">
                    {now ? `${formatShipDate(shipDate(now, l.leadDays))} 출고 예정` : ""}
                    <Link href={selectionHref(l.slug, l.selection)} className="ml-3 text-brand underline">옵션 수정</Link>
                  </p>
                  <p className="text-xl font-extrabold text-brand-dark">{won(l.total)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="rounded-2xl border-2 border-brand p-5">
          <div className="mb-3 flex items-center justify-between"><p className="font-extrabold">주문 금액</p><SampleBadge /></div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-mute">상품 금액 ({lines.length}건)</dt><dd>{won(supply)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">부가세(10%)</dt><dd>{won(vat)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">배송비</dt><dd>{shipping === 0 ? "무료" : won(shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <span className="font-bold">합계</span>
            <span className="text-2xl font-extrabold text-brand-dark">{won(supply + vat + shipping)}</span>
          </div>
          <p className="mt-1 text-xs text-mute">{won(SHIPPING.freeOver)} 이상 무료 배송 · 가장 늦은 상품 기준 {now ? `${formatShipDate(shipDate(now, lead))} 출고` : ""}</p>
          <Link href="/checkout" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">주문서 작성하기</Link>
          <Link href="/products" className="mt-2 block text-center text-sm text-mute underline">쇼핑 계속하기</Link>
        </div>
      </aside>
    </div>
  );
}
