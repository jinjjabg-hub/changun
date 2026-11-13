/**
 * 창운 상품 · 옵션 · 가격 데이터 (단일 파일)
 *
 * ⚠ 모든 가격은 시연용 "샘플 가격"입니다. 실제 가격으로 교체하는 방법:
 *   1) 규칙 방식  : 각 상품의 baseUnit / paper.factor / size.factor / side.factor / tiers 값을 수정
 *   2) 가격표 방식: 상품에 `priceTable` 을 추가하면 규칙 계산 대신 우선 적용됩니다.
 *        priceTable: { "<paperId>:<sizeId>:<sideId|->": { 100: 4000, 200: 6500, ... } }
 *      표에 없는 수량은 규칙 계산으로 대체됩니다.
 * 옵션 사이의 의존 관계(용지 → 사이즈/후가공 등)도 이 파일에서만 정의합니다.
 */

export type ArtKind = "card" | "sticker" | "flyer" | "cloth" | "xbanner";

export interface Paper {
  id: string;
  name: string;
  desc: string;
  /** 단가 배수 */
  factor: number;
  /** 이 용지에서 선택 가능한 사이즈 id (생략 = 전체) */
  sizes?: string[];
  /** 이 용지에서 선택 가능한 후가공 id (생략 = 전체) */
  finishes?: string[];
  /** 이 용지에서 선택 가능한 면 id (생략 = 전체) */
  sides?: string[];
  /** 추가 출고일 */
  leadDays?: number;
  /** 전체 용지 목록에서 묶어 보여줄 분류 */
  group?: string;
  /** 접힌 상태에서도 먼저 보여줄 추천 용지 */
  recommended?: boolean;
}

export interface Size {
  id: string;
  name: string;
  /** 표시용 규격 (mm) */
  w: number;
  h: number;
  factor: number;
  shape?: "round" | "rect";
}

export interface Side {
  id: string;
  name: string;
  factor: number;
  /** 인쇄 면 수 (생략 = 1). 2면이면 뒷면 파일·디자인을 받는다 */
  faces?: 1 | 2;
  /** 이 용지에서만 선택 가능 (생략 = 전체) */
  papers?: string[];
}

/** 디자인 의뢰 항목 (가격은 샘플) */
export interface DesignOption {
  id: string;
  name: string;
  price: number;
}

export interface DesignMenu {
  /** 면별 디자인 종류 */
  types: DesignOption[];
  /** 면별 추가 편집 */
  edits: DesignOption[];
  /** 주문 전체에 붙는 옵션 */
  extras: DesignOption[];
  /** 디자인 의뢰 시 추가 출고일 */
  leadDays: number;
}

export type FinishMode = "flat" | "perUnit" | "percent";

export interface Finish {
  id: string;
  name: string;
  desc: string;
  mode: FinishMode;
  /** flat: 원 / perUnit: 원 × 수량 / percent: 인쇄비의 % */
  price: number;
  leadDays?: number;
  /** 같은 그룹 안에서는 하나만 선택 (선택 시 기존 선택 교체) */
  group?: string;
  /** 함께 선택할 수 없는 후가공 id */
  excludes?: string[];
  /** 가능한 사이즈 id (생략 = 전체) */
  sizes?: string[];
  minQty?: number;
  maxQty?: number;
}

export interface Tier {
  min: number;
  rate: number;
}

