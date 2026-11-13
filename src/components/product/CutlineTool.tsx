"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, ImagePlus, Scissors, X } from "lucide-react";
import type { Size } from "@/data/catalog";
import { fitToSize, makeCutline, subjectMask, toSvgPath, type Pixels } from "@/lib/cutline";
import { cn } from "@/lib/utils";

export interface Artwork {
  name: string;
  /** 장바구니 미리보기용 작은 PNG (data URL) */
  thumb: string;
  marginMm: number;
  dpi: number;
}

interface Source {
  name: string;
  /** 처리용으로 줄인 픽셀 */
  px: Pixels;
  /** 원본 대비 처리 해상도 비율 */
  scale: number;
  natW: number;
  natH: number;
}

const WORK = 420; // 처리용 최대 변 길이(px). 칼선 모양에는 충분하고 즉시 계산된다.

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** 파일 없이 바로 체험할 수 있는 예시 그림 (자체 제작) */
const SAMPLES = [
  {
    label: "캐릭터 · 단색 배경",
    name: "sample-character.png",
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#bfe6d6"/><path d="M250 330 L290 150 L420 270 Z M650 330 L610 150 L480 270 Z" fill="#f2a93b"/><ellipse cx="450" cy="480" rx="260" ry="230" fill="#f2a93b"/><ellipse cx="450" cy="540" rx="150" ry="120" fill="#fff3d6"/><circle cx="360" cy="430" r="28" fill="#2b1a02"/><circle cx="540" cy="430" r="28" fill="#2b1a02"/><path d="M420 520 Q450 560 480 520" stroke="#2b1a02" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="700" cy="250" r="46" fill="#e8553a"/></svg>`,
    ),
  },
  {
    label: "로고 · 투명 배경",
    name: "sample-logo.png",
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><path d="M300 90 l62 150 162 14 -124 106 38 158 -138 -84 -138 84 38 -158 -124 -106 162 -14z" fill="#0f5a43"/><rect x="560" y="230" width="360" height="70" rx="35" fill="#0f5a43"/><rect x="560" y="340" width="250" height="56" rx="28" fill="#f2a93b"/></svg>`,
    ),
  },
  {
    label: "사진형 · 실패 예시",
    name: "sample-photo.jpg",
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27496d"/><stop offset=".5" stop-color="#e8793a"/><stop offset="1" stop-color="#f6e27a"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="640" cy="200" r="120" fill="#fff3c4" opacity=".8"/><path d="M0 600 L260 300 L420 460 L600 240 L900 600Z" fill="#1c2b3a" opacity=".85"/></svg>`,
    ),
  },
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("load"));
    im.src = url;
  });
}

