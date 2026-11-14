"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, ImagePlus, Printer, X } from "lucide-react";
import type { Size } from "@/data/catalog";
import { loadImage, readAsDataUrl, svgUrl, toImageFile, type LoadedImage } from "@/lib/imageFile";
import { buildCardPdf, downloadBytes, placeImage, type FitMode } from "@/lib/printPdf";
import { cn } from "@/lib/utils";
import type { Artwork } from "./CutlineTool";

type SideKey = "front" | "back";

const FRONT_ART = `<rect width="1200" height="700" fill="#0f3d2e"/><circle cx="1040" cy="120" r="260" fill="#f2a93b" opacity=".9"/><circle cx="170" cy="640" r="220" fill="#1f7a5c"/><rect x="150" y="250" width="420" height="46" rx="23" fill="#fff"/><rect x="150" y="330" width="280" height="30" rx="15" fill="#fff" opacity=".6"/><rect x="150" y="390" width="340" height="30" rx="15" fill="#fff" opacity=".6"/>`;
const BACK_ART = `<rect width="1200" height="700" fill="#f6f1e6"/><path d="M520 470 L600 250 L680 470" fill="none" stroke="#0f3d2e" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><circle cx="600" cy="462" r="26" fill="#f2a93b"/>`;

/**
 * 파일 없이 체험할 수 있는 예시 (자체 제작).
 * 선택한 규격과 같은 비율로, "충분" 판정이 나오는 픽셀 수에 맞춰 그린다. 작은 예시는 그 1/3 크기.
 */