export interface Product {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  badge?: "BEST" | "NEW";
  tone: { bg: string; fg: string; accent: string };
  art: ArtKind;
  paperLabel: string;
  unit: string; // 수량 단위 (매, 장, 개 …)
  quantities: number[];
  /** 건수(디자인 종류) 선택 허용 */
  allowSets?: boolean;
  papers: Paper[];
  sizes: Size[];
  sides?: Side[];
  finishes: Finish[];
  /** 1 단위(매/장) 당 기본 단가 (원) */
  baseUnit: number;
  /** 수량 구간별 단가 배율. min 오름차순 */
  tiers: Tier[];
  /** 최소 인쇄 금액 */
  minPrint: number;
  /** 건당 판 제작/세팅비 */
  setupFee: number;
  /** 기본 출고 영업일 */
  baseLead: number;
  /** 수량이 min 이상이면 출고일 추가 */
  leadByQty?: { min: number; add: number }[];
  priceTable?: Record<string, Record<number, number>>;
  /** 사이즈 직접 입력 허용 범위 (mm). surcharge 는 비규격 재단 할증 배수 */
  customSize?: { minW: number; maxW: number; minH: number; maxH: number; surcharge: number };
  /** 디자인 의뢰 메뉴 */
  design?: DesignMenu;
  /** 이미지 업로드 → 칼선 자동 생성 도구 사용. 값은 함께 켜질 후가공 id */
  cutlineFinish?: string;
  /** 이미지 업로드 → 인쇄용 PDF 내보내기 도구 사용 (도련·안전 영역, mm) */
  printFile?: { bleedMm: number; safeMm: number };
  /** 상세 페이지 진입 시 기본 선택 */
  defaults?: { paper?: string; size?: string; qty?: number };
  highlights: string[];
  notes: string[];
}

export interface Category {
  id: string;
  name: string;
  blurb: string;
  items: { label: string; slug?: string; tag?: "BEST" | "NEW" }[];
}

