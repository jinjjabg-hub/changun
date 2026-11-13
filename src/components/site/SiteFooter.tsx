import Link from "next/link";
import { Logo } from "./Logo";
import { SampleBadge } from "./SampleBadge";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-dark text-white/80">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            인쇄·판촉물을 옵션 선택만으로 바로 견적 확인하고 주문하는 사이트 시연 데모입니다.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <SampleBadge />
            <span className="text-white/70">본 데모의 모든 가격은 샘플이며 결제 기능은 없습니다.</span>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-white">바로가기</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-white hover:underline">전체 상품</Link></li>
            <li><Link href="/cart" className="hover:text-white hover:underline">장바구니</Link></li>
            <li><Link href="/products/business-card" className="hover:text-white hover:underline">명함 주문</Link></li>
            <li><Link href="/products/sticker" className="hover:text-white hover:underline">스티커 주문</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-white">고객센터 (시연용)</p>
          <p className="text-2xl font-extrabold text-white">0000-0000</p>
          <p className="mt-1 text-sm text-white/60">평일 09:00–18:00 · 점심 12:00–13:00</p>
          <p className="mt-4 text-xs text-white/50">회사 정보·사업자번호 등은 실제 서비스 오픈 시 교체됩니다.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © 창운 (시연 데모) · 포트폴리오 목적으로 제작되었으며 실제 주문이 접수되지 않습니다.
      </div>
    </footer>
  );
}