function samples(full: { w: number; h: number }, goodDpi: number): { label: string; name: string; side: SideKey; url: string }[] {
  const pxW = Math.min(3600, Math.round((full.w / 25.4) * goodDpi * 1.25));
  const pxH = Math.round((pxW * full.h) / full.w);
  const art = (w: number, h: number, body: string) =>
    svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">${body}</svg>`);
  const sq = Math.max(pxW, pxH);
  return [
    { label: "앞면 예시", name: "sample-front.png", side: "front", url: art(pxW, pxH, FRONT_ART) },
    { label: "뒷면 예시", name: "sample-back.png", side: "back", url: art(pxW, pxH, BACK_ART) },
    { label: "작은 이미지 · 해상도 부족 예시", name: "sample-small.png", side: "front", url: art(Math.round(pxW / 3.5), Math.round(pxH / 3.5), FRONT_ART) },
    { label: "정사각 이미지 · 잘림 예시", name: "sample-square.png", side: "front", url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${sq}" height="${sq}" viewBox="0 0 1100 1100"><rect width="1100" height="1100" fill="#2a6f97"/><circle cx="550" cy="550" r="420" fill="#f2a93b"/><rect x="250" y="60" width="600" height="60" rx="30" fill="#fff"/><rect x="250" y="980" width="600" height="60" rx="30" fill="#fff"/></svg>`) },
  ];
}

export function PrintFileTool({
  size, double, bleedMm, safeMm, dpi: [goodDpi, okDpi] = [250, 150], scale = 1, productName, applied, onApply, onClear,
}: {
  size: Size; double: boolean; bleedMm: number; safeMm: number; dpi?: [number, number]; scale?: number; productName: string;
  applied: Artwork | null; onApply: (a: Artwork) => void; onClear: () => void;
}) {
  const [imgs, setImgs] = useState<Partial<Record<SideKey, LoadedImage>>>({});
  const [fit, setFit] = useState<FitMode>("cover");
  const [portrait, setPortrait] = useState(size.h > size.w);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<SideKey>("front");

  // 규격의 긴 변을 가로로 두면 가로형, 세로로 두면 세로형
  const long = Math.max(size.w, size.h);
  const short = Math.min(size.w, size.h);
  const trim = portrait ? { w: short, h: long } : { w: long, h: short };
  const full = { w: trim.w + bleedMm * 2, h: trim.h + bleedMm * 2 };
  const sides: SideKey[] = double ? ["front", "back"] : ["front"];

  const put = async (side: SideKey, url: string, name: string) => {
    try {
      setError(null);
      const li = await toImageFile(url, name);
      // 첫 이미지의 방향에 맞춰 가로형/세로형을 자동 선택
      if (side === "front" && size.w !== size.h) setPortrait(li.file.height > li.file.width * 1.1 ? true : li.file.width > li.file.height * 1.1 ? false : portrait);
      setImgs((p) => ({ ...p, [side]: li }));
      onClear();
    } catch {
      setError("이미지를 읽지 못했어요. PNG 또는 JPG 파일인지 확인해 주세요.");
    }
  };

  const onFile = async (side: SideKey, f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setError("PNG, JPG, WEBP 이미지만 올릴 수 있어요.");
    if (f.size > 20 * 1024 * 1024) return setError("20MB 이하 이미지만 올릴 수 있어요.");
    try {
      await put(side, await readAsDataUrl(f), f.name);
    } catch {
      setError("파일을 읽지 못했어요.");
    }
  };

  const check = (li: LoadedImage) => {
    const pl = placeImage(li.file, fit === "cover" ? full : trim, fit);
    const dpi = Math.round(25.4 / pl.unitPerPx);
    const crop = Math.round(Math.max(pl.cropX, pl.cropY) * 100);
    return { dpi, crop, cropAxis: pl.cropX > pl.cropY ? "좌우" : "위아래" };
  };

  const ready = sides.filter((s) => imgs[s]);
  const front = imgs.front;

  const makePdf = async () => {
    if (!ready.length) return;
    setBusy(true);
    try {
      const bytes = await buildCardPdf({
        pages: ready.map((s) => imgs[s]!.file),
        trim: { w: trim.w * scale, h: trim.h * scale },
        bleedMm: bleedMm * scale,
        fit,
        title: `${productName} ${trim.w}×${trim.h}mm${scale !== 1 ? ` (1/${Math.round(1 / scale)} 축소)` : ""}`,
      });
      downloadBytes(bytes, `${(front ?? imgs.back!).name.replace(/\.[^.]+$/, "")}-print.pdf`);
    } catch {
      setError("PDF를 만들지 못했어요. 다른 이미지로 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    const first = imgs[ready[0]];
    if (!first) return;
    const T = 160;
    const c = document.createElement("canvas");
    c.width = T;
    c.height = Math.round((T * full.h) / full.w);
    const pl = placeImage(first.file, { w: c.width, h: c.height }, "cover");
    c.getContext("2d")!.drawImage(await loadImage(first.url), pl.x, pl.y, pl.w, pl.h);
    onApply({ name: first.name, thumb: c.toDataURL("image/png"), label: `인쇄 파일: ${ready.map((s) => imgs[s]!.name).join(", ")} (${ready.length}면, 인쇄용 PDF 확인)` });
  };

  const pct = (mm: number, of: number) => `${(mm / of) * 100}%`;

  return (
    <section className="mb-6 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/40 p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Printer size={18} className="text-brand" />
        <h3 className="text-base font-extrabold">내 이미지로 인쇄용 PDF 만들기</h3>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">NEW</span>
      </div>
      <p className="mb-4 text-sm text-mute">AI로 만든 JPG·PNG 시안을 올리면 {scale === 1 ? "실제 크기" : `1/${Math.round(1 / scale)} 축소 크기`}({trim.w}×{trim.h}mm 기준)에 재단 여백 {bleedMm}mm와 재단선을 넣은 PDF로 바꿔 드려요.{goodDpi < 250 && ` 멀리서 보는 대형 출력물이라 ${goodDpi}dpi 이상이면 충분해요.`} 이미지는 서버로 전송되지 않고 이 브라우저 안에서만 처리돼요.</p>

      <div className={cn("grid gap-4", double && "sm:grid-cols-2")}>
        {sides.map((side) => {
          const li = imgs[side];
          const c = li ? check(li) : null;
          const q = !c ? null : c.dpi >= goodDpi ? { t: "인쇄 해상도 충분", ok: true, cls: "text-brand" } : c.dpi >= okDpi ? { t: "해상도 보통 · 작은 글씨가 흐릴 수 있어요", ok: false, cls: "text-[#8a5a06]" } : { t: "해상도 부족 · 더 큰 이미지를 권장해요", ok: false, cls: "text-danger" };
          return (
            <div key={side}>
              <p className="mb-1.5 text-xs font-bold text-mute">{side === "front" ? "앞면" : "뒷면"}</p>
              {li ? (
                <>
                  <div className="relative mx-auto overflow-hidden rounded-md bg-white shadow ring-1 ring-line" style={{ aspectRatio: `${full.w} / ${full.h}`, maxWidth: portrait ? 220 : 380 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 data URL 미리보기 */}
                    <img
                      src={li.url}
                      alt={`${side === "front" ? "앞면" : "뒷면"} 미리보기`}
                      className={cn("absolute", fit === "cover" ? "inset-0 size-full object-cover" : "object-contain")}
                      style={fit === "contain" ? { left: pct(bleedMm, full.w), top: pct(bleedMm, full.h), width: pct(trim.w, full.w), height: pct(trim.h, full.h) } : undefined}
                    />
                    <div className="pointer-events-none absolute border border-[#e6007e]" style={{ left: pct(bleedMm, full.w), right: pct(bleedMm, full.w), top: pct(bleedMm, full.h), bottom: pct(bleedMm, full.h) }} />
                    <div className="pointer-events-none absolute border border-dashed border-[#00a060]" style={{ left: pct(bleedMm + safeMm, full.w), right: pct(bleedMm + safeMm, full.w), top: pct(bleedMm + safeMm, full.h), bottom: pct(bleedMm + safeMm, full.h) }} />
                    <button type="button" aria-label={`${side === "front" ? "앞면" : "뒷면"} 이미지 지우기`} onClick={() => { setImgs((p) => ({ ...p, [side]: undefined })); onClear(); }} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
                      <X size={13} />
                    </button>
                  </div>
                  <p className="mt-2 truncate text-[13px] font-bold">{li.name} <span className="font-normal text-mute">· {li.file.width}×{li.file.height}px</span></p>
                  {c && q && (
                    <ul className="mt-1 space-y-1 text-[13px]">
                      <li className={cn("flex items-start gap-1.5", q.cls)}>{q.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}약 {c.dpi}dpi · {q.t}</li>
                      {fit === "cover" && c.crop >= 4 && (
                        <li className="flex items-start gap-1.5 text-[#8a5a06]"><AlertTriangle size={15} className="mt-0.5 shrink-0" />이미지 비율이 달라 {c.cropAxis}가 약 {c.crop}% 잘려요. ‘전체 보이게 맞춤’을 써 보세요.</li>
                      )}
                      {fit === "contain" && <li className="text-mute">재단선 안쪽에 전체가 보이게 넣었어요. 남는 부분은 흰색이에요.</li>}
                    </ul>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { target.current = side; input.current?.click(); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onFile(side, e.dataTransfer.files[0]); }}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-line bg-white px-4 py-7 text-sm hover:border-brand/50"
                >
                  <ImagePlus size={24} className="text-brand" />
                  <b>{side === "front" ? "앞면" : "뒷면"} 이미지 올리기</b>
                  <span className="text-xs text-mute">PNG · JPG · WEBP, 20MB 이하</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-mute">파일이 없다면 예시로 해보기:</span>
        {samples(full, goodDpi).filter((s) => double || s.side === "front").map((s) => (
          <button key={s.name} type="button" onClick={() => put(s.side, s.url, s.name)} className="rounded-full border border-line bg-white px-3 py-1 font-semibold hover:border-brand hover:text-brand">
            {s.label}
          </button>
        ))}
      </div>

      {ready.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <div className="inline-flex rounded-lg border-2 border-line bg-white p-0.5">
              {([["cover", "가득 채우기"], ["contain", "전체 보이게 맞춤"]] as const).map(([v, t]) => (
                <button key={v} type="button" aria-pressed={fit === v} onClick={() => { setFit(v); onClear(); }} className={cn("rounded-md px-3 py-1.5 font-semibold", fit === v ? "bg-brand text-white" : "hover:bg-brand-soft")}>{t}</button>
              ))}
            </div>
            {size.w !== size.h && (
              <div className="inline-flex rounded-lg border-2 border-line bg-white p-0.5">
                {([[false, "가로형"], [true, "세로형"]] as const).map(([v, t]) => (
                  <button key={t} type="button" aria-pressed={portrait === v} onClick={() => { setPortrait(v); onClear(); }} className={cn("rounded-md px-3 py-1.5 font-semibold", portrait === v ? "bg-brand text-white" : "hover:bg-brand-soft")}>{t}</button>
                ))}
              </div>
            )}
            <span className="flex items-center gap-3 text-xs text-mute">
              <span className="flex items-center gap-1"><i className="inline-block h-0 w-5 border-t-2 border-[#e6007e]" />재단선</span>
              <span className="flex items-center gap-1"><i className="inline-block h-0 w-5 border-t-2 border-dashed border-[#00a060]" />안전 영역(글자는 이 안에)</span>
            </span>
          </div>
          {double && ready.length === 1 && <p className="mt-2 text-xs text-[#8a5a06]">양면 인쇄를 선택했어요. 한 면만 올리면 PDF에도 한 면만 들어가요.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={makePdf} className="flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              <FileDown size={16} /> {busy ? "만드는 중…" : "인쇄용 PDF 내려받기"}
            </button>
            <button type="button" onClick={apply} className={cn("h-10 rounded-lg border-2 px-4 text-sm font-bold", applied ? "border-brand-dark bg-brand-dark text-white" : "border-brand bg-white text-brand hover:bg-brand-soft")}>
              {applied ? "✓ 주문에 적용됨" : "이 파일로 주문에 적용"}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-mute">※ PDF는 재단 크기 {trim.w}×{trim.h}mm, 도련 {bleedMm}mm, 재단선 표시 포함입니다.{scale !== 1 && ` 실제 크기 PDF는 너무 커서 1/${Math.round(1 / scale)}로 줄여 만들어요(화질은 원본 그대로).`} 그림은 원본 화질·RGB 색상 그대로 들어가며 CMYK 변환은 하지 않습니다. 접수 가능 여부는 인쇄소 기준에 따라 달라질 수 있어요.</p>
        </>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { onFile(target.current, e.target.files?.[0]); e.target.value = ""; }} />
    </section>
  );
}