/* ──────────────────────────── 명함 ──────────────────────────── */
const businessCard: Product = {
  slug: "business-card",
  name: "프리미엄 명함",
  category: "인쇄물",
  tagline: "첫인상을 결정하는 한 장",
  badge: "BEST",
  tone: { bg: "#e4efe9", fg: "#0f3d2e", accent: "#f2a93b" },
  art: "card",
  paperLabel: "용지",
  unit: "매",
  quantities: [100, 200, 300, 500, 1000, 2000],
  allowSets: true,
  papers: [
    // 일반지
    { id: "snow250", name: "스노우지 250g", desc: "매끈하고 선명한 기본 용지", factor: 1, group: "일반지", recommended: true },
    { id: "snow300", name: "스노우지 300g", desc: "기본 용지를 더 도톰하게", factor: 1.1, group: "일반지" },
    { id: "art250", name: "아트지 250g", desc: "광택이 있어 사진이 또렷해요", factor: 1, group: "일반지" },
    { id: "art300", name: "아트지 300g", desc: "두꺼운 유광 용지", factor: 1.1, group: "일반지" },
    { id: "mojo220", name: "모조지 220g", desc: "필기가 잘 되는 무광 용지", factor: 0.95, group: "일반지", finishes: ["round"] },
    // 고급지
    { id: "vannouveau260", name: "반누보 화이트 260g", desc: "도톰하고 은은한 무광 질감", factor: 1.5, group: "고급지", recommended: true, sizes: ["std", "slim"], leadDays: 1 },
    { id: "vannouveau320", name: "반누보 화이트 320g", desc: "묵직한 두께의 반누보", factor: 1.65, group: "고급지", sizes: ["std", "slim"], leadDays: 1 },
    { id: "arte230", name: "아르떼 울트라화이트 230g", desc: "부드러운 엠보 질감의 고급지", factor: 1.35, group: "고급지", recommended: true, finishes: ["emboss", "round", "foil-gold", "foil-silver"] },
    { id: "arte310", name: "아르떼 울트라화이트 310g", desc: "두꺼운 아르떼", factor: 1.55, group: "고급지", finishes: ["emboss", "round", "foil-gold", "foil-silver"] },
    { id: "rendezvous240", name: "랑데뷰 내추럴 240g", desc: "따뜻한 미색, 매끄러운 무광", factor: 1.45, group: "고급지" },
    { id: "montblanc240", name: "몽블랑 240g", desc: "밝은 백색에 잔잔한 결", factor: 1.4, group: "고급지" },
    // 질감·수입지
    { id: "linen216", name: "린넨커버 216g", desc: "천처럼 촘촘한 격자 무늬", factor: 1.6, group: "질감·수입지", finishes: ["emboss", "round", "foil-gold", "foil-silver"], leadDays: 1 },
    { id: "tintoretto300", name: "띤또레또 300g", desc: "수채화지 같은 거친 결", factor: 1.75, group: "질감·수입지", finishes: ["emboss", "round", "foil-gold", "foil-silver"], leadDays: 1 },
    { id: "marshmallow209", name: "매쉬멜로우 209g", desc: "아주 매끈하고 하얀 고급지", factor: 1.5, group: "질감·수입지", leadDays: 1 },
    { id: "extramatt350", name: "엑스트라매트 350g", desc: "빛 반사가 거의 없는 두꺼운 무광", factor: 1.8, group: "질감·수입지", sizes: ["std", "slim"], leadDays: 1 },
    { id: "stardream240", name: "스타드림 실버 240g", desc: "은은하게 반짝이는 펄지", factor: 1.7, group: "질감·수입지", finishes: ["round", "emboss"], leadDays: 1 },
    { id: "popset240", name: "팝셋 펄화이트 240g", desc: "고운 펄이 도는 백색지", factor: 1.7, group: "질감·수입지", finishes: ["round", "emboss"], leadDays: 1 },
    // 특수지
    { id: "kraft250", name: "크라프트 250g", desc: "자연스러운 갈색 재생지", factor: 1.25, group: "특수지", recommended: true, finishes: ["round"], sides: ["single", "double"] },
    { id: "black380", name: "매트블랙 380g", desc: "검은 종이 · 화이트 인쇄 전용", factor: 1.9, group: "특수지", sizes: ["std", "slim"], sides: ["single-white", "double-white"], finishes: ["round", "foil-gold", "foil-silver"], leadDays: 2 },
    { id: "yupo250", name: "유포지 250μ", desc: "찢어지지 않는 방수 합성지", factor: 1.7, group: "특수지", finishes: ["round"], sides: ["single", "double"], leadDays: 1 },
    { id: "duo400", name: "듀오 화이트 400g", desc: "두 장을 합지한 아주 두꺼운 용지", factor: 1.9, group: "특수지", sizes: ["std", "slim"], finishes: ["foil-gold", "foil-silver", "emboss"], leadDays: 2 },
    { id: "velvet350", name: "벨벳 화이트 350g", desc: "복숭아 껍질처럼 보드라운 촉감", factor: 1.75, group: "특수지", finishes: ["round", "foil-gold", "foil-silver"], leadDays: 1 },
  ],
  sizes: [
    { id: "std", name: "표준형", w: 90, h: 50, factor: 1 },
    { id: "slim", name: "슬림형", w: 86, h: 52, factor: 1.05 },
    { id: "square", name: "미니 정사각", w: 60, h: 60, factor: 1.1 },
  ],
  customSize: { minW: 40, maxW: 100, minH: 40, maxH: 100, surcharge: 1.2 },
  sides: [
    { id: "single", name: "단면 칼라", factor: 1 },
    { id: "double", name: "양면 칼라", factor: 1.4, faces: 2 },
    { id: "single-gold", name: "단면 칼라+금색", factor: 1.5 },
    { id: "double-gold", name: "양면 칼라+금색", factor: 2, faces: 2 },
    { id: "single-silver", name: "단면 칼라+은색", factor: 1.5 },
    { id: "double-silver", name: "양면 칼라+은색", factor: 2, faces: 2 },
    { id: "single-white", name: "단면 화이트 인쇄", factor: 1.3, papers: ["black380"] },
    { id: "double-white", name: "양면 화이트 인쇄", factor: 1.8, faces: 2, papers: ["black380"] },
  ],
  design: {
    types: [
      { id: "simple", name: "심플디자인", price: 15000 },
      { id: "standard", name: "일반디자인", price: 30000 },
      { id: "premium", name: "고급디자인", price: 50000 },
    ],
    edits: [
      { id: "text", name: "문구 수정", price: 3000 },
      { id: "image", name: "이미지 교체", price: 5000 },
      { id: "layout", name: "레이아웃 변경", price: 10000 },
    ],
    extras: [
      { id: "logo", name: "로고 제작", price: 40000 },
      { id: "rush", name: "급행 시안(당일)", price: 10000 },
      { id: "revision", name: "시안 추가 수정", price: 5000 },
    ],
    leadDays: 2,
  },
  finishes: [
    { id: "coat-matte", name: "무광 코팅", desc: "차분하고 스크래치에 강함", mode: "percent", price: 18, group: "coating", leadDays: 1 },
    { id: "coat-gloss", name: "유광 코팅", desc: "선명하고 반짝이는 표면", mode: "percent", price: 18, group: "coating", leadDays: 1 },
    { id: "uv", name: "부분 UV", desc: "로고·문구만 도톰하게 광택", mode: "flat", price: 12000, leadDays: 2, minQty: 200, excludes: ["emboss"] },
    { id: "foil-gold", name: "금박", desc: "금색 박 가공", mode: "flat", price: 18000, group: "foil", leadDays: 2, minQty: 200, maxQty: 1000, sizes: ["std", "slim"] },
    { id: "foil-silver", name: "은박", desc: "은색 박 가공", mode: "flat", price: 18000, group: "foil", leadDays: 2, minQty: 200, maxQty: 1000, sizes: ["std", "slim"] },
    { id: "emboss", name: "형압", desc: "눌러 찍어 입체감을 만듭니다", mode: "flat", price: 22000, leadDays: 2, excludes: ["uv", "coat-matte", "coat-gloss"], sizes: ["std", "slim"] },
    { id: "round", name: "귀도리", desc: "모서리를 둥글게 재단", mode: "perUnit", price: 6, leadDays: 1 },
  ],
  baseUnit: 40,
  tiers: [
    { min: 0, rate: 1 },
    { min: 200, rate: 0.75 },
    { min: 300, rate: 0.62 },
    { min: 500, rate: 0.5 },
    { min: 1000, rate: 0.38 },
    { min: 2000, rate: 0.32 },
  ],
  minPrint: 3000,
  setupFee: 0,
  baseLead: 2,
  leadByQty: [{ min: 1000, add: 1 }],
  printFile: { bleedMm: 3, safeMm: 3 },
  defaults: { qty: 200 },
  highlights: ["용지 22종", "후가공 7종", "디자인 의뢰 가능"],
  notes: ["건수(디자인 종류)는 같은 사양으로 내용만 다른 명함 수입니다.", "박·형압은 시안 확인 후 제작에 들어갑니다."],
};

