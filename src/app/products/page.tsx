import { Suspense } from "react";
import { ProductList } from "@/components/product/ProductList";

export const metadata = { title: "전체 상품 | 창운 (시연 데모)" };

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <h1 className="text-[30px] font-extrabold tracking-tight">전체 상품</h1>
      <Suspense fallback={null}>
        <ProductList />
      </Suspense>
    </div>
  );
}
