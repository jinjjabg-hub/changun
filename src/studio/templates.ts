import type { Align, CardInfo, El, Field, Palette, Side, TextEl, Weight } from "./types";

/**
 * 디자인 템플릿 12종 (자체 제작).
 * 각 템플릿은 고객 정보와 색 조합을 받아 앞면·뒷면의 벡터 객체 목록을 만든다.
 * 비어 있는 정보는 객체를 만들지 않으므로 빈 줄이 생기지 않는다.
 */

export interface TemplateCtx {
  info: CardInfo;
  pal: Palette;
}

export interface Template {
  id: string;
  name: string;
  /** 어울리는 업종 id */
  industries: string[];
  moods: string[];
  concept: string;
  build: (ctx: TemplateCtx) => { front: Side; back: Side };
}

type TextOpts = { size: number; weight?: Weight; color: string; align?: Align; tracking?: number; upper?: boolean; maxW?: number; prefix?: string; label?: string };

const LABELS: Record<Field, string> = {
  name: "이름", title: "직책", company: "회사명", specialty: "전문분야", phone: "전화번호", email: "이메일", website: "홈페이지", address: "주소", sns: "SNS",
};
const CONTACT: Field[] = ["phone", "email", "website", "address", "sns"];
const PREFIX: Partial<Record<Field, string>> = { phone: "T  ", email: "E  ", website: "W  ", address: "A  ", sns: "S  " };

class Builder {
  els: El[] = [];
  private n = 0;
  constructor(private side: string, readonly info: CardInfo) {}
  private id(kind: string) {
    return `${this.side}-${kind}-${++this.n}`;
  }
  has(f: Field) {
    return this.info[f].trim().length > 0;
  }
  /** 고객 정보와 연결된 글자. 값이 없으면 만들지 않는다 */
  field(f: Field, x: number, y: number, o: TextOpts) {
    if (!this.has(f)) return false;
    const el: TextEl = { id: this.id(f), type: "text", label: o.label ?? LABELS[f], bind: f, x, y, size: o.size, weight: o.weight ?? 400, color: o.color, align: o.align ?? "left" };
    if (o.tracking) el.tracking = o.tracking;
    if (o.upper) el.upper = true;
    if (o.maxW) el.maxW = o.maxW;
    if (o.prefix) el.prefix = o.prefix;
    this.els.push(el);
    return true;
  }
  text(text: string, x: number, y: number, o: TextOpts) {
    const el: TextEl = { id: this.id("text"), type: "text", label: o.label ?? text, text, x, y, size: o.size, weight: o.weight ?? 400, color: o.color, align: o.align ?? "left" };
    if (o.tracking) el.tracking = o.tracking;
    if (o.upper) el.upper = true;
    if (o.maxW) el.maxW = o.maxW;
    this.els.push(el);
  }
  rect(x: number, y: number, w: number, h: number, fill: string, extra: { radius?: number; stroke?: string; strokeWidth?: number; label?: string } = {}) {
    this.els.push({ id: this.id("rect"), type: "rect", label: extra.label ?? "사각형", x, y, w, h, fill, ...extra });
  }
  line(x1: number, y1: number, x2: number, y2: number, stroke: string, width = 0.3) {
    this.els.push({ id: this.id("line"), type: "line", label: "선", x1, y1, x2, y2, stroke, width });
  }
  circle(cx: number, cy: number, r: number, fill: string, extra: { stroke?: string; strokeWidth?: number } = {}) {
    this.els.push({ id: this.id("circle"), type: "circle", label: "원", cx, cy, r, fill, ...extra });
  }
  poly(points: [number, number][], fill: string) {
    this.els.push({ id: this.id("poly"), type: "poly", label: "도형", points, fill });
  }
  /** 연락처를 y 에서 아래로 쌓는다. 실제로 만든 줄 수를 돌려준다 */
  contacts(x: number, y: number, o: TextOpts & { gap?: number; labels?: boolean; fields?: Field[] }) {
    const gap = o.gap ?? 3.7;
    let i = 0;
    for (const f of o.fields ?? CONTACT) {
      if (this.field(f, x, y + i * gap, { ...o, prefix: o.labels ? PREFIX[f] : undefined })) i++;
    }
    return i;
  }
  /** 연락처의 마지막 줄이 bottom 에 오도록 위로 쌓는다 */
  contactsUp(x: number, bottom: number, o: TextOpts & { gap?: number; labels?: boolean; fields?: Field[] }) {
    const gap = o.gap ?? 3.7;
    const n = (o.fields ?? CONTACT).filter((f) => this.has(f)).length;
    this.contacts(x, bottom - (n - 1) * gap, o);
    return n;
  }
  /** 로고가 있으면 로고, 없으면 회사명 글자 */
  brand(x: number, y: number, o: TextOpts & { logoH?: number }) {
    const { logo } = this.info;
    if (logo) {
      const h = o.logoH ?? 9;
      const w = Math.min(34, (h * logo.w) / logo.h);
      const left = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x;
      this.els.push({ id: this.id("logo"), type: "image", label: "로고", bind: "logo", x: left, y: y - h * 0.8, w, h });
      return;
    }
    this.field("company", x, y, o);
  }
  photo(x: number, y: number, size: number, round = true) {
    if (!this.info.photo) return false;
    this.els.push({ id: this.id("photo"), type: "image", label: "인물 사진", bind: "photo", x, y, w: size, h: size, round });
    return true;
  }
  qr(x: number, y: number, size: number, color: string) {
    if (!this.info.qrUrl.trim()) return false;
    this.els.push({ id: this.id("qr"), type: "qr", label: "QR 코드", x, y, size, color });
    return true;
  }
}

