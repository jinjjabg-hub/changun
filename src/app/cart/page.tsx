import { CartView } from "@/components/product/CartView";

export const metadata = { title: "장바구니 | 창운 (시연 데모)" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <h1 className="mb-6 text-[30px] font-extrabold tracking-tight">장바구니</h1>
      <CartView />
    </div>
  );
}