/* ──────────────────────────── 스티커 ──────────────────────────── */
const sticker: Product = {
  slug: "sticker",
  name: "맞춤 스티커",
  category: "스티커·라벨",
  tagline: "원하는 모양대로 잘라드려요",
  badge: "NEW",
  tone: { bg: "#fbeed2", fg: "#5b3a05", accent: "#1f7a5c" },
  art: "sticker",
  paperLabel: "소재",
  unit: "개",
  quantities: [100, 200, 500, 1000, 2000, 5000],
  allowSets: true,
  papers: [
    { id: "art", name: "아트지 스티커", desc: "가장 보편적인 광택 소재", factor: 1 },
    { id: "mojo", name: "모조지 스티커", desc: "빛 반사가 적은 무광 소재", factor: 0.95 },
    {
      id: "pet",
      name: "투명 PET",
      desc: "배경이 비치는 투명 소재 (코팅 불필요)",
      factor: 1.6,
      sizes: ["r50", "r70", "s50", "r90x60"],
      finishes: ["white", "dmsong"],
      leadDays: 1,
    },
    {
      id: "yupo",
      name: "유포지(방수)",
      desc: "물과 오염에 강한 합성지",
      factor: 1.8,
      finishes: ["dmsong"],
      leadDays: 1,
    },
    {
      id: "kraft",
      name: "크라프트 스티커",
      desc: "내추럴한 갈색 소재",
      factor: 1.3,
      sizes: ["r50", "r70", "s50", "r90x60"],
      finishes: ["coat-matte", "dmsong"],
    },
  ],
  sizes: [
    { id: "r50", name: "원형 50mm", w: 50, h: 50, factor: 1, shape: "round" },
    { id: "r70", name: "원형 70mm", w: 70, h: 70, factor: 1.7, shape: "round" },
    { id: "s50", name: "사각 50×50mm", w: 50, h: 50, factor: 1.1, shape: "rect" },
    { id: "r90x60", name: "직사각 90×60mm", w: 90, h: 60, factor: 1.9, shape: "rect" },
    { id: "s100", name: "대형 100×100mm", w: 100, h: 100, factor: 3.2, shape: "rect" },
  ],
  finishes: [
    { id: "coat-matte", name: "무광 코팅", desc: "긁힘 방지, 차분한 질감", mode: "percent", price: 12, group: "coating", leadDays: 1 },
    { id: "coat-gloss", name: "유광 코팅", desc: "색감이 또렷해집니다", mode: "percent", price: 12, group: "coating", leadDays: 1 },
    { id: "dmsong", name: "도무송(모양 칼선)", desc: "원하는 모양으로 반칼 재단", mode: "flat", price: 15000, leadDays: 1 },
    { id: "white", name: "화이트 인쇄", desc: "투명 소재 위에 흰색 바탕 인쇄", mode: "percent", price: 35, leadDays: 1, excludes: ["coat-matte", "coat-gloss"] },
    { id: "holo", name: "홀로그램 박", desc: "무지개빛 반짝이는 박", mode: "flat", price: 25000, leadDays: 2, minQty: 500, excludes: ["coat-matte", "coat-gloss"] },
  ],
  baseUnit: 60,
  tiers: [
    { min: 0, rate: 1 },
    { min: 200, rate: 0.72 },
    { min: 500, rate: 0.5 },
    { min: 1000, rate: 0.36 },
    { min: 2000, rate: 0.28 },
    { min: 5000, rate: 0.22 },
  ],
  minPrint: 5000,
  setupFee: 3000,
  baseLead: 3,
  leadByQty: [{ min: 2000, add: 1 }],
  cutlineFinish: "dmsong",
  highlights: ["원형·사각·자유 모양", "방수 소재", "화이트 인쇄"],
  notes: ["도무송 칼선은 시안 확정 후 제작됩니다.", "투명 PET는 코팅 없이도 방수·내구성이 있습니다."],
};

