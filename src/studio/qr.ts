import QRCode from "qrcode";

const cache = new Map<string, { size: number; path: string }>();

/**
 * QR 코드를 벡터 경로로 만든다 (1칸 = 1단위, 좌표 0..size).
 * 같은 줄의 연속된 칸은 하나의 사각형으로 합쳐 경로를 줄인다.
 */
export function qrPath(text: string): { size: number; path: string } | null {
  const key = text.trim();
  if (!key) return null;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const { modules } = QRCode.create(key, { errorCorrectionLevel: "M" });
    const n = modules.size;
    let d = "";
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        if (!modules.data[y * n + x]) { x++; continue; }
        let run = 1;
        while (x + run < n && modules.data[y * n + x + run]) run++;
        d += `M${x} ${y}h${run}v1h${-run}z`;
        x += run;
      }
    }
    const out = { size: n, path: d };
    cache.set(key, out);
    return out;
  } catch {
    return null; // 내용이 너무 길어 QR로 만들 수 없는 경우
  }
}
