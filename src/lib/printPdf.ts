/**
 * 인쇄용 PDF 만들기 (브라우저 안에서 pdf-lib 로 생성, 서버 전송 없음)
 *
 * - 페이지 크기는 실제 mm 치수. TrimBox(재단 크기)와 BleedBox(도련 포함)를 PDF에 기록한다.
 * - 그림은 원본 그대로(RGB) 넣는다. CMYK 변환은 하지 않는다.
 * - 스티커 칼선은 벡터 선으로 넣고, 칼선만 있는 페이지를 한 장 더 붙인다.
 */

const PT = 72 / 25.4; // 1mm = 2.8346pt

export interface ImageFile {
  bytes: Uint8Array;
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
}

export type FitMode = "cover" | "contain";

export interface CardPdfInput {
  pages: ImageFile[];
  /** 재단 크기 (mm) */
  trim: { w: number; h: number };
  bleedMm: number;
  fit: FitMode;
  title: string;
}

/** 재단선 표시를 그릴 바깥 여유 (mm) */
const SLUG = 6;

/** 그림을 주어진 상자에 채우거나(cover) 맞출(contain) 때의 배치. 단위는 상자와 같다. */
export function placeImage(img: { width: number; height: number }, box: { w: number; h: number }, fit: FitMode) {
  const s = fit === "cover" ? Math.max(box.w / img.width, box.h / img.height) : Math.min(box.w / img.width, box.h / img.height);
  const w = img.width * s;
  const h = img.height * s;
  return {
    x: (box.w - w) / 2,
    y: (box.h - h) / 2,
    w,
    h,
    /** 상자 1단위당 원본 픽셀 수의 역수 → mm 상자라면 mm/px */
    unitPerPx: s,
    /** cover 일 때 잘려 나가는 비율 (0~1) */
    cropX: Math.max(0, 1 - box.w / w),
    cropY: Math.max(0, 1 - box.h / h),
  };
}

export async function buildCardPdf(input: CardPdfInput): Promise<Uint8Array> {
  const { PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(input.title);
  doc.setCreator("창운 인쇄용 PDF 내보내기 (시연)");

  const { trim, bleedMm: bleed } = input;
  const pageW = (trim.w + (bleed + SLUG) * 2) * PT;
  const pageH = (trim.h + (bleed + SLUG) * 2) * PT;
  const bleedBox = { x: SLUG * PT, y: SLUG * PT, w: (trim.w + bleed * 2) * PT, h: (trim.h + bleed * 2) * PT };
  const trimBox = { x: (SLUG + bleed) * PT, y: (SLUG + bleed) * PT, w: trim.w * PT, h: trim.h * PT };

  for (const file of input.pages) {
    const page = doc.addPage([pageW, pageH]);
    page.setBleedBox(bleedBox.x, bleedBox.y, bleedBox.w, bleedBox.h);
    page.setTrimBox(trimBox.x, trimBox.y, trimBox.w, trimBox.h);

    const img = file.mime === "image/jpeg" ? await doc.embedJpg(file.bytes) : await doc.embedPng(file.bytes);
    // cover: 도련까지 채움 / contain: 재단선 안쪽에 전부 보이게
    const box = input.fit === "cover" ? bleedBox : trimBox;
    const pl = placeImage(file, box, input.fit);
    page.pushOperators(pushGraphicsState(), rectangle(bleedBox.x, bleedBox.y, bleedBox.w, bleedBox.h), clip(), endPath());
    page.drawImage(img, { x: box.x + pl.x, y: box.y + pl.y, width: pl.w, height: pl.h });
    page.pushOperators(popGraphicsState());

    // 재단선 표시 (도련 바깥쪽에만 그린다)
    const mark = 4 * PT;
    const gap = bleedBox.x - 1.5 * PT; // 표시 끝 위치: 도련에서 1.5mm 띄움
    const black = rgb(0, 0, 0);
    const xs = [trimBox.x, trimBox.x + trimBox.w];
    const ys = [trimBox.y, trimBox.y + trimBox.h];
    for (const x of xs) {
      page.drawLine({ start: { x, y: gap - mark + 1.5 * PT }, end: { x, y: gap }, thickness: 0.25, color: black });
      page.drawLine({ start: { x, y: pageH - gap }, end: { x, y: pageH - gap + mark - 1.5 * PT }, thickness: 0.25, color: black });
    }
    for (const y of ys) {
      page.drawLine({ start: { x: gap - mark + 1.5 * PT, y }, end: { x: gap, y }, thickness: 0.25, color: black });
      page.drawLine({ start: { x: pageW - gap, y }, end: { x: pageW - gap + mark - 1.5 * PT, y }, thickness: 0.25, color: black });
    }
  }
  return doc.save();
}

export interface StickerPdfInput {
  /** 배경을 지운 그림 */
  image: ImageFile;
  /** 그림이 놓이는 좌표계 크기 (칼선 좌표와 같은 단위) */
  frame: { w: number; h: number };
  /** 칼선 꼭짓점 (frame 좌표계) */
  points: [number, number][];
  /** frame 1단위 = 몇 mm */
  mmPerUnit: number;
  title: string;
}

export async function buildStickerPdf(input: StickerPdfInput): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(input.title);
  doc.setCreator("창운 인쇄용 PDF 내보내기 (시연)");

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of input.points) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const k = input.mmPerUnit * PT; // frame 단위 → pt
  const pad = 5 * PT; // 칼선 바깥 여유 5mm
  const pageW = (x1 - x0) * k + pad * 2;
  const pageH = (y1 - y0) * k + pad * 2;
  // frame 좌표(위에서 아래) → PDF 좌표(아래에서 위)
  const path = input.points.map(([x, y], i) => `${i ? "L" : "M"}${((x - x0) * k).toFixed(3)} ${((y - y0) * k).toFixed(3)}`).join(" ") + " Z";
  const magenta = rgb(0.9, 0, 0.49);
  const img = input.image.mime === "image/jpeg" ? await doc.embedJpg(input.image.bytes) : await doc.embedPng(input.image.bytes);

  for (const withArt of [true, false]) {
    const page = doc.addPage([pageW, pageH]);
    page.setTrimBox(pad, pad, pageW - pad * 2, pageH - pad * 2);
    if (withArt) {
      page.drawImage(img, {
        x: pad + (0 - x0) * k,
        y: pageH - pad - (input.frame.h - y0) * k,
        width: input.frame.w * k,
        height: input.frame.h * k,
      });
    }
    page.drawSvgPath(path, { x: pad, y: pageH - pad, borderColor: magenta, borderWidth: 0.25 });
  }
  return doc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/pdf") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
