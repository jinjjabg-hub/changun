"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useOrder } from "@/lib/cart";
import { formatDateTime, won } from "@/lib/format";
import { SampleBadge } from "@/components/site/SampleBadge";

export function OrderComplete() {
  const no = useSearchParams().get("no");
  const { order, ready } = useOrder(no);

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  if (!order) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">주문 내역을 찾을 수 없어요</p>
        <p className="mt-1 text-sm text-mute">주문 정보는 제출한 브라우저에만 저장돼요.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 font-bold text-white">홈으로</Link>
      </div>
    );
  }
  const c = order.customer;
  return (
    <div className="mx-auto max-w-[760px]">
      <div className="text-center">
        <CheckCircle2 size={56} className="mx-auto text-brand" />
        <h1 className="mt-3 text-[28px] font-extrabold">주문서가 접수되었어요</h1>
        <p className="mt-1 text-mute">시연용 데모라 결제·제작은 진행되지 않습니다.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-line p-6">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[110px_1fr]">
          <dt className="text-mute">주문번호</dt><dd className="font-extrabold text-brand-dark">{order.no}</dd>
          <dt className="text-mute">접수 시각</dt><dd>{formatDateTime(order.createdAt)}</dd>
          <dt className="text-mute">주문자</dt><dd>{c.name} · {c.phone}</dd>
          <dt className="text-mute">수령</dt><dd>{c.delivery === "pickup" ? "방문 수령" : `택배 · (${c.zip}) ${c.address} ${c.addressDetail}`}</dd>
          <dt className="text-mute">파일</dt><dd>{c.fileMode === "design-request" ? "디자인 의뢰" : "나중에 업로드"}</dd>
          {c.memo && (<><dt className="text-mute">요청사항</dt><dd>{c.memo}</dd></>)}
        </dl>
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-sm">
              <span><b>{it.productName}</b><span className="block text-xs text-mute">{it.lines.join(" · ")}</span></span>
              <span className="shrink-0 font-semibold">{won(it.total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-end justify-between border-t border-line pt-4">
          <span className="flex items-center gap-2 font-bold">최종 금액 <SampleBadge /></span>
          <span className="text-2xl font-extrabold text-brand-dark">{won(order.grand)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-mute">상품 {won(order.supply)} + 부가세 {won(order.vat)} + 배송비 {order.shipping ? won(order.shipping) : "무료"}</p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="inline-flex h-12 items-center rounded-xl border-2 border-brand px-7 font-bold text-brand hover:bg-brand-soft">홈으로</Link>
        <Link href="/products" className="inline-flex h-12 items-center rounded-xl bg-brand px-7 font-bold text-white hover:bg-brand-dark">상품 더 보기</Link>
      </div>
    </div>
  );
}
