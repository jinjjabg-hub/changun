import type { Palette } from "./types";

/** 색 조합. 화면색(RGB)으로 정의하고, PDF로 내보낼 때 CMYK 값으로 바꾼다. */
export const PALETTES: Palette[] = [
  { id: "navy", name: "네이비", paper: "#ffffff", ink: "#14213d", sub: "#5c677d", accent: "#1d4e89", dark: "#14213d", onDark: "#ffffff" },
  { id: "forest", name: "포레스트", paper: "#fbfaf5", ink: "#1b3a2b", sub: "#5f6f65", accent: "#2d6a4f", dark: "#1b3a2b", onDark: "#f4f1e8" },
  { id: "gold", name: "블랙 골드", paper: "#faf8f3", ink: "#1a1a1a", sub: "#6b6459", accent: "#b08d57", dark: "#151515", onDark: "#e9dcc3" },
  { id: "burgundy", name: "버건디", paper: "#fdfaf8", ink: "#3b0d1a", sub: "#7a5c61", accent: "#8c1c35", dark: "#3b0d1a", onDark: "#f7ebe8" },
  { id: "teal", name: "틸", paper: "#ffffff", ink: "#0b3c49", sub: "#5b7b84", accent: "#0f8b8d", dark: "#0b3c49", onDark: "#eaf6f6" },
  { id: "coral", name: "코랄", paper: "#fffaf7", ink: "#2f2a28", sub: "#7d6f69", accent: "#e76f51", dark: "#2f2a28", onDark: "#fff3ec" },
  { id: "violet", name: "바이올렛", paper: "#fbfaff", ink: "#231942", sub: "#6b6385", accent: "#5e548e", dark: "#231942", onDark: "#efeaff" },
  { id: "mono", name: "모노", paper: "#ffffff", ink: "#111111", sub: "#6e6e6e", accent: "#111111", dark: "#111111", onDark: "#ffffff" },
  { id: "sand", name: "샌드", paper: "#f5efe6", ink: "#3d3a34", sub: "#7c766b", accent: "#a47148", dark: "#3d3a34", onDark: "#f5efe6" },
  { id: "sky", name: "스카이", paper: "#ffffff", ink: "#102a43", sub: "#627d98", accent: "#2f80ed", dark: "#102a43", onDark: "#ffffff" },
  { id: "olive", name: "올리브", paper: "#f7f6ef", ink: "#2f3324", sub: "#6e7160", accent: "#6b7f3a", dark: "#2f3324", onDark: "#eef0e2" },
  { id: "mint", name: "민트", paper: "#ffffff", ink: "#12343b", sub: "#5d7d80", accent: "#2bb39a", dark: "#12343b", onDark: "#e8fbf6" },
  { id: "ember", name: "차콜 오렌지", paper: "#fbfaf8", ink: "#24252a", sub: "#6c6e74", accent: "#f2712b", dark: "#24252a", onDark: "#f7f3ee" },
  { id: "lavender", name: "라벤더", paper: "#fbfaff", ink: "#2e2a47", sub: "#77729a", accent: "#8a7fd1", dark: "#2e2a47", onDark: "#f1efff" },
  { id: "mustard", name: "머스터드", paper: "#fffcf3", ink: "#2b2a24", sub: "#77735f", accent: "#d9a21b", dark: "#2b2a24", onDark: "#fff6dc" },
  { id: "ocean", name: "오션", paper: "#f6fafd", ink: "#0c2d48", sub: "#5c7891", accent: "#145da0", dark: "#0c2d48", onDark: "#eaf3fb" },
];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

export const INDUSTRIES: { id: string; name: string; palettes: string[] }[] = [
  { id: "general", name: "일반 · 기타", palettes: ["navy", "mono", "teal", "forest", "ember", "olive"] },
  { id: "professional", name: "전문직 · 컨설팅", palettes: ["navy", "mono", "gold", "teal", "ocean", "olive"] },
  { id: "executive", name: "대표 · 임원", palettes: ["gold", "navy", "burgundy", "mono", "ocean"] },
  { id: "corporate", name: "기업 · B2B", palettes: ["navy", "sky", "teal", "mono", "ocean", "ember"] },
  { id: "creative", name: "디자인 · 마케팅", palettes: ["coral", "violet", "mono", "ember", "mustard", "lavender"] },
  { id: "lifestyle", name: "카페 · 공방 · 라이프스타일", palettes: ["sand", "forest", "coral", "olive", "mustard", "burgundy"] },
  { id: "medical", name: "병원 · 의료 · 헬스케어", palettes: ["teal", "sky", "mint", "forest", "navy"] },
  { id: "construction", name: "건설 · 부동산", palettes: ["navy", "gold", "forest", "ember", "mono"] },
  { id: "finance", name: "금융 · 법률", palettes: ["navy", "burgundy", "gold", "mono"] },
  { id: "tech", name: "IT · 테크", palettes: ["sky", "violet", "mono", "mint", "ember", "ocean"] },
  { id: "beauty", name: "뷰티 · 패션", palettes: ["sand", "coral", "lavender", "mono", "burgundy"] },
  { id: "education", name: "교육 · 강의", palettes: ["sky", "forest", "coral", "mint", "mustard", "violet"] },
  { id: "global", name: "무역 · 글로벌 비즈니스", palettes: ["navy", "teal", "ocean", "sky", "gold"] },
];

export const MOODS = [
  { id: "any", name: "상관없음" },
  { id: "simple", name: "깔끔하게" },
  { id: "premium", name: "고급스럽게" },
  { id: "bold", name: "눈에 띄게" },
  { id: "warm", name: "따뜻하게" },
];
