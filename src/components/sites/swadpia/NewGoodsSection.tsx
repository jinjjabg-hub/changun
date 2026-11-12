"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { asset, newGoods } from "./data";
import { ArrowButton } from "./ArrowButton";

const ARROW = asset("/images/2025/img/swiper_arrow.svg");

/** 애드피아몰 신상품 (sec05): four-up autoplaying carousel with hover overlay cards. */
export function NewGoodsSection() {
  return (
    <section className="sec05 max-1180">
      <div className="tit_box tc">
        <h3 className="tit">애드피아몰 신상품</h3>
        <p className="tit_badge_lft">애드피아몰의 새로움을 경험하세요</p>
      </div>
      <div className="swiper_out_arrow_box">
        <Swiper
          className="type03 hover"
          modules={[Autoplay, Navigation]}
          slidesPerView={4}
          spaceBetween={13}
          loop
          speed={300}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{ prevEl: ".sec05 .swiper-button-prev", nextEl: ".sec05 .swiper-button-next" }}
        >
          {newGoods.map((g) => (
            <SwiperSlide key={g.img}>
              <img width={285} height={384} src={asset(g.img)} alt={g.alt} />
              <div className="info">
                <p className="badge">NEW</p>
                <p className="prd_name">
                  {g.lines[0]}
                  <br />
                  {g.lines[1]}
                </p>
              </div>
              <div className="info_hover" onClick={() => window.open(g.href, "_blank")}>
                <div className="info_hover_inner">
                  <p className="badge">NEW</p>
                  <p className="inner_prd_cont">
                    {g.lines[0]}
                    <br />
                    {g.lines[1]}
                  </p>
                  <ArrowButton href={g.href} />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-prev">
          <img src={ARROW} alt="" width={14} height={14} />
        </div>
        <div className="swiper-button-next">
          <img src={ARROW} alt="" width={14} height={14} />
        </div>
      </div>
    </section>
  );
}
