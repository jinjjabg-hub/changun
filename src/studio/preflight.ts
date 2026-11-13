import type { Paper } from "@/data/catalog";
import type { FontSet } from "./fonts";
import { boxOf, layoutText } from "./geometry";
import { qrPath } from "./qr";
import { CARD, PT_MM, type CardInfo, type Design, type SideKey } from "./types";

export type Level = "pass" | "warn" | "fail";

export interface Check {
  id: string;
  level: Level;
  title: string;
  detail: string;
  /** 문제가 있는 객체 (편집기에서 바로 선택할 수 있게) */
  target?: { side: SideKey; id: string };
}

const SIDE_NAME: Record<SideKey, string> = { front: "앞면", back: "뒷면" };

/** hex → 상대 휘도 (0~1) */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** 인쇄 전 자동 검사. 결과는 통과 / 경고 / 실패로 나눈다. */
export function preflight(design: Design, info: CardInfo, fonts: FontSet | null, paper?: Paper | null): Check[] {
  const out: Check[] = [];
  const S = CARD.safe;

  out.push({ id: "size", level: "pass", title: "문서 크기", detail: `재단 ${CARD.w}×${CARD.h}mm, 도련 포함 작업 크기 ${CARD.w + CARD.bleed * 2}×${CARD.h + CARD.bleed * 2}mm` });
  out.push({ id: "bleed", level: "pass", title: "도련", detail: `배경색이 사방 ${CARD.bleed}mm 도련까지 채워집니다` });

  if (!info.name.trim()) out.push({ id: "name", level: "fail", title: "이름 없음", detail: "이름이 비어 있어요. 정보 입력 단계에서 채워 주세요." });
  if (!fonts) out.push({ id: "fonts", level: "warn", title: "글꼴 불러오는 중", detail: "글꼴 파일을 아직 받지 못해 글자 폭을 어림값으로 검사했어요." });

  for (const key of ["front", "back"] as SideKey[]) {
    const side = design[key];
    const name = SIDE_NAME[key];
    let visible = 0;
    for (const el of side.elements) {
      const box = boxOf(el, info, fonts);
      if (!box) continue;
      visible++;
      const target = { side: key, id: el.id };
      const label = el.label ?? "객체";

      if (el.type === "text") {
        const t = layoutText(el, info, fonts);
        const outTrim = box.x < 0 || box.y < 0 || box.x + box.w > CARD.w || box.y + box.h > CARD.h;
        const outSafe = box.x < S || box.y < S || box.x + box.w > CARD.w - S || box.y + box.h > CARD.h - S;
        if (outTrim) out.push({ id: `cut-${el.id}`, level: "fail", title: `${name} 글자 잘림`, detail: `‘${t.text}’가 재단선 밖으로 나가 잘립니다.`, target });
        else if (outSafe) out.push({ id: `safe-${el.id}`, level: "warn", title: `${name} 안전 영역 벗어남`, detail: `‘${t.text}’가 재단선에서 ${S}mm 안쪽 영역을 벗어났어요. 재단 오차로 잘릴 수 있어요.`, target });

        const pt = t.sizeMm / PT_MM;
        if (pt < 4.5) out.push({ id: `tiny-${el.id}`, level: "fail", title: `${name} 글자가 너무 작음`, detail: `‘${t.text}’가 ${pt.toFixed(1)}pt 입니다. 4.5pt 미만은 인쇄하면 읽기 어렵습니다.`, target });
        else if (pt < 5.5) out.push({ id: `small-${el.id}`, level: "warn", title: `${name} 작은 글자`, detail: `‘${t.text}’가 ${pt.toFixed(1)}pt 입니다. 6pt 이상을 권장해요.`, target });
        if (el.maxW && t.width > el.maxW + 0.3) out.push({ id: `long-${el.id}`, level: "warn", title: `${name} 글자가 길어 넘침`, detail: `‘${t.text}’가 정해진 폭을 넘어 다른 요소와 겹칠 수 있어요.`, target });

        if (el.color !== "none" && contrast(el.color, side.bg) < 2 && !side.elements.some((o) => o !== el && (o.type === "rect" || o.type === "poly" || o.type === "circle"))) {
          out.push({ id: `contrast-${el.id}`, level: "warn", title: `${name} 글자와 배경 색이 비슷함`, detail: `‘${t.text}’의 색이 배경과 비슷해 잘 안 보일 수 있어요.`, target });
        }
      }

      if (el.type === "image") {
        const a = info[el.bind]!;
        const dpi = Math.round(Math.min(a.w / (el.w / 25.4), a.h / (el.h / 25.4)));
        if (dpi < 150) out.push({ id: `dpi-${el.id}`, level: "fail", title: `${name} ${label} 해상도 부족`, detail: `인쇄 크기 기준 약 ${dpi}dpi 입니다. 300dpi 이상을 권장하고, 150dpi 미만은 흐리게 나옵니다.`, target });
        else if (dpi < 300) out.push({ id: `dpi-${el.id}`, level: "warn", title: `${name} ${label} 해상도 보통`, detail: `인쇄 크기 기준 약 ${dpi}dpi 입니다. 300dpi 이상을 권장해요.`, target });
        out.push({ id: `rgb-${el.id}`, level: "warn", title: `${name} ${label}는 RGB`, detail: "사진·로고 이미지는 RGB 그대로 들어갑니다. 인쇄소에서 CMYK로 바꾸면서 색이 조금 달라질 수 있어요.", target });
      }

      if (el.type === "qr") {
        const q = qrPath(info.qrUrl);
        if (!q) out.push({ id: `qr-${el.id}`, level: "fail", title: `${name} QR 생성 실패`, detail: "QR에 넣을 주소가 너무 깁니다.", target });
        else {
          const cell = el.size / q.size;
          if (el.size < 12 || cell < 0.33) out.push({ id: `qrsize-${el.id}`, level: "warn", title: `${name} QR이 작음`, detail: `한 변 ${el.size.toFixed(1)}mm(칸당 ${cell.toFixed(2)}mm)입니다. 15mm 이상이어야 안정적으로 인식돼요.`, target });
          if (el.color !== "none" && contrast(el.color, side.bg) < 4) out.push({ id: `qrcontrast-${el.id}`, level: "warn", title: `${name} QR 대비 낮음`, detail: "QR 색과 배경의 명암 차이가 작아 인식이 안 될 수 있어요.", target });
          if (box.x < S || box.y < S || box.x + box.w > CARD.w - S || box.y + box.h > CARD.h - S) out.push({ id: `qrsafe-${el.id}`, level: "warn", title: `${name} QR이 가장자리에 가까움`, detail: "QR 주변에는 여백이 필요해요. 안전 영역 안쪽으로 옮겨 주세요.", target });
        }
      }
    }
    if (visible === 0) out.push({ id: `empty-${key}`, level: "warn", title: `${name}이 비어 있음`, detail: `${name}에 보이는 내용이 없어요. 단면 명함이라면 무시해도 됩니다.` });
  }

  if (paper) {
    const tex = paper.feel?.tex;
    const tone = paper.feel?.tone ?? "#ffffff";
    // 디자인에 쓰인 밝은 색 (흰색·아주 밝은 색)
    const colors = (["front", "back"] as SideKey[]).flatMap((k) => [design[k].bg, ...design[k].elements.flatMap((e) => ("color" in e ? [e.color] : "fill" in e ? [e.fill] : "stroke" in e && e.stroke ? [e.stroke] : []))]);
    const light = colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c) && luminance(c) > 0.75);
    if (luminance(tone) < 0.1) {
      out.push({ id: "paper-dark", level: "fail", title: `${paper.name}: 화이트 인쇄 전용`, detail: "검은 종이에는 일반 색 잉크가 거의 보이지 않아요. 이 디자인은 지금 색 그대로 인쇄할 수 없으니 다른 용지를 고르거나, 화이트 인쇄 전용 디자인을 따로 문의해 주세요." });
    } else if (tex === "kraft") {
      if (light.length) out.push({ id: "paper-kraft", level: "warn", title: `${paper.name}: 흰색·밝은 색이 표현 안 됨`, detail: `갈색 종이라 흰색과 밝은 색(${Array.from(new Set(light)).slice(0, 3).join(", ")})은 종이색으로 나와요. 어두운 색 위주로 바꾸는 것을 권장해요.` });
      else out.push({ id: "paper-kraft", level: "pass", title: `${paper.name}`, detail: "어두운 색 위주의 디자인이라 갈색 종이에서도 잘 보여요." });
    } else if (tex === "pearl" || tex === "metal") {
      out.push({ id: "paper-pearl", level: "warn", title: `${paper.name}: 펄 용지`, detail: "펄 때문에 색이 화면보다 살짝 뿌옇고 반짝이게 나와요. 작은 글씨는 굵게 쓰는 편이 좋아요." });
    } else if (paper.feel && paper.feel.rough >= 2) {
      const tiny = (["front", "back"] as SideKey[]).some((k) => design[k].elements.some((e) => e.type === "text" && e.weight === 300 && e.size < 7));
      out.push(tiny
        ? { id: "paper-rough", level: "warn", title: `${paper.name}: 결이 있는 용지`, detail: "종이 결 때문에 가늘고 작은 글자는 끊겨 보일 수 있어요. 7pt 미만의 가는 글자는 굵기를 올려 주세요." }
        : { id: "paper-rough", level: "pass", title: `${paper.name}`, detail: "결이 있는 용지지만 가늘고 작은 글자가 없어 괜찮아요." });
    } else {
      out.push({ id: "paper", level: "pass", title: `${paper.name}`, detail: "이 디자인에 무리 없는 용지예요." });
    }
  }

  out.push({ id: "text-outline", level: "pass", title: "글꼴", detail: "PDF의 글자는 모두 윤곽선(벡터 도형)으로 바뀌어 글꼴 누락이 생기지 않습니다" });
  out.push({ id: "color", level: "warn", title: "색상", detail: "글자와 도형은 CMYK 값으로 저장하지만, 화면색을 계산식으로 바꾼 값이라 실제 인쇄 색과 차이가 날 수 있어요. 실물 샘플로 확인해 주세요." });
  return out;
}

export const summarize = (checks: Check[]) => ({
  fail: checks.filter((c) => c.level === "fail").length,
  warn: checks.filter((c) => c.level === "warn").length,
  pass: checks.filter((c) => c.level === "pass").length,
});