/* ──────────────────────────── 전단 ──────────────────────────── */
const flyer: Product = {
  slug: "flyer",
  name: "전단·리플렛",
  category: "인쇄물",
  tagline: "가게 소식을 가득 담아 나눠주세요",
  badge: "BEST",
  tone: { bg: "#dfe9f5", fg: "#12325a", accent: "#e8793a" },
  art: "flyer",
  paperLabel: "용지",
  unit: "장",
  quantities: [500, 1000, 2000, 3000, 5000, 10000],
  allowSets: true,
  papers: [
    {
      id: "art90",
      name: "아트지 90g",
      desc: "가볍고 경제적인 전단 용지",
      factor: 0.8,
      finishes: ["miss"],
    },
    { id: "snow120", name: "스노우지 120g", desc: "가장 많이 쓰는 균형 잡힌 용지", factor: 1 },
    {
      id: "snow150",
      name: "스노우지 150g",
      desc: "도톰해서 리플렛에 적합",
      factor: 1.2,
    },
    {
      id: "rendezvous",
      name: "랑데뷰 190g",
      desc: "고급스러운 질감의 두꺼운 용지",
      factor: 1.6,
      sizes: ["a4", "a5", "a6", "b5"],
      leadDays: 1,
    },
  ],
  sizes: [
    { id: "a3", name: "A3 (297×420)", w: 297, h: 420, factor: 1.9 },
    { id: "a4", name: "A4 (210×297)", w: 210, h: 297, factor: 1 },
    { id: "b5", name: "B5 (182×257)", w: 182, h: 257, factor: 0.78 },
    { id: "a5", name: "A5 (148×210)", w: 148, h: 210, factor: 0.55 },
    { id: "a6", name: "A6 (105×148)", w: 105, h: 148, factor: 0.3 },
  ],
  sides: [
    { id: "single", name: "단면", factor: 1 },
    { id: "double", name: "양면", factor: 1.5 },
  ],
  finishes: [
    { id: "coat-matte", name: "무광 코팅", desc: "표면을 보호하고 고급스럽게", mode: "percent", price: 22, group: "coating", leadDays: 1, minQty: 500, maxQty: 3000 },
    { id: "fold2", name: "2단 접지", desc: "반으로 접어 리플렛으로", mode: "perUnit", price: 12, group: "fold", leadDays: 1, sizes: ["a3", "a4", "b5"] },
    { id: "fold3", name: "3단 접지", desc: "병풍/레터 3단 접지", mode: "perUnit", price: 16, group: "fold", leadDays: 1, sizes: ["a4"] },
    { id: "miss", name: "오시(접는 선)", desc: "접는 부분에 선을 눌러 갈라짐 방지", mode: "perUnit", price: 8, leadDays: 1, sizes: ["a3", "a4", "b5"] },
    { id: "perforation", name: "미싱(절취선)", desc: "쿠폰처럼 뜯는 점선", mode: "perUnit", price: 10, leadDays: 1, sizes: ["a4", "a5"] },
  ],
  baseUnit: 35,
  tiers: [
    { min: 0, rate: 1 },
    { min: 1000, rate: 0.7 },
    { min: 2000, rate: 0.55 },
    { min: 3000, rate: 0.48 },
    { min: 5000, rate: 0.42 },
    { min: 10000, rate: 0.35 },
  ],
  minPrint: 12000,
  setupFee: 5000,
  baseLead: 3,
  leadByQty: [{ min: 5000, add: 1 }],
  defaults: { paper: "snow120", size: "a4", qty: 1000 },
  highlights: ["A3~A6 규격", "접지·오시·미싱", "대량 할인"],
  notes: ["아트지 90g은 접지가 불가합니다.", "접지 가공은 A4 이하 규격에서 제공됩니다."],
};

