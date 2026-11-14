/**
 * 스티커 칼선 자동 생성 (브라우저 안에서만 동작, 서버 전송 없음)
 *
 * 1) 배경 분리  : 투명 PNG는 알파값, 불투명 이미지는 테두리 색에서 번져 나가며(flood fill) 배경을 지움
 * 2) 여백 확장  : 거리 변환으로 그림 바깥쪽 여백(px)만큼 부풀림 → 안쪽 구멍 메움
 * 3) 외곽선 추출: 가장 큰 덩어리의 윤곽을 따라가 다각형으로 만들고 단순화 · 스무딩
 */

export interface Pixels {
  width: number;
  height: number;
  /** RGBA, 길이 = width*height*4 */
  data: Uint8ClampedArray | Uint8Array;
}

export type CutlineFail = "no-subject" | "busy-background";

export interface CutlineResult {
  ok: true;
  /** 이미지 좌표계(px)의 칼선 꼭짓점 */
  points: [number, number][];
  /** 칼선 경계 상자 (이미지 좌표계, 음수 가능) */
  bbox: { x: number; y: number; w: number; h: number };
  /** 그림(여백 제외) 경계 상자 */
  subject: { x: number; y: number; w: number; h: number };
  mode: "alpha" | "color";
  /** 여백을 줘도 서로 붙지 않은 조각 수 (1이 정상) */
  pieces: number;
}

export type CutlineOutcome = CutlineResult | { ok: false; reason: CutlineFail };

export interface CutlineOptions {
  /** 그림 바깥 여백 (px) */
  marginPx: number;
  /** 배경색 허용 오차 0~120 (불투명 이미지에서만 사용) */
  tolerance: number;
}

/** 그림 영역 마스크 (1 = 그림) */
export function subjectMask(img: Pixels, tolerance: number): { mask: Uint8Array; mode: "alpha" | "color" } | { fail: CutlineFail } {
  const { width: W, height: H, data } = img;
  const n = W * H;
  const mask = new Uint8Array(n);

  let transparent = 0;
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 250) transparent++;

  if (transparent > n * 0.01) {
    for (let i = 0; i < n; i++) mask[i] = data[i * 4 + 3] > 40 ? 1 : 0;
    return { mask, mode: "alpha" };
  }

  // 테두리 픽셀의 중앙값을 배경색으로 본다
  const border: number[] = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const med = (c: number) => {
    const v = border.map((i) => data[i * 4 + c]).sort((a, b) => a - b);
    return v[v.length >> 1];
  };
  const bg = [med(0), med(1), med(2)];
  const tol2 = tolerance * tolerance * 3;
  const near = (i: number) => {
    const dr = data[i * 4] - bg[0];
    const dg = data[i * 4 + 1] - bg[1];
    const db = data[i * 4 + 2] - bg[2];
    return dr * dr + dg * dg + db * db <= tol2;
  };
  // 테두리가 한 가지 색이 아니면(사진 등) 배경을 분리할 수 없다
  const uniform = border.filter(near).length / border.length;
  if (uniform < 0.7) return { fail: "busy-background" };

  const seen = new Uint8Array(n);
  const stack: number[] = [];
  for (const i of border) if (!seen[i] && near(i)) { seen[i] = 1; stack.push(i); }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % W;
    if (x > 0) { const j = i - 1; if (!seen[j] && near(j)) { seen[j] = 1; stack.push(j); } }
    if (x < W - 1) { const j = i + 1; if (!seen[j] && near(j)) { seen[j] = 1; stack.push(j); } }
    if (i >= W) { const j = i - W; if (!seen[j] && near(j)) { seen[j] = 1; stack.push(j); } }
    if (i < n - W) { const j = i + W; if (!seen[j] && near(j)) { seen[j] = 1; stack.push(j); } }
  }
  for (let i = 0; i < n; i++) mask[i] = seen[i] ? 0 : 1;
  return { mask, mode: "color" };
}

/** 3-4 chamfer 거리 변환: 각 칸에서 가장 가까운 그림 픽셀까지의 거리 × 3 */
function distance(mask: Uint8Array, W: number, H: number) {
  const INF = 1e9;
  const d = new Float64Array(W * H);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 0 : INF;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 3);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 4);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 4);
      }
      d[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 3);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 4);
      }
      d[i] = v;
    }
  return d;
}

/** Moore 이웃 추적으로 덩어리의 바깥 윤곽을 따라간다 */
function trace(shape: Uint8Array, W: number, H: number, start: number): [number, number][] {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && shape[y * W + x] === 1;
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const sx = start % W;
  const sy = (start / W) | 0;
  const pts: [number, number][] = [[sx, sy]];
  let x = sx;
  let y = sy;
  let dir = 6; // 시작점은 맨 위·왼쪽이므로 위쪽은 비어 있다
  const limit = W * H * 4;
  for (let step = 0; step < limit; step++) {
    let found = false;
    for (let k = 0; k < 8; k++) {
      const nd = (dir + 6 + k) % 8; // 직전 방향 기준 왼쪽 뒤부터 시계 방향 탐색
      const nx = x + dirs[nd][0];
      const ny = y + dirs[nd][1];
      if (at(nx, ny)) {
        x = nx;
        y = ny;
        dir = nd;
        found = true;
        break;
      }
    }
    if (!found) break; // 한 점짜리
    if (x === sx && y === sy) break;
    pts.push([x, y]);
  }
  return pts;
}

