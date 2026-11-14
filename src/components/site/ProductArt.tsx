import type { ArtKind } from "@/data/catalog";

interface Tone {
  bg: string;
  fg: string;
  accent: string;
}

/** 임시 상품 이미지: 상품 종류별 SVG 일러스트 (저작권 이슈 없는 자체 제작) */
export function ProductArt({ kind, tone, className }: { kind: ArtKind; tone: Tone; className?: string }) {
  const { bg, fg, accent } = tone;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="상품 이미지(임시)" className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill={bg} />
      <circle cx="340" cy="40" r="90" fill={accent} opacity="0.16" />
      <circle cx="40" cy="290" r="110" fill={fg} opacity="0.06" />
      {kind === "card" && (
        <g>
          <g transform="rotate(-8 200 150)">
            <rect x="90" y="85" width="190" height="110" rx="8" fill="#fff" stroke={fg} strokeOpacity="0.12" />
            <rect x="106" y="102" width="26" height="26" rx="6" fill={fg} />
            <rect x="106" y="146" width="90" height="8" rx="4" fill={fg} opacity="0.75" />
            <rect x="106" y="162" width="62" height="6" rx="3" fill={fg} opacity="0.3" />
          </g>
          <g transform="rotate(7 220 170)">
            <rect x="130" y="120" width="190" height="110" rx="8" fill={fg} />
            <circle cx="162" cy="152" r="14" fill={accent} />
            <rect x="188" y="146" width="100" height="8" rx="4" fill="#fff" opacity="0.9" />
            <rect x="188" y="162" width="70" height="6" rx="3" fill="#fff" opacity="0.45" />
            <rect x="148" y="196" width="140" height="5" rx="2.5" fill="#fff" opacity="0.35" />
          </g>
        </g>
      )}
      {kind === "sticker" && (
        <g>
          <g transform="rotate(-10 140 160)">
            <circle cx="140" cy="160" r="66" fill="#fff" />
            <circle cx="140" cy="160" r="56" fill={accent} />
            <path d="M140 124 l10 22 24 3 -18 16 5 24 -21 -12 -21 12 5 -24 -18 -16 24 -3z" fill="#fff" />
          </g>
          <g transform="rotate(9 262 150)">
            <rect x="212" y="102" width="104" height="104" rx="14" fill="#fff" />
            <rect x="222" y="112" width="84" height="84" rx="8" fill={fg} />
            <path d="M316 206 l-34 0 q34 -4 34 -34z" fill="#fff" opacity="0.9" />
            <rect x="236" y="140" width="56" height="7" rx="3.5" fill="#fff" />
            <rect x="236" y="156" width="36" height="6" rx="3" fill="#fff" opacity="0.5" />
          </g>
        </g>
      )}
      {kind === "flyer" && (
        <g>
          <g transform="rotate(-6 150 150)">
            <rect x="82" y="46" width="150" height="212" rx="6" fill="#fff" stroke={fg} strokeOpacity="0.12" />
            <rect x="96" y="60" width="122" height="70" rx="4" fill={accent} opacity="0.9" />
            <rect x="96" y="144" width="96" height="9" rx="4.5" fill={fg} />
            {[166, 180, 194, 208].map((y) => (
              <rect key={y} x="96" y={y} width={y === 208 ? 70 : 122} height="5" rx="2.5" fill={fg} opacity="0.25" />
            ))}
          </g>
          <g transform="rotate(8 270 160)">
            <rect x="210" y="70" width="110" height="170" rx="6" fill={fg} />
            <rect x="222" y="84" width="86" height="8" rx="4" fill="#fff" />
            <rect x="222" y="100" width="56" height="6" rx="3" fill="#fff" opacity="0.5" />
            <circle cx="265" cy="170" r="30" fill={accent} />
          </g>
        </g>
      )}
      {kind === "cloth" && (
        <g>
          <path d="M40 70 H360" stroke={fg} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          <path d="M40 70 L52 92 M360 70 L348 92" stroke={fg} strokeWidth="2" opacity="0.4" />
          <rect x="48" y="88" width="304" height="132" rx="3" fill="#fff" stroke={fg} strokeOpacity="0.15" />
          <rect x="48" y="88" width="304" height="132" fill={fg} opacity="0.92" />
          <rect x="74" y="118" width="170" height="14" rx="7" fill="#fff" />
          <rect x="74" y="142" width="120" height="9" rx="4.5" fill="#fff" opacity="0.55" />
          <rect x="266" y="112" width="64" height="64" rx="10" fill={accent} />
          {[[58, 98], [342, 98], [58, 210], [342, 210], [200, 98], [200, 210]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill={bg} stroke={fg} strokeWidth="1.5" />
          ))}
          <path d="M70 220 q130 22 260 0" fill="none" stroke={fg} strokeOpacity="0.15" strokeWidth="2" />
        </g>
      )}
      {kind === "xbanner" && (
        <g>
          <path d="M130 270 L270 52 M270 270 L130 52" stroke={fg} strokeWidth="5" strokeLinecap="round" />
          <rect x="132" y="56" width="136" height="196" rx="4" fill="#fff" stroke={fg} strokeOpacity="0.2" />
          <rect x="132" y="56" width="136" height="64" fill={fg} />
          <rect x="146" y="72" width="70" height="10" rx="5" fill="#fff" />
          <rect x="146" y="90" width="44" height="7" rx="3.5" fill="#fff" opacity="0.5" />
          <circle cx="200" cy="168" r="30" fill={accent} />
          <rect x="148" y="214" width="104" height="8" rx="4" fill={fg} opacity="0.7" />
          <rect x="164" y="230" width="72" height="6" rx="3" fill={fg} opacity="0.25" />
          <rect x="110" y="268" width="180" height="8" rx="4" fill={fg} opacity="0.85" />
        </g>
      )}
    </svg>
  );
}
