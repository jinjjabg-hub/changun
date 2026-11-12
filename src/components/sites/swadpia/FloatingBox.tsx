"use client";

import { asset, src } from "./data";

/** Right-side sticky quick menu (실시간문의 / 카톡상담 / 매장위치 / TOP). */
export function FloatingBox() {
  return (
    <div className="abs">
      <div className="floating_box">
        <ul className="menus">
          <li onClick={() => (window.location.href = src("/customer"))}>
            <img className="default" src={asset("/images/2025/img/floating_icon01.svg")} alt="실시간문의" />
            <img className="hover" src={asset("/images/2025/img/floating_icon01-hover.svg")} alt="실시간문의" />
            실시간문의
          </li>
          <li onClick={() => (window.location.href = src("/board_index/board_main/view/board_notice/board_idx/377"))}>
            <img src={asset("/images/2025/img/floating_icon02.png")} alt="카톡상담" />
            카톡상담
          </li>
          <li onClick={() => (window.location.href = src("/customer/location"))}>
            <img className="multiples_2 default" src={asset("/images/2025/img/floating_icon03.png")} alt="매장위치" />
            <img className="multiples_2 hover" src={asset("/images/2025/img/floating_icon03-hover.png")} alt="매장위치" />
            매장위치
          </li>
        </ul>
        <div className="top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.19 1.096a1 1 0 0 1 1.62 0l2.376 3.291a1 1 0 0 1-.81 1.586H1.624a1 1 0 0 1-.811-1.586l2.375-3.29z" fill="#2F2F2F" />
          </svg>
          TOP
        </div>
      </div>
    </div>
  );
}
