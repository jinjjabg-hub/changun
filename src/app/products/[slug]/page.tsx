import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, products } from "@/data/catalog";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return { title: p ? `${p.name} 주문 | 창운 (시연 데모)` : "상품을 찾을 수 없어요" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <nav aria-label="경로" className="mb-4 text-xs text-mute">
        <Link href="/" className="hover:text-brand">홈</Link> › <Link href="/products" className="hover:text-brand">전체 상품</Link> › <span className="text-ink">{p.name}</span>
      </nav>
      <header className="mb-7">
        <p className="text-sm font-semibold text-brand">{p.category}</p>
        <h1 className="text-[30px] font-extrabold tracking-tight">{p.name}</h1>
        <p className="mt-1 text-mute">{p.tagline}</p>
      </header>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-2xl bg-surface" />}>
        <ProductConfigurator product={p} />
      </Suspense>
      <section className="mt-12 rounded-2xl bg-surface p-6">
        <h2 className="mb-2 font-extrabold">주문 전 확인해 주세요</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-mute">
          {p.notes.map((n) => <li key={n}>{n}</li>)}
          <li>가격은 시연용 샘플이며, 출고 예정일은 주말을 제외한 영업일 기준입니다.</li>
        </ul>
      </section>
    </div>
  );
}