/** Ramer–Douglas–Peucker 단순화 */
function simplify(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
      if (dist > max) { max = dist; idx = i; }
    }
    if (max > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Chaikin 모서리 깎기 (닫힌 다각형) */
function smooth(pts: [number, number][], rounds: number): [number, number][] {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    const q: [number, number][] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = q;
  }
  return p;
}

export function makeCutline(img: Pixels, opt: CutlineOptions): CutlineOutcome {
  const { width: W, height: H } = img;
  const sm = subjectMask(img, opt.tolerance);
  if ("fail" in sm) return { ok: false, reason: sm.fail };

  let minX = W, minY = H, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (sm.mask[y * W + x]) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (count < W * H * 0.005) return { ok: false, reason: "no-subject" };
  // 불투명 이미지인데 거의 전부가 그림이면 배경을 못 지운 것
  if (sm.mode === "color" && count > W * H * 0.97) return { ok: false, reason: "busy-background" };

  // 여백이 이미지 밖으로 나갈 수 있으므로 사방에 패딩을 둔다
  const pad = Math.ceil(opt.marginPx) + 3;
  const PW = W + pad * 2;
  const PH = H + pad * 2;
  const padded = new Uint8Array(PW * PH);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (sm.mask[y * W + x]) padded[(y + pad) * PW + x + pad] = 1;

  const dist = distance(padded, PW, PH);
  const reach = opt.marginPx * 3;
  const grown = new Uint8Array(PW * PH);
  for (let i = 0; i < grown.length; i++) grown[i] = dist[i] <= reach ? 1 : 0;

  // 바깥에서 닿지 않는 빈칸(구멍)은 스티커 안쪽이므로 메운다
  const outside = new Uint8Array(PW * PH);
  const stack: number[] = [0];
  outside[0] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % PW;
    const nb = [x > 0 ? i - 1 : -1, x < PW - 1 ? i + 1 : -1, i - PW, i + PW];
    for (const j of nb) if (j >= 0 && j < outside.length && !outside[j] && !grown[j]) { outside[j] = 1; stack.push(j); }
  }
  const shape = new Uint8Array(PW * PH);
  for (let i = 0; i < shape.length; i++) shape[i] = outside[i] ? 0 : 1;

  // 덩어리 라벨링 → 가장 큰 것만 칼선으로
  const label = new Int32Array(PW * PH);
  let pieces = 0;
  let best = 0;
  let bestSize = 0;
  for (let s = 0; s < shape.length; s++) {
    if (!shape[s] || label[s]) continue;
    pieces++;
    let size = 0;
    const st = [s];
    label[s] = pieces;
    while (st.length) {
      const i = st.pop()!;
      size++;
      const x = i % PW;
      const nb = [x > 0 ? i - 1 : -1, x < PW - 1 ? i + 1 : -1, i - PW, i + PW];
      for (const j of nb) if (j >= 0 && j < shape.length && shape[j] && !label[j]) { label[j] = pieces; st.push(j); }
    }
    if (size > bestSize) { bestSize = size; best = pieces; }
  }
  const main = new Uint8Array(PW * PH);
  let start = -1;
  for (let i = 0; i < main.length; i++)
    if (label[i] === best) {
      main[i] = 1;
      if (start < 0) start = i;
    }

  const raw = trace(main, PW, PH, start);
  const simple = simplify([...raw, raw[0]], 0.9).slice(0, -1);
  const pts = smooth(simple.length >= 3 ? simple : raw, 2).map(([x, y]) => [x - pad + 0.5, y - pad + 0.5] as [number, number]);

  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < bx0) bx0 = x;
    if (x > bx1) bx1 = x;
    if (y < by0) by0 = y;
    if (y > by1) by1 = y;
  }

  return {
    ok: true,
    points: pts,
    bbox: { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 },
    subject: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
    mode: sm.mode,
    pieces,
  };
}

export function toSvgPath(points: [number, number][], scale = 1, dx = 0, dy = 0) {
  return (
    points.map(([x, y], i) => `${i ? "L" : "M"}${((x + dx) * scale).toFixed(2)} ${((y + dy) * scale).toFixed(2)}`).join(" ") + " Z"
  );
}

/**
 * 완성 스티커(칼선 포함)를 선택한 규격 안에 맞췄을 때의 배율.
 * 여백(mm)을 뺀 영역에 그림을 맞추므로 mm/px 를 먼저 구하고 여백을 px로 환산한다.
 */
export function fitToSize(subject: { w: number; h: number }, sizeMm: { w: number; h: number }, marginMm: number) {
  const mmPerPx = Math.min((sizeMm.w - marginMm * 2) / subject.w, (sizeMm.h - marginMm * 2) / subject.h);
  return { mmPerPx, marginPx: marginMm / mmPerPx, dpi: 25.4 / mmPerPx };
}
