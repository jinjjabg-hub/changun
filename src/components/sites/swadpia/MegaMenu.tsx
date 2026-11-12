import { asset, imgAsset, src } from "./data";
import { megaMenu, type MenuColumn, type MenuLink } from "./menu-data";

type MenuId = "type01" | "type02" | "type03" | "type04" | "type05" | "type06";

function LinkItem({ item }: { item: MenuLink }) {
  const style = item.ls ? { letterSpacing: item.ls } : undefined;
  const inner = item.h ? (
    <a href={item.h.startsWith("javascript") ? src("/member/login") : src(item.h)} target={item.blank ? "_blank" : undefined} rel={item.blank ? "noreferrer" : undefined}>
      {item.t}
    </a>
  ) : (
    <>
      {item.t || " "}
      {item.badge && <p className="sp_tit">{item.badge}</p>}
    </>
  );
  return (
    <li className={item.c} style={style}>
      {inner}
    </li>
  );
}

function Columns({ columns }: { columns: MenuColumn[] }) {
  return (
    <>
      {columns.map((col, i) => (
        <div key={i} className={`items${col.cls ? ` ${col.cls}` : ""}`}>
          {col.groups.map((g, j) => (
            <ul key={j}>
              {g.map((item, k) => (
                <LinkItem key={k} item={item} />
              ))}
            </ul>
          ))}
        </div>
      ))}
    </>
  );
}

