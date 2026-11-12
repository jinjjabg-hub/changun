import { FloatingBox } from "@/components/sites/swadpia/FloatingBox";
import { HeroSection } from "@/components/sites/swadpia/HeroSection";
import { NewGoodsSection } from "@/components/sites/swadpia/NewGoodsSection";
import { ProductSlider } from "@/components/sites/swadpia/ProductSlider";
import { QuickService } from "@/components/sites/swadpia/QuickService";
import { SelfDesignSection } from "@/components/sites/swadpia/SelfDesignSection";
import { SwadpiaFooter } from "@/components/sites/swadpia/SwadpiaFooter";
import { SwadpiaHeader } from "@/components/sites/swadpia/SwadpiaHeader";
import { bestProducts, recommendedProducts } from "@/components/sites/swadpia/data";

export default function Home() {
  return (
    <>
      <SwadpiaHeader />
      <main className="main_2025">
        <HeroSection />
        <QuickService />
        <section className="sec03 max-1180">
          <div className="tit_box">
            <h3 className="tit">인기상품</h3>
            <p className="tit_badge_lft">가장 인기있는 아이템</p>
          </div>
          <ProductSlider products={bestProducts} variant="best" className="sec03_swiper" />
        </section>
        <section className="sec04 max-1180">
          <div className="tit_box">
            <h3 className="tit">추천상품</h3>
            <p className="tit_badge_lft">
              성원애드피아 <span className="en">PICK!</span>
            </p>
          </div>
          <ProductSlider products={recommendedProducts} variant="recommend" className="sec04_swiper" />
        </section>
        <NewGoodsSection />
        <SelfDesignSection />
      </main>
      <SwadpiaFooter />
      <FloatingBox />
    </>
  );
}
