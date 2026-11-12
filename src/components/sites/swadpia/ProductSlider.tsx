"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { asset, imgAsset, src, type Product } from "./data";

const ARROW = asset("/images/2025/img/swiper_arrow.svg");

type Props = {
  products: Product[];
  /** "best" renders the ranked number badge on each image (sec03). */
  variant: "best" | "recommend";
  /** Unique wrapper class used to scope the navigation buttons (e.g. "sec03_swiper"). */
  className: string;
};

/** Five-up product carousel used by 인기상품 (sec03) and 추천상품 (sec04). */
export function ProductSlider({ products, variant, className }: Props) {
  return (
    <Swiper
      className={`type02 ${className}`}
      modules={[Navigation]}
      slidesPerView={5}
      spaceBetween={13}
      loop={products.length > 5}
      speed={300}
      navigation={{ prevEl: `.${className} .swiper-button-prev`, nextEl: `.${className} .swiper-button-next` }}
    >
      {products.map((p, i) => (
        <SwiperSlide key={`${p.href}-${i}`}>
          <a href={src(p.href)} className="prd_link">
            {variant === "best" ? (
              <div className="img_box">
                <p className="nums">{i + 1}</p>
                <img width={225} height={225} src={imgAsset(p.img)} alt="" />
              </div>
            ) : (
              <img width={225} height={225} src={imgAsset(p.img)} alt="" />
            )}
            <div className="info">
              <p className="badge">{p.badge}</p>
              <p className="prd_name" style={p.nameStyle}>
                {p.name}
              </p>
              <p className="prd_price">{p.price}</p>
            </div>
          </a>
        </SwiperSlide>
      ))}
      <div slot="container-end" className="swiper-button-prev">
        <img src={ARROW} alt="" width={14} height={14} />
      </div>
      <div slot="container-end" className="swiper-button-next">
        <img src={ARROW} alt="" width={14} height={14} />
      </div>
    </Swiper>
  );
}