/** Extra promo area shown to the right of the link columns (type03–type06). */
function OtherBox({ id }: { id: MenuId }) {
  switch (id) {
    case "type03":
      return (
        <div className="other_box">
          <div className="img_box" onClick={() => (window.location.href = src("/board_index/board_main/view/board_newGoods/board_idx/359/page/2/"))}>
            <img src={imgAsset("/images/gnb_banner/gnb02_20251022.jpg")} alt="" width={560} height={280} />
          </div>
        </div>
      );
    case "type04":
      return (
        <div className="other_box">
          <div className="left_txt_box">
            <div className="left">
              <img src={asset("/images/2025/img/category_type04_img.svg")} alt="" />
            </div>
            <div className="right">
              <p className="head">제작문의</p>
              <p>02-6262-5509</p>
              <p>02-6262-5741</p>
              <p>02-6262-5500</p>
              <p>02-6262-5536</p>
            </div>
          </div>
          <div className="img_box">
            <img src={imgAsset("/images/gnb_banner/gnb03_20260212.jpg")} alt="" width={560} height={280} useMap="#Map_gnb" />
            <map name="Map_gnb">
              <area shape="poly" coords="1,1,1,279,339,278,218,0,2,1" href={src("/goods/goods_view/CPS7000/GPS7001")} alt="사각 포스트잇 바로가기" />
              <area shape="poly" coords="223,2,343,279,559,280,557,3,224,3" href={src("/goods/goods_view/CPS7100/GPS7101")} alt="모양 포스트잇 바로가기" />
            </map>
          </div>
        </div>
      );
    case "type05":
      return (
        <div className="other_box">
          <div className="left_txt_box">
            <div className="inner_item">
              <img src={asset("/images/2025/img/category_type05_img01.svg")} alt="" />
              <p>
                박스, 포장재,
                <br />
                홀더, 표지, 상품텍
              </p>
            </div>
            <div className="inner_item">
              <img src={asset("/images/2025/img/category_type05_img02.svg")} alt="" />
              <p>옵션인쇄, UV인쇄</p>
            </div>
            <div className="inner_item">
              <img src={asset("/images/2025/img/category_type05_img03.svg")} alt="" />
              <p>전지기준 25매 부터</p>
            </div>
          </div>
          <div className="img_box" onClick={() => (window.location.href = src("/board_index/board_main/view/board_newGoods/board_idx/434/page/1/"))}>
            <img src={imgAsset("/images/gnb_banner/gnb04_20261028.jpg")} alt="" width={560} height={280} />
          </div>
        </div>
      );
    case "type06":
      return (
        <div className="other_box">
          <div className="left_txt_box">
            <div className="inner_item">
              <img src={asset("/images/2025/img/category_type06_img01.svg")} alt="" />
              <p>
                샘플북 6종류
                <br />
                컬러차트북 3종류
              </p>
            </div>
            <div className="inner_item">
              <img src={asset("/images/2025/img/category_type06_img02.svg")} alt="" />
              <p>
                운영시간
                <br />
                오전 9시~오후 7시
              </p>
            </div>
          </div>
          <div className="img_box" onClick={() => (window.location.href = src("/goods/goods_view/CLC1000/GLC1001"))}>
            <img src={imgAsset("/images/gnb_banner/gnb05_20260212.jpg")} alt="" width={560} height={280} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

const ALL_IDS: MenuId[] = ["type01", "type02", "type03", "type04", "type05", "type06"];

export function MegaMenu({ active }: { active: MenuId | null }) {
  return (
    <div className={`menu_box${active ? " on" : ""}`}>
      <div className={`inner_box${active ? ` ${active}` : ""}`}>
        <div className="max-1180">
          {ALL_IDS.map((id) => (
            <div key={id} id={id} className={`grid-8 category${active === id ? " on" : ""}`}>
              <Columns columns={megaMenu[id]} />
              <OtherBox id={id} />
            </div>
          ))}
        </div>
      </div>
      <div className="outer_box">
        <div className="max-1180">
          <div className="left">
            <div className="tit_box">
              <p className="tit">나만의 메뉴보기</p>
              <p className="sub_tit">
                메뉴설정
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.007 9.993 11 4m0 0H5m6 0v6" stroke="#335CFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
            <ul>
              {Array.from({ length: 9 }, (_, i) => (
                <li key={i}>
                  <a className="card empty" href="#" onClick={(e) => e.preventDefault()} />
                </li>
              ))}
            </ul>
          </div>
          <div className="right">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="60" rx="30" fill="#fff" />
              <path d="M26.577 41.207h-5.295a.498.498 0 0 1-.496-.498V19.29c0-.274.223-.498.496-.498h17.024c.274 0 .497.224.497.498v3.166c0 .357.288.646.643.646.355 0 .643-.289.643-.646v-3.166c0-.987-.8-1.791-1.783-1.791H21.282c-.983 0-1.782.804-1.782 1.791V40.71c0 .987.799 1.791 1.782 1.791h5.295c.355 0 .643-.289.643-.646a.645.645 0 0 0-.643-.647zM39.41 36.617a.678.678 0 0 0-.68.679v3.323a.524.524 0 0 1-.523.523h-3.324a.678.678 0 0 0 0 1.358h3.324c1.038 0 1.88-.844 1.88-1.881v-3.323a.678.678 0 0 0-.678-.679z" fill="#DCDDE0" stroke="#DCDDE0" strokeWidth=".288" strokeMiterlimit="10" />
              <path d="M24.516 27.793c-.335 0-.608.329-.608.735 0 .407.272.736.608.736h9.078c.336 0 .608-.33.608-.736 0-.406-.272-.735-.608-.735h-9.078zM24.501 32.207c-.327 0-.593.33-.593.735 0 .407.266.736.593.736h4.697c.327 0 .593-.33.593-.736 0-.406-.266-.735-.593-.735H24.5zM35.673 24.118c0-.406-.283-.735-.633-.735h-10.5c-.348 0-.632.329-.632.735 0 .406.284.735.633.735h10.5c.349 0 .632-.329.632-.735zM44.318 28.14l-3.107-3.106a.62.62 0 0 0-.877 0l-9.321 9.32a.62.62 0 0 0-.164.289l-1.036 4.142a.622.622 0 0 0 .754.754l4.142-1.035a.623.623 0 0 0 .289-.164l9.32-9.32a.62.62 0 0 0 0-.878v-.002zM34.241 37.34l-2.971.742.743-2.97 1.244-1.244 2.228 2.228-1.244 1.244zm2.123-2.122-2.229-2.228 6.638-6.637L43 28.58l-6.637 6.637z" fill="#DCDDE0" stroke="#DCDDE0" strokeWidth=".288" strokeMiterlimit="10" />
            </svg>
            <div className="inner_right_box">
              <p className="tit">별도견적</p>
              <p className="sub_tit">원하는 견적이 없으신가요?</p>
              <ul className="flr" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