/** 뒷면 공통 구성: 브랜드 + 한 줄 소개 + (있으면) QR */
function brandBack(b: Builder, fg: string, sub: string, accent: string, qrColor: string) {
  const hasQr = b.info.qrUrl.trim().length > 0;
  if (hasQr) {
    b.brand(9, 22, { size: 13, weight: 800, color: fg, maxW: 44, logoH: 11 });
    b.field("specialty", 9, 28.5, { size: 7, color: sub, maxW: 44 });
    b.line(9, 32.5, 19, 32.5, accent, 0.4);
    b.field("website", 9, 38, { size: 6.8, color: sub, maxW: 44 });
    b.qr(63, 15, 18, qrColor);
    b.text("SCAN ME", 72, 38, { size: 5, weight: 600, color: sub, align: "center", tracking: 0.2, label: "QR 안내 문구" });
  } else {
    b.brand(45, 24, { size: 14, weight: 800, color: fg, align: "center", maxW: 70, logoH: 12 });
    b.field("specialty", 45, 30.5, { size: 7, color: sub, align: "center", maxW: 70 });
    b.line(40, 34.5, 50, 34.5, accent, 0.4);
    b.field("website", 45, 40, { size: 6.8, color: sub, align: "center", maxW: 70 });
  }
}

const sides = (front: Builder, frontBg: string, back: Builder, backBg: string) => ({
  front: { bg: frontBg, elements: front.els },
  back: { bg: backBg, elements: back.els },
});

