import { Suspense } from "react";
import { OrderComplete } from "@/components/product/OrderComplete";

export const metadata = { title: "주문 접수 | 창운 (시연 데모)" };

export default function OrderCompletePage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10">
      <Suspense fallback={null}>
        <OrderComplete />
      </Suspense>
    </div>
  );
}
