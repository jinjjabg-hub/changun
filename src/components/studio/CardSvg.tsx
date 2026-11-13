"use client";

import { cssFamily, type FontSet } from "@/studio/fonts";
import { boxOf, layoutText } from "@/studio/geometry";
import { qrPath } from "@/studio/qr";
import { CARD, type CardInfo, type El, type Side } from "@/studio/types";

interface Props {
  side: Side;
  info: CardInfo;
  fonts: FontSet | null;
  /** 도련까지 보여주고 재단선·안전 영역을 표시 */
  guides?: boolean;
  selectedId?: string | null;
  onElementPointerDown?: (el: El, e: React.PointerEvent) => void;
  onBackgroundPointerDown?: () => void;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  watermark?: boolean;
}

function Element({ el, info, fonts }: { el: El; info: CardInfo; fonts: FontSet | null }) {
  switch (el.type) {
    case "text": {
      const t = layoutText(el, info, fonts);
      if (!t.text) return null;
      return (
        <text x={t.left} y={el.y} fontFamily={cssFamily(el.font)} fontWeight={el.weight} fontSize={t.sizeMm} letterSpacing={el.tracking ? el.tracking * t.sizeMm : undefined} fill={el.color} style={{ whiteSpace: "pre" }}>
          {t.text}
        </text>
      );
    }
    case "rect":
      return el.stroke ? (
        <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.radius} fill="none" stroke={el.stroke} strokeWidth={el.strokeWidth ?? 0.25} />
      ) : (
        <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.radius} fill={el.fill} />
      );
    case "line":
      return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.stroke} strokeWidth={el.width} />;
    case "circle":
      return el.stroke ? (
        <circle cx={el.cx} cy={el.cy} r={el.r} fill="none" stroke={el.stroke} strokeWidth={el.strokeWidth ?? 0.25} />
      ) : (
        <circle cx={el.cx} cy={el.cy} r={el.r} fill={el.fill} />
      );
    case "poly":
      return <polygon points={el.points.map((p) => p.join(",")).join(" ")} fill={el.fill} />;
    case "image": {
      const a = info[el.bind];
      if (!a) return null;
      const clip = `clip-${el.id}`;
      return (
        <>
          <clipPath id={clip}>
            {el.round ? <ellipse cx={el.x + el.w / 2} cy={el.y + el.h / 2} rx={el.w / 2} ry={el.h / 2} /> : <rect x={el.x} y={el.y} width={el.w} height={el.h} />}
          </clipPath>
          <image href={a.url} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio={el.bind === "photo" ? "xMidYMid slice" : "xMidYMid meet"} clipPath={`url(#${clip})`} />
        </>
      );
    }
    case "qr": {
      const q = qrPath(info.qrUrl);
      if (!q) return null;
      const k = el.size / q.size;
      return <path d={q.path} fill={el.color} transform={`translate(${el.x} ${el.y}) scale(${k})`} />;
    }
  }
}

export function CardSvg({ side, info, fonts, guides, selectedId, onElementPointerDown, onBackgroundPointerDown, className, svgRef, watermark }: Props) {
  const B = CARD.bleed;
  const vb = guides ? `${-B} ${-B} ${CARD.w + B * 2} ${CARD.h + B * 2}` : `0 0 ${CARD.w} ${CARD.h}`;
  const sel = selectedId ? side.elements.find((e) => e.id === selectedId) : null;
  const selBox = sel ? boxOf(sel, info, fonts) : null;
  return (
    <svg ref={svgRef} viewBox={vb} className={className} role="img" aria-label="명함 미리보기" style={{ touchAction: onElementPointerDown ? "none" : undefined }}>
      <rect x={-B} y={-B} width={CARD.w + B * 2} height={CARD.h + B * 2} fill={side.bg} onPointerDown={onBackgroundPointerDown} />
      {side.elements.map((el) => (
        <g key={el.id} onPointerDown={onElementPointerDown ? (e) => onElementPointerDown(el, e) : undefined} style={onElementPointerDown ? { cursor: "move" } : undefined}>
          {/* 가는 선·작은 글자도 쉽게 잡히도록 투명한 손잡이 영역을 둔다 */}
          {onElementPointerDown && (() => { const b = boxOf(el, info, fonts); return b ? <rect x={b.x - 0.6} y={b.y - 0.6} width={b.w + 1.2} height={b.h + 1.2} fill="transparent" /> : null; })()}
          <Element el={el} info={info} fonts={fonts} />
        </g>
      ))}
      {watermark && (
        <text x={CARD.w / 2} y={CARD.h / 2 + 3} textAnchor="middle" fontSize={9} fontWeight={800} fill="#000" opacity={0.07} transform={`rotate(-20 ${CARD.w / 2} ${CARD.h / 2})`} pointerEvents="none">PREVIEW</text>
      )}
      {guides && (
        <g pointerEvents="none">
          <rect x={0} y={0} width={CARD.w} height={CARD.h} fill="none" stroke="#e6007e" strokeWidth={0.2} />
          <rect x={CARD.safe} y={CARD.safe} width={CARD.w - CARD.safe * 2} height={CARD.h - CARD.safe * 2} fill="none" stroke="#00a060" strokeWidth={0.15} strokeDasharray="1 0.8" />
        </g>
      )}
      {selBox && (
        <rect x={selBox.x - 0.5} y={selBox.y - 0.5} width={selBox.w + 1} height={selBox.h + 1} fill="none" stroke="#2f80ed" strokeWidth={0.25} strokeDasharray="1.2 0.8" pointerEvents="none" />
      )}
    </svg>
  );
}