export const TEMPLATES: Template[] = [
  {
    id: "minimal", name: "미니멀", industries: ["professional", "general", "tech", "education"], moods: ["simple"],
    concept: "여백을 넓게 두고 이름 하나에 시선을 모았습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.brand(7, 11, { size: 8, weight: 600, color: pal.ink, maxW: 40, logoH: 7 });
      f.field("name", 7, 31, { size: 15, weight: 600, color: pal.ink, maxW: 40 });
      f.field("title", 7, 36.5, { size: 7.5, color: pal.sub, maxW: 40 });
      f.line(7, 40.5, 17, 40.5, pal.accent, 0.4);
      f.contactsUp(83, 43, { size: 6.6, color: pal.sub, align: "right", maxW: 36 });
      const b = new Builder("b", info);
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      return sides(f, pal.paper, b, pal.paper);
    },
  },
  {
    id: "premium", name: "프리미엄", industries: ["executive", "finance", "beauty", "professional"], moods: ["premium"],
    concept: "어두운 바탕에 금속성 강조색 한 줄로 무게감을 냈습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.rect(4.5, 4.5, 81, 41, "none", { stroke: pal.accent, strokeWidth: 0.25, label: "테두리" });
      f.field("name", 45, 21, { size: 15, weight: 600, color: pal.onDark, align: "center", tracking: 0.12, maxW: 66 });
      f.field("title", 45, 27, { size: 6.8, color: pal.accent, align: "center", tracking: 0.2, upper: true, maxW: 66 });
      f.line(41, 31, 49, 31, pal.accent, 0.3);
      f.contacts(45, 36, { size: 6.2, color: pal.onDark, align: "center", gap: 3.4, maxW: 66, fields: ["phone", "email", "website"] });
      const b = new Builder("b", info);
      b.rect(4.5, 4.5, 81, 41, "none", { stroke: pal.accent, strokeWidth: 0.25, label: "테두리" });
      brandBack(b, pal.onDark, pal.accent, pal.accent, pal.onDark);
      return sides(f, pal.dark, b, pal.dark);
    },
  },
  {
    id: "corporate", name: "모던 기업형", industries: ["corporate", "general", "construction", "global"], moods: ["simple", "bold"],
    concept: "왼쪽 색 띠로 회사를 먼저 보여 주고 정보를 정돈했습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.rect(-3, -3, 31, 56, pal.accent, { label: "색 띠" });
      f.brand(12.5, 27, { size: 9, weight: 800, color: "#ffffff", align: "center", maxW: 21, logoH: 9 });
      f.field("name", 34, 14.5, { size: 14, weight: 800, color: pal.ink, maxW: 49 });
      f.field("title", 34, 20, { size: 7.2, color: pal.accent, weight: 600, maxW: 49 });
      f.line(34, 23.5, 83, 23.5, pal.sub, 0.15);
      f.contacts(34, 29, { size: 6.6, color: pal.sub, labels: true, maxW: 49, gap: 3.6 });
      const b = new Builder("b", info);
      brandBack(b, "#ffffff", "#ffffff", "#ffffff", "#ffffff");
      return sides(f, pal.paper, b, pal.accent);
    },
  },
  {
    id: "creative", name: "크리에이티브", industries: ["creative", "beauty", "lifestyle", "education"], moods: ["bold"],
    concept: "큰 원과 굵은 글자로 한 번에 기억되게 했습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.circle(78, 6, 26, pal.accent);
      f.circle(70, 44, 6, pal.ink);
      f.field("name", 7, 17, { size: 20, weight: 800, color: pal.ink, maxW: 46 });
      f.field("title", 7, 23, { size: 7.5, weight: 600, color: pal.accent, maxW: 46 });
      f.contactsUp(7, 43.5, { size: 6.6, color: pal.sub, maxW: 52, gap: 3.6, fields: ["phone", "email", "website", "address"] });
      const b = new Builder("b", info);
      b.circle(8, 48, 20, pal.dark);
      b.circle(86, 2, 9, "#ffffff");
      brandBack(b, "#ffffff", "#ffffff", "#ffffff", "#ffffff");
      return sides(f, pal.paper, b, pal.accent);
    },
  },
  {
    id: "natural", name: "내추럴", industries: ["lifestyle", "beauty", "education", "general"], moods: ["warm", "simple"],
    concept: "가운데 정렬과 가는 글자로 차분하고 따뜻하게 구성했습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.circle(45, 11, 2.2, pal.accent);
      f.circle(41, 12.5, 1.3, pal.sub);
      f.circle(49, 12.5, 1.3, pal.sub);
      f.field("name", 45, 24, { size: 14, weight: 300, color: pal.ink, align: "center", tracking: 0.18, maxW: 70 });
      f.field("title", 45, 29.5, { size: 7, color: pal.sub, align: "center", maxW: 70 });
      f.line(42, 33, 48, 33, pal.accent, 0.3);
      f.contacts(45, 38, { size: 6.4, weight: 300, color: pal.ink, align: "center", gap: 3.5, maxW: 74, fields: ["phone", "email", "address"] });
      const b = new Builder("b", info);
      b.rect(5, 5, 80, 40, "none", { stroke: pal.accent, strokeWidth: 0.2, radius: 2, label: "테두리" });
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      return sides(f, pal.paper, b, pal.paper);
    },
  },
  {
    id: "medical", name: "메디컬", industries: ["medical", "education", "professional"], moods: ["simple", "warm"],
    concept: "십자 표시와 맑은 색으로 신뢰와 청결함을 전합니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.rect(-3, -3, 96, 14, pal.accent, { label: "상단 띠" });
      f.rect(8.2, 2.4, 1.6, 6.2, "#ffffff", { radius: 0.3, label: "십자 세로" });
      f.rect(5.9, 4.7, 6.2, 1.6, "#ffffff", { radius: 0.3, label: "십자 가로" });
      f.field("company", 15, 7.3, { size: 8.5, weight: 600, color: "#ffffff", maxW: 66 });
      const hasPhoto = f.photo(66, 16, 17);
      f.field("name", 7, 24, { size: 14.5, weight: 600, color: pal.ink, maxW: hasPhoto ? 54 : 76 });
      f.field("title", 7, 29.5, { size: 7.3, color: pal.accent, weight: 600, maxW: hasPhoto ? 54 : 76 });
      f.field("specialty", 7, 34, { size: 6.6, color: pal.sub, maxW: hasPhoto ? 54 : 76 });
      f.contactsUp(7, 44, { size: 6.4, color: pal.sub, labels: true, gap: 3.4, maxW: 76, fields: ["phone", "email", "address"] });
      const b = new Builder("b", info);
      b.rect(-3, 44, 96, 9, pal.accent, { label: "하단 띠" });
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      return sides(f, pal.paper, b, pal.paper);
    },
  },
  {
    id: "construction", name: "건설 · 부동산", industries: ["construction", "corporate", "global"], moods: ["bold"],
    concept: "사선 면 분할로 단단하고 역동적인 인상을 줍니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.poly([[-3, -3], [38, -3], [22, 53], [-3, 53]], pal.dark);
      f.poly([[38, -3], [42, -3], [26, 53], [22, 53]], pal.accent);
      f.brand(6, 14, { size: 9, weight: 800, color: pal.onDark, maxW: 22, logoH: 8 });
      f.field("specialty", 6, 44, { size: 5.6, color: pal.onDark, maxW: 15 });
      f.field("name", 84, 17, { size: 15, weight: 800, color: pal.ink, align: "right", maxW: 42 });
      f.field("title", 84, 22.5, { size: 7.2, weight: 600, color: pal.accent, align: "right", maxW: 42 });
      f.contactsUp(84, 43.5, { size: 6.5, color: pal.sub, align: "right", gap: 3.6, maxW: 46 });
      const b = new Builder("b", info);
      b.poly([[62, -3], [93, -3], [93, 53], [78, 53]], pal.accent);
      brandBack(b, pal.onDark, pal.onDark, pal.accent, pal.onDark);
      return sides(f, pal.paper, b, pal.dark);
    },
  },
  {
    id: "finance", name: "금융 · 법률", industries: ["finance", "professional", "executive"], moods: ["premium", "simple"],
    concept: "위아래 두 줄의 선과 가운데 정렬로 격식을 갖췄습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.line(7, 7.5, 83, 7.5, pal.accent, 0.5);
      f.line(7, 8.6, 83, 8.6, pal.accent, 0.15);
      f.line(7, 41.4, 83, 41.4, pal.accent, 0.15);
      f.line(7, 42.5, 83, 42.5, pal.accent, 0.5);
      f.brand(45, 15.5, { size: 7.5, weight: 600, color: pal.accent, align: "center", tracking: 0.15, upper: true, maxW: 70, logoH: 6 });
      f.field("name", 45, 25, { size: 14, weight: 600, color: pal.ink, align: "center", tracking: 0.1, maxW: 70 });
      f.field("title", 45, 30, { size: 7, color: pal.sub, align: "center", maxW: 70 });
      f.contacts(45, 35.5, { size: 6.1, color: pal.ink, align: "center", gap: 3.2, maxW: 74, fields: ["phone", "email"] });
      const b = new Builder("b", info);
      b.line(7, 7.5, 83, 7.5, pal.accent, 0.5);
      b.line(7, 42.5, 83, 42.5, pal.accent, 0.5);
      brandBack(b, pal.onDark, pal.onDark, pal.accent, pal.onDark);
      return sides(f, pal.paper, b, pal.dark);
    },
  },
  {
    id: "tech", name: "IT · 테크", industries: ["tech", "creative", "corporate"], moods: ["bold", "simple"],
    concept: "어두운 바탕과 점 격자로 기술 기업의 분위기를 냈습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) f.circle(66 + c * 4.2, 8 + r * 4.2, 0.45, pal.accent);
      f.rect(7, 9, 9, 1.4, pal.accent, { label: "강조 막대" });
      f.field("name", 7, 22, { size: 16, weight: 800, color: pal.onDark, maxW: 54 });
      f.field("title", 7, 27.5, { size: 7, color: pal.accent, tracking: 0.12, upper: true, maxW: 54 });
      f.contactsUp(7, 43.5, { size: 6.4, color: pal.onDark, labels: true, gap: 3.5, maxW: 60, fields: ["phone", "email", "website"] });
      f.field("company", 83, 43.5, { size: 6.4, weight: 600, color: pal.accent, align: "right", maxW: 24 });
      const b = new Builder("b", info);
      b.rect(-3, 47, 96, 6, pal.accent, { label: "하단 띠" });
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      return sides(f, pal.dark, b, pal.paper);
    },
  },
  {
    id: "beauty", name: "뷰티 · 패션", industries: ["beauty", "lifestyle", "creative"], moods: ["premium", "warm"],
    concept: "반으로 나눈 색면과 넓은 자간으로 세련되게 표현했습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.rect(45, -3, 48, 56, pal.accent, { label: "색면" });
      f.field("name", 22.5, 24, { size: 12, weight: 300, color: pal.ink, align: "center", tracking: 0.3, upper: true, maxW: 37 });
      f.line(19.5, 27.5, 25.5, 27.5, pal.accent, 0.3);
      f.field("title", 22.5, 32, { size: 6.2, color: pal.sub, align: "center", tracking: 0.15, maxW: 37 });
      f.brand(67.5, 14, { size: 7.5, weight: 600, color: "#ffffff", align: "center", tracking: 0.2, upper: true, maxW: 38, logoH: 7 });
      f.contactsUp(67.5, 42, { size: 6, color: "#ffffff", align: "center", gap: 3.4, maxW: 38, fields: ["phone", "email", "sns", "address"] });
      const b = new Builder("b", info);
      b.rect(-3, -3, 12, 56, pal.accent, { label: "색면" });
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      b.els.forEach((e) => { if (e.type === "text" && e.align === "left") e.x += 6; if (e.type === "line") { e.x1 += 6; e.x2 += 6; } if (e.type === "image") e.x += 6; });
      return sides(f, pal.paper, b, pal.paper);
    },
  },
  {
    id: "education", name: "교육 · 컨설팅", industries: ["education", "professional", "medical", "general"], moods: ["warm", "bold"],
    concept: "모서리 색면과 인물 사진 자리로 친근하고 믿음직하게 구성했습니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.poly([[-3, -3], [34, -3], [-3, 30]], pal.accent);
      f.circle(84, 46, 12, pal.accent);
      const hasPhoto = f.photo(8, 13, 20);
      const x = hasPhoto ? 34 : 30;
      f.field("name", x, 20, { size: 15, weight: 800, color: pal.ink, maxW: 83 - x });
      f.field("title", x, 25.5, { size: 7.2, weight: 600, color: pal.accent, maxW: 83 - x });
      f.field("specialty", x, 30, { size: 6.5, color: pal.sub, maxW: 83 - x });
      f.contactsUp(x, 43.5, { size: 6.4, color: pal.sub, gap: 3.4, maxW: 40, fields: ["phone", "email", "website"] });
      const b = new Builder("b", info);
      b.poly([[93, 53], [70, 53], [93, 34]], pal.accent);
      brandBack(b, pal.ink, pal.sub, pal.accent, pal.ink);
      return sides(f, pal.paper, b, pal.paper);
    },
  },
  {
    id: "global", name: "글로벌 비즈니스", industries: ["global", "corporate", "finance", "tech"], moods: ["simple", "premium"],
    concept: "지구본 선과 하단 띠로 해외 거래에 어울리는 인상을 줍니다.",
    build: ({ info, pal }) => {
      const f = new Builder("f", info);
      f.circle(74, 18, 11, "none", { stroke: pal.accent, strokeWidth: 0.25 });
      f.circle(74, 18, 5.5, "none", { stroke: pal.accent, strokeWidth: 0.2 });
      f.line(63, 18, 85, 18, pal.accent, 0.2);
      f.line(74, 7, 74, 29, pal.accent, 0.2);
      f.rect(-3, 40, 96, 13, pal.dark, { label: "하단 띠" });
      f.brand(7, 11, { size: 8, weight: 800, color: pal.accent, maxW: 50, logoH: 7 });
      f.field("name", 7, 23, { size: 15, weight: 600, color: pal.ink, maxW: 52 });
      f.field("title", 7, 28.5, { size: 7.2, color: pal.sub, maxW: 52 });
      f.field("phone", 7, 35, { size: 6.6, color: pal.ink, maxW: 40 });
      f.field("email", 7, 45.2, { size: 6.4, color: pal.onDark, maxW: 38 });
      f.field("website", 83, 45.2, { size: 6.4, weight: 600, color: pal.onDark, align: "right", maxW: 38 });
      const b = new Builder("b", info);
      b.circle(88, 52, 14, "none", { stroke: pal.accent, strokeWidth: 0.25 });
      b.circle(88, 52, 8, "none", { stroke: pal.accent, strokeWidth: 0.2 });
      brandBack(b, pal.onDark, pal.onDark, pal.accent, pal.onDark);
      return sides(f, pal.paper, b, pal.dark);
    },
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