/* ──────────────────────────── 현수막 ──────────────────────────── */
const cloth: Product = {
  slug: "banner-cloth",
  name: "실사 현수막",
  category: "현수막·배너",
  tagline: "행사, 개업, 홍보 — 크게 보여드립니다",
  tone: { bg: "#f6e1d6", fg: "#5a2410", accent: "#2a6f97" },
  art: "cloth",
  paperLabel: "원단",
  unit: "장",
  quantities: [1, 2, 3, 5, 10],
  papers: [
    { id: "cloth", name: "일반 현수막천", desc: "가장 많이 쓰는 기본 원단", factor: 1 },
    {
      id: "mesh",
      name: "메쉬(바람통과)",
      desc: "구멍 사이로 바람이 통하는 원단",
      factor: 1.3,
      finishes: ["eyelet4", "eyelet-all", "rope", "sew"],
      leadDays: 1,
    },
    {
      id: "gloss",
      name: "프리미엄 광택천",
      desc: "색이 진하고 선명한 고급 원단",
      factor: 1.5,
      finishes: ["eyelet4", "eyelet-all", "rope", "sew", "windhole"],
      leadDays: 1,
    },
    {
      id: "fabric",
      name: "패브릭(섬유)",
      desc: "실내용, 주름이 적은 직물",
      factor: 1.9,
      sizes: ["w300", "w500", "v90x180", "w400"],
      finishes: ["sew", "rope", "pole"],
      leadDays: 1,
    },
  ],
  sizes: [
    { id: "v90x180", name: "세로 0.9×1.8m", w: 900, h: 1800, factor: 1.62 },
    { id: "w300", name: "가로 3×0.9m", w: 3000, h: 900, factor: 2.7 },
    { id: "w400", name: "가로 4×0.9m", w: 4000, h: 900, factor: 3.6 },
    { id: "w500", name: "가로 5×0.9m", w: 5000, h: 900, factor: 4.5 },
    { id: "w600", name: "가로 6×1.2m", w: 6000, h: 1200, factor: 7.2 },
  ],
  finishes: [
    { id: "eyelet4", name: "아일렛 4구", desc: "네 모서리 고리", mode: "flat", price: 2000, group: "hang" },
    { id: "eyelet-all", name: "아일렛 전체(50cm 간격)", desc: "바람이 강한 외부용", mode: "flat", price: 5000, group: "hang", leadDays: 1 },
    { id: "rope", name: "로프 마감", desc: "상하단 로프 삽입 재봉", mode: "flat", price: 6000, group: "hang", leadDays: 1 },
    { id: "pole", name: "봉 삽입 포켓", desc: "봉을 끼우는 포켓 재봉", mode: "flat", price: 7000, group: "hang", leadDays: 1 },
    { id: "sew", name: "테두리 재봉", desc: "가장자리 풀림 방지", mode: "perUnit", price: 4000 },
    { id: "windhole", name: "바람구멍 가공", desc: "일반 원단용, 찢어짐 완화", mode: "flat", price: 4000, excludes: ["rope"] },
  ],
  baseUnit: 4200,
  tiers: [
    { min: 0, rate: 1 },
    { min: 3, rate: 0.94 },
    { min: 5, rate: 0.9 },
    { min: 10, rate: 0.84 },
  ],
  minPrint: 9000,
  setupFee: 0,
  baseLead: 2,
  leadByQty: [{ min: 10, add: 1 }],
  defaults: { size: "w300", qty: 1 },
  highlights: ["맞춤 규격", "방수·메쉬 원단", "고리·로프 마감"],
  notes: ["시안 확정 후 출력합니다.", "5m 이상 현수막은 수량과 관계없이 별도 포장비가 발생할 수 있습니다."],
};

