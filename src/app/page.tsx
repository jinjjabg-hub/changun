import Link from "next/link";
import { Clock, Layers, Truck } from "lucide-react";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { ProductCarousel } from "@/components/site/ProductCarousel";
import { HoverCards } from "@/components/site/HoverCards";
import { SampleBadge } from "@/components/site/SampleBadge";
import { popular, quickServices, recommended } from "@/data/home";

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5 flex items-end gap-3">
      <h2 className="text-[26px] font-extrabold tracking-tight text-ink">{title}</h2>
      {desc && <p className="pb-1 text-sm text-mute">{desc}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <HeroCarousel />

      <div className="mx-auto max-w-[1180px] px-4">
        {/* 빠른 서비스 */}
        <section aria-label="빠른 메뉴" className="relative z-10 -mt-8 rounded-2xl bg-white p-3 shadow-[0_10px_40px_-10px_rgba(10,61,46,.3)]">
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {quickServices.map((q) => (
              <li key={q.label}>
                <Link
                  href={q.slug ? `/products/${q.slug}` : (q.href ?? "/")}
                  className="flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-ink transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-lg text-brand">
                    {q.label.slice(0, 1)}
                  </span>
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <SectionTitle title="인기 상품" desc="지금 가장 많이 주문하는 사양이에요" />
          <ProductCarousel items={popular} numbered />
        </section>

        <section className="mt-16">
          <SectionTitle title="추천 상품" desc="후가공까지 한 번에 담은 추천 사양" />
          <ProductCarousel items={recommended} />
        </section>
      </div>

      <section className="mt-16 bg-surface py-14">
        <div className="mx-auto max-w-[1180px] px-4">
          <SectionTitle title="창운 제작 상품" desc="마우스를 올려 상품 특징을 확인해 보세요" />
          <HoverCards />
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-[1180px] gap-4 px-4 md:grid-cols-3">
        {[
          { icon: Layers, title: "옵션 의존 견적", desc: "용지를 바꾸면 선택 가능한 사이즈와 후가공이 함께 바뀌어요." },
          { icon: Clock, title: "출고일 즉시 계산", desc: "수량과 후가공에 따라 영업일 기준 출고 예정일이 바로 보여요." },
          { icon: Truck, title: "장바구니 · 주문서", desc: "여러 상품을 담아 한 번에 주문서를 작성할 수 있어요." },
        ].map((f) => (
          <div key={f.title} className="flex gap-4 rounded-2xl border border-line p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <f.icon size={24} />
            </span>
            <div>
              <p className="font-extrabold">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-mute">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-mute">
        <SampleBadge /> 화면의 모든 가격은 시연용 샘플입니다.
      </p>
    </>
  );
}
