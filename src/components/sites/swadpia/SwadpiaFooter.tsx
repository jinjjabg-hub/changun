"use client";

import { useState } from "react";

import { asset, familySites, footerAddresses, footerLinks, snsLinks, src } from "./data";

export function SwadpiaFooter() {
  const [familyOpen, setFamilyOpen] = useState(false);

  return (
    <footer className="sw_footer">
      <div className="max-1180">
        <div className="container">
          <div className="left">
            <div className="cates">
              <img src={asset("/images/2025/img/logo_footer.svg")} alt="로고" />
              <ul>
                {footerLinks.map((l) => (
                  <li key={l.text}>
                    <a href={src(l.href)} target={l.blank ? "_blank" : undefined} rel={l.blank ? "noreferrer" : undefined}>
                      {l.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="info flr">
              <li>(주)성원애드피아</li>
              <li>대표 : 정대원</li>
              <li>Tell : 1599-5555</li>
              <li>세금계산서발행 : 성수동 사업자등록번호 : 201-85-22977</li>
              <li>
                <button className="business_certificate" type="button">
                  <a href={src("/board_index/board_main/view/board_pds/board_idx/44/page/1/")}>사업자등록증</a>
                </button>
              </li>
            </ul>
            <ul className="info02 flr">
              <li>통신판매업신고 : 중구06853호 사업자등록번호 : 201-81-86819 </li>
              <li>
                <button
                  className="business_infomation"
                  type="button"
                  onClick={() =>
                    window.open(
                      "https://www.ftc.go.kr/bizCommPop.do?wrkr_no=2018186819",
                      "bizCommPop",
                      "width=750, height=700;",
                    )
                  }
                >
                  사업자정보확인
                </button>
              </li>
            </ul>
            <ul className="info03 flc">
              {footerAddresses.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="copyright">COPYRIGHTⓒ 2004 SUNGWONADPIA Co. Ltd. ALL RIGHTS RESERVED</p>
          </div>

          <div className="right">
            <div className="flr top">
              <div className="flc btn_group">
                <a
                  className="button"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(src("/member/sw_printing_policy"), "swprintingpolicy", "width=770, height=750;");
                  }}
                >
                  <svg className="mb-1" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#sw-policy-clip)">
                      <path d="m16.736 14.721-5.21-9.311A1.754 1.754 0 0 0 10 4.5c-.63 0-1.212.347-1.528.91l-5.236 9.36a1.87 1.87 0 0 0 0 1.82c.315.563.897.91 1.527.91h10.474c.974 0 1.763-.815 1.763-1.82 0-.352-.097-.68-.264-.959z" fill="#A3A0A0" />
                      <path className="centers" d="M10 13.028c-.498 0-.902-.355-.902-.793L9 8.727c0-.438.502-.793 1-.793s1 .355 1 .793l-.098 3.508c0 .438-.404.793-.902.793zM10 15.668c-.263 0-.521-.106-.707-.293A1.007 1.007 0 0 1 9 14.668c0-.263.107-.521.293-.707.186-.186.444-.293.707-.293.263 0 .521.107.707.293.186.186.293.444.293.707 0 .263-.107.521-.293.707a1.006 1.006 0 0 1-.707.293z" fill="#F4F5F7" />
                    </g>
                    <defs>
                      <clipPath id="sw-policy-clip">
                        <path fill="#fff" transform="translate(3 4.5)" d="M0 0h14v13H0z" />
                      </clipPath>
                    </defs>
                  </svg>
                  인쇄물정책
                </a>
                <a className="button" href="http://helpu.kr/swadpia/" target="_blank" rel="noreferrer">원격지원</a>
                <a className="button" href={src("/mypage/mantoman")}>1:1 상담</a>
                <a className="button" href={src("/mypage/mantoman/as")}>AS 상담</a>
              </div>
              <a href={src("/customer/sw_home_video")} target="_blank" rel="noreferrer" className="videoLink">
                <img src={asset("/images/2025/img/footer_video_link.svg")} alt="이미지" width={230} height={135} />
              </a>
            </div>

            <div className="flr sns_family_box">
              <ul className="flr sns_group">
                {snsLinks.map((s) => (
                  <li key={s.name}>
                    <a className="sns_items" href={s.href} target="_blank" rel="noreferrer">
                      <img className="default" src={asset(s.icon)} alt="" />
                      <img className="hover" src={asset(s.iconOn)} alt="" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="btn_group">
                <a className="button" href="http://www.pr5555.co.kr" target="_blank" rel="noreferrer">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#sw-truck-clip)" fill="#A3A0A0">
                      <path d="M15.251 8H5.749C4.783 8 4 8.755 4 9.685v9.428c0 .49.412.887.92.887h.073a.04.04 0 0 0 .04-.039c0-1.576 1.331-2.859 2.967-2.859 1.635 0 2.966 1.283 2.966 2.859a.04.04 0 0 0 .04.039h5.567a.42.42 0 0 0 .427-.411V9.685C17 8.755 16.217 8 15.251 8zM25.737 13.704l-3.44-4.188A1.292 1.292 0 0 0 21.264 9h-2.888a.378.378 0 0 0-.377.38v10.24c0 .21.169.38.377.38h.562v-.04c0-1.608 1.297-2.916 2.891-2.916 1.595 0 2.893 1.308 2.893 2.916V20A1.3 1.3 0 0 0 26 18.695v-4.203a1.31 1.31 0 0 0-.263-.789zM24.03 15.08h-3.779a.97.97 0 0 1-.966-.975v-3.943c0-.09.072-.163.162-.163h1.537c.13 0 .254.061.332.166l3.194 3.942a.61.61 0 0 1 .122.367.605.605 0 0 1-.603.605z" />
                      <path d="M8 18a2.002 2.002 0 0 0-2 2.032A2.008 2.008 0 0 0 8 22a2.008 2.008 0 0 0 2-1.968V20c0-1.103-.897-2-2-2zM22 18a2.002 2.002 0 0 0-2 2.032A2.008 2.008 0 0 0 22 22a2.009 2.009 0 0 0 2-1.968V20c0-1.103-.897-2-2-2z" />
                    </g>
                    <defs>
                      <clipPath id="sw-truck-clip">
                        <path fill="#fff" transform="translate(4 8)" d="M0 0h22v14H0z" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span>성원택배</span>
                </a>
              </div>
              <div className={`select_box${familyOpen ? " on" : ""}`}>
                <p className="selectd_txt" onClick={() => setFamilyOpen((v) => !v)}>
                  FAMILY SITE
                  <svg className="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity=".6" d="M9 1 5 5 1 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </p>
                <ul className="family_site">
                  {familySites.map((f) => (
                    <li key={f.text}>
                      <a href={f.href} target="_blank" rel="noreferrer">{f.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