/* ──────────────────────────── 배너 (X배너·롤업) ──────────────────────────── */
const xbanner: Product = {
  slug: "x-banner",
  name: "X배너·롤업 배너",
  category: "현수막·배너",
  tagline: "매장 입구를 책임지는 거치형 배너",
  badge: "NEW",
  tone: { bg: "#e8e3f4", fg: "#2d1f5e", accent: "#d9534f" },
  art: "xbanner",
  paperLabel: "출력 소재",
  unit: "개",
  quantities: [1, 2, 3, 5, 10, 20],
  papers: [
    { id: "pp", name: "PP 합지", desc: "가장 보편적인 출력 소재", factor: 1 },
    {
      id: "pvc",
      name: "방염 PVC",
      desc: "공공시설 규정에 맞는 방염 소재",
      factor: 1.35,
      leadDays: 1,
      sides: ["single"],
    },
    {
      id: "fabric",
      name: "패브릭",
      desc: "접어도 주름이 적은 직물",
      factor: 1.7,
      sizes: ["x60", "x80", "roll85"],
      finishes: ["bag", "stand-premium"],
      leadDays: 1,
    },
  ],
  sizes: [
    { id: "x60", name: "X배너 60×160cm", w: 600, h: 1600, factor: 1 },
    { id: "x80", name: "X배너 80×180cm", w: 800, h: 1800, factor: 1.4 },
    { id: "roll85", name: "롤업 85×200cm", w: 850, h: 2000, factor: 2.1 },
    { id: "roll100", name: "롤업 100×200cm", w: 1000, h: 2000, factor: 2.5 },
    { id: "roll150", name: "대형 롤업 150×200cm", w: 1500, h: 2000, factor: 3.6 },
  ],
  sides: [
    { id: "single", name: "단면 출력", factor: 1 },
    { id: "double", name: "양면 출력", factor: 1.7 },
  ],
  finishes: [
    { id: "stand-basic", name: "기본 거치대", desc: "알루미늄 일반형", mode: "perUnit", price: 6000, group: "stand" },
    { id: "stand-premium", name: "프리미엄 거치대", desc: "두껍고 안정적인 알루미늄", mode: "perUnit", price: 11000, group: "stand", sizes: ["x60", "x80", "roll85", "roll100"] },
    { id: "bag", name: "운반 가방", desc: "휴대용 가방 포함", mode: "perUnit", price: 3000 },
    { id: "lamination", name: "표면 라미네이팅", desc: "긁힘과 물튀김 방지", mode: "percent", price: 15, leadDays: 1 },
  ],
  baseUnit: 18000,
  tiers: [
    { min: 0, rate: 1 },
    { min: 3, rate: 0.93 },
    { min: 5, rate: 0.87 },
    { min: 10, rate: 0.8 },
    { min: 20, rate: 0.74 },
  ],
  minPrint: 15000,
  setupFee: 0,
  baseLead: 3,
  leadByQty: [{ min: 10, add: 1 }],
  defaults: { qty: 1 },
  highlights: ["X배너·롤업 5종", "양면 출력", "거치대·가방 옵션"],
  notes: ["거치대는 선택하지 않으면 출력물만 발송됩니다.", "대형 롤업은 화물로 별도 배송됩니다."],
};

