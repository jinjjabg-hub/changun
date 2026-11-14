"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { placeOrder, useCartLines, type OrderCustomer } from "@/lib/cart";
import { shippingFor, vatOf } from "@/lib/pricing";
import { won } from "@/lib/format";
import { SampleBadge } from "@/components/site/SampleBadge";
import { cn } from "@/lib/utils";

const field = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 text-sm outline-none focus:border-brand";

function Row({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready } = useCartLines();
  const [c, setC] = useState<OrderCustomer>({
    name: "", phone: "", email: "", zip: "", address: "", addressDetail: "", memo: "",
    delivery: "parcel", fileMode: "upload-later",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-24 text-center">
        <p className="text-lg font-bold">주문할 상품이 없어요</p>
        <Link href="/products" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 font-bold text-white">상품 보러가기</Link>
      </div>
    );
  }

  const supply = lines.reduce((s, l) => s + l.total, 0);
  const vat = vatOf(supply);
  const shipping = c.delivery === "pickup" ? 0 : shippingFor(supply);
  const grand = supply + vat + shipping;
  const set = <K extends keyof OrderCustomer>(k: K, v: OrderCustomer[K]) => setC((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (c.name.trim().length < 2) e.name = "이름을 2자 이상 입력해 주세요";
    if (!/^01[016789]-\d{3,4}-\d{4}$/.test(c.phone)) e.phone = "휴대폰 번호를 확인해 주세요 (예: 010-1234-5678)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = "이메일 형식을 확인해 주세요";
    if (c.delivery === "parcel") {
      if (!/^\d{5}$/.test(c.zip)) e.zip = "우편번호 5자리를 입력해 주세요";
      if (c.address.trim().length < 5) e.address = "주소를 입력해 주세요";
    }
    if (!agree) e.agree = "시연용 주문 안내에 동의해 주세요";
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector<HTMLElement>("[role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const order = placeOrder(c, lines, { supply, vat, shipping, grand });
    router.push(`/order-complete?no=${order.no}`);
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-extrabold">1. 주문자 정보</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="이름" required error={errors.name}><input className={field} value={c.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></Row>
            <Row label="휴대폰" required error={errors.phone}><input className={field} inputMode="numeric" value={c.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} placeholder="010-0000-0000" autoComplete="tel" /></Row>
            <div className="sm:col-span-2"><Row label="이메일" required error={errors.email}><input className={field} type="email" value={c.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Row></div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">2. 수령 방법</h2>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {([["parcel", "택배 배송", `${won(3500)} · ${won(50000)} 이상 무료`], ["pickup", "방문 수령", "무료 · 출고 후 알림톡 안내"]] as const).map(([v, t, d]) => (
              <button key={v} type="button" aria-pressed={c.delivery === v} onClick={() => set("delivery", v)} className={cn("rounded-xl border-2 p-3.5 text-left", c.delivery === v ? "border-brand bg-brand-soft" : "border-line")}>
                <span className="block font-bold">{t}</span><span className="text-xs text-mute">{d}</span>
              </button>
            ))}
          </div>
          {c.delivery === "parcel" && (
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <Row label="우편번호" required error={errors.zip}><input className={field} inputMode="numeric" maxLength={5} value={c.zip} onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" /></Row>
              <Row label="주소" required error={errors.address}><input className={field} value={c.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" /></Row>
              <div className="sm:col-span-2"><Row label="상세 주소"><input className={field} value={c.addressDetail} onChange={(e) => set("addressDetail", e.target.value)} /></Row></div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">3. 파일 접수 · 요청사항</h2>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {([["upload-later", "파일은 나중에 올릴게요", "주문 후 메일/업로드로 전달"], ["design-request", "디자인을 맡길게요", "담당자가 연락드려요 (별도 디자인비)"]] as const).map(([v, t, d]) => (
              <button key={v} type="button" aria-pressed={c.fileMode === v} onClick={() => set("fileMode", v)} className={cn("rounded-xl border-2 p-3.5 text-left", c.fileMode === v ? "border-brand bg-brand-soft" : "border-line")}>
                <span className="block font-bold">{t}</span><span className="text-xs text-mute">{d}</span>
              </button>
            ))}
          </div>
          <Row label="요청사항"><textarea className={cn(field, "h-24 resize-none py-2")} value={c.memo} onChange={(e) => set("memo", e.target.value)} placeholder="제작·배송 관련 요청을 적어 주세요" /></Row>
        </section>

        <div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 accent-[#0f5a43]" />
            <span>이 사이트는 <b>시연용 데모</b>이며 결제가 진행되지 않고 실제 제작·배송이 이루어지지 않음을 확인했어요. 입력한 정보는 이 브라우저에만 저장돼요.</span>
          </label>
          {errors.agree && <p role="alert" className="mt-1 text-xs text-danger">{errors.agree}</p>}
        </div>
      </div>

      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="rounded-2xl border-2 border-brand p-5">
          <div className="mb-3 flex items-center justify-between"><p className="font-extrabold">주문 상품 {lines.length}건</p><SampleBadge /></div>
          <ul className="max-h-60 space-y-3 overflow-y-auto border-b border-line pb-4 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span><b>{l.productName}</b><span className="block text-xs text-mute">{l.lines.slice(1, 3).join(" · ")}</span></span>
                <span className="shrink-0 font-semibold">{won(l.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-mute">상품 금액</dt><dd>{won(supply)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">부가세(10%)</dt><dd>{won(vat)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">배송비</dt><dd>{shipping === 0 ? "무료" : won(shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <span className="font-bold">최종 금액</span><span className="text-2xl font-extrabold text-brand-dark">{won(grand)}</span>
          </div>
          <button type="submit" className="mt-5 h-12 w-full rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">주문서 제출하기</button>
          <p className="mt-2 text-[11px] text-mute">결제 단계는 데모에서 제외되어 있어요.</p>
        </div>
      </aside>
    </form>
  );
}
