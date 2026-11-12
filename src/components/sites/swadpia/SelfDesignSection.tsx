"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { asset, selfDesigns, src } from "./data";
import { ArrowButton } from "./ArrowButton";

/** 셀프 디자인 (sec06): five static cards (one per slide) with hover overlay. */
export function SelfDesignSection() {
  return (
    <section className="sec06 max-1180">
      <div className="tit_box">
        <h3 className="tit">셀프 디자인</h3>
        <p className="tit_badge_lft">쉽게 직접 만드는 나만의 디자인</p>
      </div>
      <Swiper className="type02 hover" slidesPerView={5} spaceBetween={13} speed={300}>
        {selfDesigns.map((d) => (
          <SwiperSlide key={d.img}>
            <img width={225} height={250} src={asset(d.img)} alt={d.alt} />
            <div className="info">
              <p className="inner_tit">{d.title}</p>
              <p className="inner_cont">{d.desc}</p>
            </div>
            <div className="info_hover" onClick={() => window.open(src(d.href), "_blank")}>
              <div className="info_hover_inner">
                <p className="inner_tit">{d.title}</p>
                <p className="inner_cont">{d.desc}</p>
                <ArrowButton />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
