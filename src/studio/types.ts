/** CARD STUDIO — 명함 디자인 데이터 구조. 모든 좌표는 재단 크기(90×50mm) 기준 mm, 글자 크기는 pt. */

export const CARD = { w: 90, h: 50, bleed: 3, safe: 3 } as const;
export const PT_MM = 25.4 / 72; // 1pt = 0.3528mm

export type Field = "name" | "title" | "company" | "specialty" | "phone" | "email" | "website" | "address" | "sns";
export type Weight = 300 | 400 | 600 | 800;
export type Align = "left" | "center" | "right";

export interface Asset {
  name: string;
  /** data URL */
  url: string;
  w: number;
  h: number;
}

export interface CardInfo {
  name: string;
  title: string;
  company: string;
  specialty: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  sns: string;
  qrUrl: string;
  logo: Asset | null;
  photo: Asset | null;
  industry: string;
  mood: string;
  color: string;
}

interface Base {
  id: string;
  /** 레이어 목록에 보여줄 이름 */
  label?: string;
}

export interface TextEl extends Base {
  type: "text";
  /** 정렬 기준점 x, 글자 기준선 y */
  x: number;
  y: number;
  size: number;
  weight: Weight;
  color: string;
  align: Align;
  /** 고객 정보와 연결된 글자. 정보가 바뀌면 이 객체만 갱신되고, 값이 비면 자동으로 숨는다 */
  bind?: Field;
  /** bind 가 없을 때의 고정 문구 */
  text?: string;
  prefix?: string;
  /** 자간 (em) */
  tracking?: number;
  upper?: boolean;
  /** 이 너비(mm)를 넘으면 글자 크기를 자동으로 줄인다 */
  maxW?: number;
  /** 연결된 정보의 첫 글자만 (모노그램) */
  initial?: boolean;
}

export interface RectEl extends Base {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  radius?: number;
  /** 값이 있으면 채우지 않고 테두리만 그린다 */
  stroke?: string;
  strokeWidth?: number;
}

export interface LineEl extends Base {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  width: number;
}

export interface CircleEl extends Base {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface PolyEl extends Base {
  type: "poly";
  points: [number, number][];
  fill: string;
}

export interface ImageEl extends Base {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  bind: "logo" | "photo";
  round?: boolean;
}

export interface QrEl extends Base {
  type: "qr";
  x: number;
  y: number;
  size: number;
  color: string;
}

export type El = TextEl | RectEl | LineEl | CircleEl | PolyEl | ImageEl | QrEl;

export interface Side {
  bg: string;
  elements: El[];
}

export interface Palette {
  id: string;
  name: string;
  /** 밝은 바탕 */
  paper: string;
  /** 밝은 바탕 위 글자 */
  ink: string;
  /** 보조 글자 */
  sub: string;
  /** 강조색 */
  accent: string;
  /** 어두운 바탕 */
  dark: string;
  /** 어두운 바탕 위 글자 */
  onDark: string;
}

export interface Design {
  id: string;
  templateId: string;
  templateName: string;
  concept: string;
  palette: Palette;
  front: Side;
  back: Side;
}

export type SideKey = "front" | "back";

export const emptyInfo: CardInfo = {
  name: "", title: "", company: "", specialty: "", phone: "", email: "", website: "", address: "", sns: "", qrUrl: "",
  logo: null, photo: null, industry: "general", mood: "any", color: "auto",
};

export const sampleInfo: CardInfo = {
  ...emptyInfo,
  name: "김창운", title: "대표 디자이너", company: "창운 스튜디오", specialty: "브랜드 · 인쇄 디자인",
  phone: "010-1234-5678", email: "hello@changun.kr", website: "www.changun.kr", address: "서울시 중구 세종대로 110, 3층", sns: "@changun.studio",
  qrUrl: "https://www.changun.kr",
};

export function resolveText(el: TextEl, info: CardInfo): string {
  const full = el.bind ? info[el.bind].trim() : (el.text ?? "");
  const raw = el.initial ? (Array.from(full.replace(/^\(?(주|유)\)?\s*|^주식회사\s*/, ""))[0] ?? "") : full;
  if (!raw) return "";
  const s = `${el.prefix ?? ""}${raw}`;
  return el.upper ? s.toUpperCase() : s;
}
