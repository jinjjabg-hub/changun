// Content captured from https://www.swadpia.co.kr/ (homepage, 2026-11-12).
// Out-of-scope destinations keep pointing at the source site via `src()`.

export const SOURCE_ORIGIN = "https://www.swadpia.co.kr";
export const ASSET = "/sites/swadpia";

/** Prefix a source-relative pathname with the source origin. */
export function src(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SOURCE_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Local asset path for a file served from www.swadpia.co.kr. */
export function asset(path: string): string {
  return `${ASSET}${path}`;
}

/** Local asset path for a file served from image.swadpia.co.kr. */
export function imgAsset(path: string): string {
  return `${ASSET}/img${path}`;
}

export const topBannerNews = [
  { text: "출고실 이용 안내", href: "/board_index/board_main/view/board_notice/board_idx/516/page/1/" },
  { text: "수협계좌 이용고객 환불계좌 재등록 요청", href: "/board_index/board_main/view/board_notice/board_idx/515/page/1/" },
];

export const gnbCategories = [
  { id: "type02", label: "상업인쇄", badge: "대량주문" },
  { id: "type03", label: "디지털인쇄" },
  { id: "type04", label: "판촉물" },
  { id: "type05", label: "패키지", badge: "쇼핑백", badgeBlue: true },
  { id: "type06", label: "기획상품" },
] as const;

export const howUseLinks = [
  { text: "사이트 이용방법", href: "/customer/first_visit" },
  { text: "작업 주의사항", href: "/sw_guide/main" },
  { text: "양식 다운받기", href: "/sw_guide/main/0/BA01/BB03" },
  { text: "인쇄가이드", href: "/sw_guide/main" },
  { text: "상품소개", href: "/goods/goods_intro_new/GDP" },
  { text: "별색", href: "/customer" },
];

export const heroBanners = [
  { img: "/uploads/banner/banner1789718715.jpg", alt: "메인5", href: "/board_index/board_main/view/board_newGoods/board_idx/430/page/1/" },
  { img: "/uploads/banner/banner1788226806.jpg", alt: "셀프디자인", href: "/board_index/board_main/view/board_newGoods/board_idx/428/page/1/" },
  { img: "/uploads/banner/banner1790823883.jpg", alt: "샘플북", href: "/board_index/board_main/view/board_newGoods/board_idx/432/page/1/" },
  { img: "/uploads/banner/banner1792743227.jpg", alt: "메인1", href: "/board_index/board_main/view/board_newGoods/board_idx/434/page/1/" },
  { img: "/uploads/banner/banner1792647141.jpg", alt: "미네랄 페이퍼", href: "/board_index/board_main/view/board_newGoods/board_idx/433/page/1/" },
  { img: "/uploads/banner/banner1782792819.jpg", alt: "메인2", href: "/board_index/board_main/view/board_newGoods/board_idx/407/page/1/" },
  { img: "/uploads/banner/banner1787725133.jpg", alt: "포스트잇", href: "/board_index/board_main/view/board_newGoods/board_idx/425/page/1/" },
  { img: "/uploads/banner/banner1777529833.jpg", alt: "10번째 배너", href: "/board_index/board_main/view/board_newGoods/board_idx/416/page/1/" },
  { img: "/uploads/banner/banner1787536991.jpg", alt: "메인4", href: "/board_index/board_main/view/board_newGoods/board_idx/424/page/1/" },
  { img: "/uploads/banner/banner1787532772.jpg", alt: "배너4", href: "https://www.adpiamall.com/board/notice/read/842" },
];

export const notices = [
  { text: "택배업체 및 요금 변경안내", href: "/board_index/board_main/view/board_notice/board_idx/560/page/1/" },
  { text: "충무로 무인출고실 9월 14일 오픈!", href: "/board_index/board_main/view/board_notice/board_idx/535/page/1/" },
  { text: "결제수단 변경 안내", href: "/board_index/board_main/view/board_notice/board_idx/519/page/1/" },
  { text: "반복 주문을 더 간편하게! 옵션 저장 안내", href: "/board_index/board_main/view/board_notice/board_idx/520/page/1/" },
  { text: "더 다양하게 만나는 8종 샘플북", href: "/board_index/board_main/view/board_newGoods/board_idx/432/page/1/" },
  { text: "디지털박/에폭시 명함,포스터 상품 출시", href: "/board_index/board_main/view/board_newGoods/board_idx/340/page/1/" },
];

export const noticeIcons = [
  { label: "별도견적", icon: "/images/ui/ico_quote.svg", iconOn: "/images/ui/ico_quote_on.svg", href: "/goods/goods_view/COR1000/GOR1001" },
  { label: "세금계산서", icon: "/images/ui/ico_tax.svg", iconOn: "/images/ui/ico_tax_on.svg", alert: "기업회원만 자동 세금계산서 발급이 가능합니다.\n\n개인회원은  『주민등록번호세금계산서』 또는  『현금영수증발급』만  가능하오니\n익월 10일까지 발급받으시기 바랍니다" },
  { label: "현금영수증", icon: "/images/ui/ico_cash.svg", iconOn: "/images/ui/ico_cash_on.svg", href: "/mypage/cash_receipt_issued_list" },
  { label: "환불계좌", icon: "/images/ui/ico_refund.svg", iconOn: "/images/ui/ico_refund_on.svg", href: "/mypage/accountnumber" },
];

export const quickServices = [
  { label: "주문/배송", icon: "/images/2025/img/sec02_img01.svg", href: "/mypage/order_ing" },
  { label: "묶음배송", icon: "/images/2025/img/sec02_img02.svg", href: "/customer/delivery_care" },
  { label: "출고일", icon: "/images/2025/img/sec02_img03.svg", href: "/board_index/board_main/view/board_notice/board_idx/412/page/1/" },
  { label: "AS상담", icon: "/images/2025/img/sec02_img04.svg", href: "/mypage/mantoman/as" },
  { label: "대량명함", icon: "/images/2025/img/sec02_img05.svg", href: "/board_index/board_main/view/board_notice/board_idx/127" },
  { label: "매장위치", icon: "/images/2025/img/sec02_img06.svg", href: "/customer/location" },
  { label: "정보변경", icon: "/images/2025/img/sec02_img07.svg", href: "/member/mody" },
];

export type Product = {
  href: string;
  img: string; // path on image.swadpia.co.kr
  badge: string;
  name: string;
  price: string;
  nameStyle?: { letterSpacing: string };
};

export const bestProducts: Product[] = [
  { href: "/goods/goods_view/CDP8000/GDP8001", img: "/images/best_con/best2_20251202.jpg", badge: "PUR카탈로그", name: "PUR 카탈로그 A4(2부)", price: "44,900원" },
  { href: "/goods/goods_view/CNC2000/GNC2001", img: "/images/best_con/best4_20250701.jpg", badge: "고급지명함", name: "고급지명함 90X50 (200매)", price: "5,500원" },
  { href: "/goods/goods_view/CPR3000/GPR3001", img: "/images/best_con/best7_20250701.jpg", badge: "리플렛/팜플렛", name: "리플렛/팜플렛 297X210 (1000매)", price: "119,800원" },
  { href: "/goods/goods_view/CLP1000/GLP1001", img: "/images/best_con/best9_20250701.jpg", badge: "라벨스티커(롤)", name: "라벨스티커(롤) 60X50 1종류 (10,000매)", price: "366,300원" },
  { href: "/goods/goods_view/CDP1600/GDP1601", img: "/images/recom_con/recom2_20250701.jpg", badge: "소량패키지", name: "소량패키지 420X594 (5매)", price: "6,600원" },
  { href: "/goods/goods_view/CST2000/GST2001", img: "/images/best_con/best3_20250701.jpg", badge: "도무송형스티커", name: "도무송형스티커 10X10 2개 (1000매)", price: "11,100원" },
  { href: "/goods/goods_view/CCD1000/GCD1001", img: "/images/best_con/best1_20251022.jpg", badge: "캘린더", name: "캘린더 230X150 (100부)", price: "395,500원" },
  { href: "/goods/goods_view/CPS1000/GPS1001", img: "/images/best_con/best1_20260629.jpg", badge: "부채", name: "부채 미니동글이 140x140 (250매)", price: "50,000원" },
  { href: "/goods/goods_view/CPK4000/GPK4001", img: "/images/recom_con/recom3_20250701.jpg", badge: "일반쇼핑백", name: "일반쇼핑백 180X200X100 (200매)", price: "363,200원" },
  { href: "/goods/goods_view/CEV3000/GEV3001", img: "/images/best_con/best8_20250701.jpg", badge: "자켓형봉투", name: "자켓형봉투 110X75 (500매)", price: "75,000원" },
];

export const recommendedProducts: Product[] = [
  { href: "/goods/goods_view/CDP1400/GDP1401", img: "/images/recom_con/recom1_20260904.jpg", badge: "디지털박/에폭시명함", name: "디지털박/에폭시명함 90X50 (200매)", price: "11,000원", nameStyle: { letterSpacing: "-0.7px" } },
  { href: "/goods/goods_view/CST7000/GST7001", img: "/images/recom_con/recom2_20260904.jpg", badge: "팬시롤스티커", name: "팬시롤스티커 45X45 (25롤)", price: "121,900원" },
  { href: "/goods/goods_view/CNR1000/GNR1001", img: "/images/recom_con/recom3_20260904.jpg", badge: "NCR지", name: "NCR지 210X297 (10권)", price: "26,000원" },
  { href: "/goods/goods_view/CPK4000/GPK4001", img: "/images/recom_con/recom4_20260904.jpg", badge: "일반쇼핑백", name: "일반쇼핑백 180X200X100 (200매)", price: "363,200원" },
  { href: "/goods/goods_view/CST5000/GST5001", img: "/images/recom_con/recom5_20260904.jpg", badge: "스폐셜스티커", name: "스폐셜스티커 210X300 (100매)", price: "144,800원" },
  { href: "/goods/goods_view/CLF1000/GLF1001", img: "/images/recom_con/recom13_20250701.jpg", badge: "합판전단", name: "합판전단 210X297 (2000매)", price: "35,000원" },
  { href: "/goods/goods_view/CDP8000/GDP8001", img: "/images/recom_con/recom1_20251202.jpg", badge: "디지털카탈로그", name: "디지털 카탈로그 A4(2부)", price: "34,900원" },
  { href: "/goods/goods_view/CNC3000/GNC3001", img: "/images/recom_con/recom1_20250701.jpg", badge: "카드명함", name: "카드명함 86X54 (200매)", price: "11,000원" },
  { href: "/goods/goods_view/CPS7100/GPS7101", img: "/images/recom_con/recom9_20260904.jpg", badge: "모양포스트잇", name: "모양포스트잇 원형 70X70 (40권)", price: "50,000원" },
  { href: "/goods/goods_view/CPR5100/GPR5101", img: "/images/recom_con/recom8_20250701.jpg", badge: "PP홀더", name: "PP홀더 220X311 (500매)", price: "220,000원" },
  { href: "/goods/goods_view/CDP5100/GDP5101", img: "/images/recom_con/recom7_20250701.jpg", badge: "디지털노트", name: "디지털노트 210X297 (2부)", price: "25,200원" },
  { href: "/goods/goods_view/CDP1900/GDP1901", img: "/images/recom_con/recom12_20260904.jpg", badge: "디지털색지명함", name: "디지털색지명함 90X50 (100매)", price: "5,500원" },
];

export type NewGood = { img: string; alt: string; lines: [string, string]; href: string };

export const newGoods: NewGood[] = [
  { img: "/uploads/banner/banner1776216901.jpg", alt: "adpiamall_7", lines: ["누르고 싶은 즐거움,", "LED 키캡 키링"], href: "https://www.adpiamall.com/board/notice/read/832?timer=88" },
  { img: "/uploads/banner/banner1776217128.jpg", alt: "adpiamall_3", lines: ["멀리서도 한눈에 보이는", "철제 입간판"], href: "https://www.adpiamall.com/estimate/goodsmain/RP1201?timer=199" },
  { img: "/uploads/banner/banner1776216849.jpg", alt: "adpiamall_6", lines: ["장소에 맞게 선택하는", "실내·실외 배너"], href: "https://www.adpiamall.com/board/notice/read/821" },
  { img: "/uploads/banner/banner1776217071.jpg", alt: "adpiamall_2", lines: ["투명하게 빛나는 나만의 굿즈,", "아크릴 키링"], href: "https://www.adpiamall.com/estimate/goods2019/667?timer=30" },
  { img: "/uploads/banner/banner1776216996.jpg", alt: "adpiamall_1", lines: ["매장 필수 홍보 아이템,", "포맥스 POP"], href: "https://www.adpiamall.com/estimate/goods2019/327?timer=45" },
  { img: "/uploads/banner/banner1776216764.jpg", alt: "애드피아몰3", lines: ["언제 어디서나 함께하는", "데일리 아이템, 텀블러"], href: "https://www.adpiamall.com/shop/main/tumbler1" },
  { img: "/uploads/banner/banner1776216805.jpg", alt: "adpiamall_4", lines: ["추억을 따뜻하게 담아내는", "원목 액자"], href: "https://www.adpiamall.com/estimate/goods2019/685?timer=47" },
  { img: "/uploads/banner/banner1776216957.jpg", alt: "adpiamall_5", lines: ["비 오는 날에도 로고가 빛나게,", "우산 · 양산"], href: "https://www.adpiamall.com/shop/main/umbrella?timer=21" },
];

export type SelfDesign = { img: string; alt: string; title: string; desc: string; href: string };

export const selfDesigns: SelfDesign[] = [
  { img: "/uploads/banner/banner1761721718.jpg", alt: "셀프디자인1번배너", title: "명함/포토카드", desc: "내가 만든 특별한 한장", href: "https://www.swadpia.co.kr/goods/template_list#tab1" },
  { img: "/uploads/banner/banner1776055777.jpg", alt: "셀프디자인배너2번", title: "청첩장", desc: "평생 기억될 우리만의 청첩장", href: "/goods/template_list/9/CDP2000#tab6" },
  { img: "/uploads/banner/banner1761700571.jpg", alt: "셀프디자인배너3번", title: "포스터", desc: "무드있는 벽꾸템", href: "https://www.adpiamall.com/template/main/0/0/1?timer=1" },
  { img: "/uploads/banner/banner1761700606.jpg", alt: "셀프디자인배너4번", title: "배너", desc: "요즘 배너 여기가 맛집", href: "https://www.adpiamall.com/template/main/0/0/1?timer=1" },
  { img: "/uploads/banner/banner1761700643.jpg", alt: "셀프디자인배너5번", title: "현수막", desc: "야외행사 필수템", href: "https://www.adpiamall.com/template/main/0/0/1?timer=1" },
];

export const footerLinks = [
  { text: "회사소개", href: "http://ir.swadpia.co.kr/", blank: true },
  { text: "이용약관", href: "/member/agreement" },
  { text: "개인정보처리방침", href: "/member/privacy_agreement" },
  { text: "오시는길", href: "/customer/location" },
  { text: "공지사항", href: "/board_index/index/board_notice" },
  { text: "FAQ", href: "/board_index/index/board_faq" },
  { text: "고객센터", href: "/customer" },
  { text: "채용공고", href: "https://www.jobkorea.co.kr/Search/?stext=%ec%84%b1%ec%9b%90%ec%95%a0%eb%93%9c%ed%94%bc%ec%95%84", blank: true },
];

export const footerAddresses = [
  "성수동 본사  :  서울시 성동구 성수일로80 (성수동2가 284-51) 성원Ⅱ빌딩",
  "충무로 매장  :  서울시 중구 퇴계로 41길 6 (충무로4가 112-1)  성원Ⅲ빌딩",
  "인현동 매장  :  서울 중구 마른내로 79    (인현동2가 151-1)  세운푸르지오헤리시티 1층",
  "성남 출고실  :  경기도 성남시 중원구 둔촌대로 457번길 26 (상대원동) 성원애드피아몰",
];

export const snsLinks = [
  { name: "kakao", href: "http://plus.kakao.com/home/@성원애드피아", icon: "/images/2025/img/sns_kakao.svg", iconOn: "/images/2025/img/sns_kakao_on.svg" },
  { name: "naver", href: "http://blog.naver.com/sw_adpia", icon: "/images/2025/img/sns_naver.svg", iconOn: "/images/2025/img/sns_naver_on.svg" },
  { name: "instagram", href: "https://www.instagram.com/swgroup_official/", icon: "/images/2025/img/sns_instagram.svg", iconOn: "/images/2025/img/sns_instagram_on.png" },
  { name: "youtube", href: "https://www.youtube.com/channel/UCcYm3zqcg12LF2NhQKVQDjA", icon: "/images/2025/img/sns_youtube.svg", iconOn: "/images/2025/img/sns_youtube_on.svg" },
  { name: "facebook", href: "https://www.facebook.com/swgroup.official", icon: "/images/2025/img/sns_facebook.svg", iconOn: "/images/2025/img/sns_facebook_on.svg" },
];

export const familySites = [
  { text: "성원애드피아", href: "http://www.swadpia.co.kr" },
  { text: "애드피아몰", href: "https://www.adpiamall.com/home" },
  { text: "성원애드피아 택배서비스", href: "http://www.pr5555.co.kr/parcel/" },
  { text: "스테이락호텔", href: "https://www.stayrak.com/" },
  { text: "성원푸드몰", href: "https://www.swfoodmall.com/home" },
];
