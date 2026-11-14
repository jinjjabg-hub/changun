import { CheckoutForm } from "@/components/product/CheckoutForm";

export const metadata = { title: "주문서 작성 | 창운 (시연 데모)" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <h1 className="mb-6 text-[30px] font-extrabold tracking-tight">주문서 작성</h1>
      <CheckoutForm />
    </div>
  );
}
