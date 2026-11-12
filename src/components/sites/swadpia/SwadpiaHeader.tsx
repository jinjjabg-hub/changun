"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { asset, gnbCategories, howUseLinks, src, topBannerNews } from "./data";
import { MegaMenu } from "./MegaMenu";

type MenuId = "type01" | "type02" | "type03" | "type04" | "type05" | "type06";

export function SwadpiaHeader({ christmas = true }: { christmas?: boolean }) {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const [howUseOpen, setHowUseOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mega menu / dropdown when clicking anywhere outside the header.
  useEffect(() => {
    if (!menu && !howUseOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMenu(null);
        setHowUseOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu, howUseOpen]);

  const toggleMenu = (id: MenuId) => setMenu((cur) => (cur === id ? null : id));

  return (
    <header ref={headerRef} className={`sw_header${christmas ? " christmas_ver" : ""}`}>
      {bannerOpen && (
        <div className="banner_top" id="banner_top">
          <div className="max-1180">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              loop
              speed={300}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ el: ".banner_top .swiper-pagination", type: "fraction" }}
              navigation={{ prevEl: ".banner_top .swiper-button-prev", nextEl: ".banner_top .swiper-button-next" }}
            >
              {topBannerNews.map((n) => (
                <SwiperSlide key={n.href}>
                  <img src={asset("/images/2025/img/top_banner_icon.png")} alt="" width={16} height={16} />
                  <span onClick={() => (window.location.href = src(n.href))}>
                    <strong>[NEWS]</strong> {n.text}
                  </span>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="swiper-pagination-wrap">
              <div className="swiper-button-prev" />
              <div className="swiper-pagination" />
              <div className="swiper-button-next" />
            </div>
            <p className="close" onClick={() => setBannerOpen(false)} aria-label="배너 닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="m16 8.5-8 8m0-8 8 8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </p>
          </div>
        </div>
      )}

      <div className="header_wrap max-1180">
        <div className="left">
          <Link href="/">
            <img className="default_img" src={asset("/images/2025/img/logo.svg")} alt="로고" width={156} height={23} />
            <img className="christmas_img" src={asset("/images/2025/img/logo_christmas.svg")} alt="로고" width={156} height={23} />
          </Link>
        </div>
        <div className="right">
          <a className="signup" href={src("/member/join")}>회원가입</a>
          <a className="login" href={src("/member/login")}>로그인</a>
          <a href={src("/order/order_cart")} className="basket">
            <img src={asset("/images/2025/img/basket.svg")} alt="" />
            <p className="cnt_box" id="cnt_box" />
          </a>
        </div>
      </div>

      <div className="gnb_2025">
        <div className="max-1180">
          <div className="left">
            <div
              className={`menu_wrab${menu ? " on" : ""}`}
              role="button"
              aria-label="전체 메뉴"
              onClick={() => toggleMenu("type01")}
            >
              <img className="default_img default" src={asset("/images/2025/img/ham_default.svg")} alt="" />
              <img className="default_img on" src={asset("/images/2025/img/ham_on.svg")} alt="" />
              <img className="christmas_img default" src={asset("/images/2025/img/ham_default_christmas.svg")} alt="" />
              <img className="christmas_img on" src={asset("/images/2025/img/ham_on_christmas.svg")} alt="" />
            </div>
            {gnbCategories.map((c) => (
              <a
                key={c.id}
                className="txt category_btn"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMenu(c.id);
                }}
              >
                {c.label}
                {"badge" in c && c.badge && (
                  <p className={`sp_tit${"badgeBlue" in c && c.badgeBlue ? " sp_tit_blue" : ""}`}>{c.badge}</p>
                )}
              </a>
            ))}
            <a className="txt" href={src("/goods/template_list")}>
              셀프디자인
              <p className="sp_tit sp_tit_blue">청첩장&캘린더</p>
            </a>
            <a className="txt" href="https://www.adpiamall.com/" target="_blank" rel="noreferrer">
              실사출력
            </a>
          </div>
          <div className="right">
            <div className={`txt how_use_btn${howUseOpen ? " on" : ""}`} onClick={() => setHowUseOpen((v) => !v)}>
              이용방법
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.19 4.876a1 1 0 0 0 1.62 0l2.376-3.29A1 1 0 0 0 6.376 0H1.624a1 1 0 0 0-.811 1.585l2.375 3.291z" fill="#000" />
              </svg>
              <ul className="how_use_box">
                {howUseLinks.map((l) => (
                  <li key={l.text}>
                    <a href={src(l.href)} className="items">{l.text}</a>
                  </li>
                ))}
              </ul>
            </div>
            <a className="txt" href={src("/customer")}>고객센터</a>
            <a className="txt active" href={src("/board_index/board_main/view/board_notice/board_idx/441/page/1/")}>웹하드</a>
          </div>
        </div>

        <MegaMenu active={menu} />
      </div>
    </header>
  );
}