export const products: Product[] = [businessCard, sticker, flyer, cloth, xbanner];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/** 메가메뉴 구성 — slug가 있는 항목만 실제 상품으로 이동 (나머지는 "준비중") */
export const categories: Category[] = [
  {
    id: "print",
    name: "인쇄물",
    blurb: "명함 · 전단 · 리플렛",
    items: [
      { label: "프리미엄 명함", slug: "business-card", tag: "BEST" },
      { label: "전단·리플렛", slug: "flyer", tag: "BEST" },
      { label: "봉투" },
      { label: "스티커 카드" },
      { label: "쿠폰·티켓" },
    ],
  },
  {
    id: "sticker",
    name: "스티커·라벨",
    blurb: "모양대로 자르는 스티커",
    items: [
      { label: "맞춤 스티커", slug: "sticker", tag: "NEW" },
      { label: "방수 라벨" },
      { label: "택배 스티커" },
      { label: "투명 스티커" },
    ],
  },
  {
    id: "banner",
    name: "현수막·배너",
    blurb: "행사·매장 홍보",
    items: [
      { label: "실사 현수막", slug: "banner-cloth" },
      { label: "X배너·롤업 배너", slug: "x-banner", tag: "NEW" },
      { label: "포스터" },
      { label: "현수막 거치대" },
    ],
  },
  {
    id: "promo",
    name: "판촉물",
    blurb: "굿즈 · 사은품",
    items: [
      { label: "에코백" },
      { label: "머그컵" },
      { label: "마우스패드" },
      { label: "볼펜·노트" },
    ],
  },
];

export const SHIPPING = {
  /** 이 금액 이상이면 무료 배송 (공급가 기준) */
  freeOver: 50000,
  fee: 3500,
  /** 당일 접수 마감 시각 (24h) */
  cutoffHour: 15,
};