async function toSource(url: string, name: string): Promise<Source> {
  const im = await loadImage(url);
  const natW = im.naturalWidth;
  const natH = im.naturalHeight;
  const scale = Math.min(1, WORK / Math.max(natW, natH));
  const w = Math.max(1, Math.round(natW * scale));
  const h = Math.max(1, Math.round(natH * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(im, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  return { name, px: { width: w, height: h, data: id.data }, scale, natW, natH };
}

/** 배경을 투명하게 지운 그림 (미리보기용) */
function cutoutUrl(px: Pixels, tolerance: number) {
  const sm = subjectMask(px, tolerance);
  const c = document.createElement("canvas");
  c.width = px.width;
  c.height = px.height;
  const ctx = c.getContext("2d")!;
  const id = ctx.createImageData(px.width, px.height);
  id.data.set(px.data);
  if (!("fail" in sm) && sm.mode === "color") {
    for (let i = 0; i < sm.mask.length; i++) if (!sm.mask[i]) id.data[i * 4 + 3] = 0;
  }
  ctx.putImageData(id, 0, 0);
  return c.toDataURL("image/png");
}

const FAIL_TEXT = {
  "busy-background": {
    title: "이 이미지는 모양 칼선을 딸 수 없어요",
    body: "배경이 한 가지 색이 아니에요(사진·그라데이션). 배경이 단색이거나 투명한 그림을 올리거나, 사각·원형 스티커로 주문해 주세요.",
  },
  "no-subject": {
    title: "그림을 찾지 못했어요",
    body: "배경과 그림의 색이 너무 비슷해요. ‘배경 제거 강도’를 낮추거나 다른 이미지를 올려 주세요.",
  },
} as const;

export function CutlineTool({ size, applied, onApply, onClear }: { size: Size; applied: Artwork | null; onApply: (a: Artwork) => void; onClear: () => void }) {
  const [src, setSrc] = useState<Source | null>(null);
  const [marginMm, setMarginMm] = useState(2);
  const [tolerance, setTolerance] = useState(32);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const open = async (url: string, name: string) => {
    try {
      setError(null);
      setSrc(await toSource(url, name));
      onClear();
    } catch {
      setError("이미지를 읽지 못했어요. PNG 또는 JPG 파일인지 확인해 주세요.");
    }
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setError("PNG, JPG, WEBP 이미지만 올릴 수 있어요.");
    if (f.size > 15 * 1024 * 1024) return setError("15MB 이하 이미지만 올릴 수 있어요.");
    const r = new FileReader();
    r.onload = () => open(String(r.result), f.name);
    r.onerror = () => setError("파일을 읽지 못했어요.");
    r.readAsDataURL(f);
  };

  const calc = useMemo(() => {
    if (!src) return null;
    // 1차: 그림 크기만 파악 → 규격에 맞춘 배율과 여백(px) 계산 → 2차: 실제 칼선
    const probe = makeCutline(src.px, { marginPx: 1, tolerance });
    if (!probe.ok) return { fail: probe.reason } as const;
    const fit = fitToSize(probe.subject, { w: size.w, h: size.h }, marginMm);
    const res = makeCutline(src.px, { marginPx: fit.marginPx, tolerance });
    if (!res.ok) return { fail: res.reason } as const;
    return { res, mmPerPx: fit.mmPerPx, dpi: fit.dpi * (1 / src.scale), cutout: cutoutUrl(src.px, tolerance) } as const;
  }, [src, tolerance, marginMm, size.w, size.h]);

  const ok = calc && !("fail" in calc) ? calc : null;
  const fail = calc && "fail" in calc && calc.fail ? FAIL_TEXT[calc.fail] : null;

  const view = ok
    ? (() => {
        const b = ok.res.bbox;
        const m = Math.max(b.w, b.h) * 0.08;
        return { x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2 };
      })()
    : null;
  const path = ok ? toSvgPath(ok.res.points) : "";
  const dpi = ok ? Math.round(ok.dpi) : 0;
  const quality = dpi >= 250 ? { t: "인쇄 해상도 충분", c: "text-brand", good: true } : dpi >= 150 ? { t: "해상도 보통 · 가까이서 보면 흐릴 수 있어요", c: "text-[#8a5a06]", good: false } : { t: "해상도 부족 · 더 큰 이미지를 권장해요", c: "text-danger", good: false };

  const apply = async () => {
    if (!ok || !src || !view) return;
    const T = 160;
    const c = document.createElement("canvas");
    c.width = c.height = T;
    const ctx = c.getContext("2d")!;
    const s = T / Math.max(view.w, view.h);
    ctx.translate((T - view.w * s) / 2 - view.x * s, (T - view.h * s) / 2 - view.y * s);
    ctx.scale(s, s);
    ctx.beginPath();
    ok.res.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.drawImage(await loadImage(ok.cutout), 0, 0, src.px.width, src.px.height);
    onApply({ name: src.name, thumb: c.toDataURL("image/png"), marginMm, dpi });
  };

  const download = () => {
    if (!ok) return;
    // 실제 mm 단위 SVG (칼선만). 일러스트레이터에서 열 수 있다.
    const b = ok.res.bbox;
    const k = ok.mmPerPx;
    const w = (b.w * k).toFixed(2);
    const h = (b.h * k).toFixed(2);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><path d="${toSvgPath(ok.res.points, k, -b.x, -b.y)}" fill="none" stroke="#e6007e" stroke-width="0.25"/></svg>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `${(src?.name ?? "sticker").replace(/\.[^.]+$/, "")}-cutline.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className="mb-6 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/40 p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Scissors size={18} className="text-brand" />
        <h3 className="text-base font-extrabold">내 그림으로 칼선 자동 생성</h3>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">NEW</span>
      </div>
      <p className="mb-4 text-sm text-mute">AI로 만든 캐릭터·로고 이미지를 올리면 모양을 따라 칼선을 만들어 드려요. 이미지는 서버로 전송되지 않고 이 브라우저 안에서만 처리돼요.</p>

      {!src ? (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            className={cn("flex w-full flex-col items-center gap-2 rounded-xl border-2 bg-white px-4 py-8 text-sm transition-colors", drag ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50")}
          >
            <ImagePlus size={28} className="text-brand" />
            <b>이미지를 끌어다 놓거나 눌러서 선택</b>
            <span className="text-xs text-mute">PNG · JPG · WEBP, 15MB 이하 · 배경이 단색이거나 투명한 그림이 잘 돼요</span>
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-mute">파일이 없다면 예시로 해보기:</span>
            {SAMPLES.map((s) => (
              <button key={s.name} type="button" onClick={() => open(s.url, s.name)} className="rounded-full border border-line bg-white px-3 py-1 font-semibold hover:border-brand hover:text-brand">
                {s.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(#eef1ef_0_25%,#fff_0_50%)] bg-[length:20px_20px]">
            {ok && view ? (
              <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="size-full" role="img" aria-label="칼선 미리보기">
                <path d={path} fill="#fff" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,.25))" }} />
                <image href={ok.cutout} x="0" y="0" width={src.px.width} height={src.px.height} />
                <path d={path} fill="none" stroke="#e6007e" strokeWidth={Math.max(view.w, view.h) / 220} strokeDasharray={`${view.w / 60} ${view.w / 90}`} />
              </svg>
            ) : (
              <div className="grid size-full place-items-center p-6 text-center text-sm text-mute">칼선을 만들 수 없는 이미지예요</div>
            )}
            <button type="button" aria-label="이미지 지우기" onClick={() => { setSrc(null); onClear(); }} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
              <X size={15} />
            </button>
          </div>

          <div className="min-w-0 text-sm">
            <p className="truncate font-bold">{src.name}</p>
            <p className="text-xs text-mute">원본 {src.natW}×{src.natH}px</p>

            {fail && (
              <div role="alert" className="mt-3 flex gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
                <div><p className="font-bold text-danger">{fail.title}</p><p className="mt-0.5 text-xs text-mute">{fail.body}</p></div>
              </div>
            )}

            {ok && (
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-brand" /> {ok.res.mode === "alpha" ? "투명 배경을 기준으로" : "단색 배경을 지우고"} 칼선을 만들었어요</li>
                <li className="flex items-center gap-1.5">
                  {quality.good ? <CheckCircle2 size={15} className="text-brand" /> : <AlertTriangle size={15} className={quality.c} />}
                  <span className={quality.c}>{size.name} 기준 약 {dpi}dpi · {quality.t}</span>
                </li>
                <li className="text-mute">완성 크기 약 {(ok.res.bbox.w * ok.mmPerPx).toFixed(0)}×{(ok.res.bbox.h * ok.mmPerPx).toFixed(0)}mm (선택한 사이즈 안에 맞춤)</li>
                {ok.res.pieces > 1 && (
                  <li className="flex items-start gap-1.5 text-[#8a5a06]"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> 떨어진 조각이 {ok.res.pieces}개 있어 가장 큰 조각만 칼선에 포함했어요. 여백을 늘리면 하나로 합쳐져요.</li>
                )}
              </ul>
            )}

            <label className="mt-4 block">
              <span className="flex justify-between text-xs font-semibold"><span>칼선 여백</span><span>{marginMm.toFixed(1)}mm</span></span>
              <input type="range" min={1} max={5} step={0.5} value={marginMm} onChange={(e) => { setMarginMm(Number(e.target.value)); onClear(); }} className="w-full accent-[#0f5a43]" />
            </label>
            <label className="mt-2 block">
              <span className="flex justify-between text-xs font-semibold"><span>배경 제거 강도 <span className="font-normal text-mute">(투명 배경 이미지는 영향 없음)</span></span><span>{tolerance}</span></span>
              <input type="range" min={8} max={90} step={2} value={tolerance} onChange={(e) => { setTolerance(Number(e.target.value)); onClear(); }} className="w-full accent-[#0f5a43]" />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!ok} onClick={apply} className={cn("h-10 rounded-lg px-4 text-sm font-bold text-white", applied ? "bg-brand-dark" : "bg-brand hover:bg-brand-dark", "disabled:bg-mute/40")}>
                {applied ? "✓ 칼선 적용됨" : "이 칼선으로 주문에 적용"}
              </button>
              <button type="button" disabled={!ok} onClick={download} className="flex h-10 items-center gap-1.5 rounded-lg border-2 border-line bg-white px-3 text-sm font-semibold hover:border-brand/50 disabled:opacity-50">
                <Download size={15} /> 칼선 SVG
              </button>
            </div>
            <p className="mt-2 text-[11px] text-mute">※ 시연용 자동 칼선입니다. 실제 제작 시에는 담당자가 칼선을 한 번 더 확인합니다.</p>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </section>
  );
}
