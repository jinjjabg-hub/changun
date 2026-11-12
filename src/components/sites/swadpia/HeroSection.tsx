"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { asset, heroBanners, imgAsset, noticeIcons, notices, src } from "./data";

const ARROW = asset("/images/2025/img/swiper_arrow.svg");

export function HeroSection() {
  return (
    <section className="sec01">
      <Swiper
        className="sec01_swiper type01"
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView="auto"
        centeredSlides
        spaceBetween={30}
        loop
        speed={300}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ el: ".sec01 .type01_pagination .swiper-pagination", type: "fraction" }}
        navigation={{ prevEl: ".sec01 .type01_navigation .swiper-button-prev", nextEl: ".sec01 .type01_navigation .swiper-button-next" }}
      >
        {heroBanners.map((b) => (
          <SwiperSlide key={b.img}>
            <img
              width={1180}
              height={480}
              src={asset(b.img)}
              alt={b.alt}
              onClick={() => (window.location.href = src(b.href))}
            />
          </SwiperSlide>
        ))}

        <div slot="container-end" className="type01_pagination">
          <div className="max-1180">
            <div className="swiper-pagination" />
          </div>
        </div>
        <div slot="container-end" className="type01_navigation">
          <div className="max-1180">
            <div className="swiper-button-prev">
              <img src={ARROW} alt="" width={14} height={14} />
            </div>
            <div className="swiper-button-next">
              <img src={ARROW} alt="" width={14} height={14} />
            </div>
          </div>
        </div>
        <div slot="container-end" className="notice_box">
          <div className="max-1180 list_box">
            <div className="list">
              <div className="notice_txt">
                <p className="top_tit">
                  <a href={src("/board_index/index/board_notice")}>
                    <img className="multiples_1" src={asset("/images/2025/img/notice_bell.png")} alt="" />
                    공지사항
                    <img className="notice_arrow" src={asset("/images/2025/img/notice_arrow.svg")} alt="" />
                  </a>
                </p>
                <ul>
                  {notices.map((n) => (
                    <li key={n.href} onClick={() => (window.location.href = src(n.href))}>
                      {n.text}
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="notice_icon_box">
                {noticeIcons.map((ic) => (
                  <li
                    key={ic.label}
                    onClick={() => {
                      if (ic.alert) window.alert(ic.alert);
                      else if (ic.href) window.location.href = src(ic.href);
                    }}
                  >
                    <img className="default" src={imgAsset(ic.icon)} alt="" />
                    <img className="on" src={imgAsset(ic.iconOn)} alt="" />
                    <p>{ic.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Swiper>
    </section>
  );
}
