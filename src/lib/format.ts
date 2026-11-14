export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export const num = (n: number) => n.toLocaleString("ko-KR");

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatShipDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 받침 유무에 따라 "로/으로" 선택 (ㄹ 받침은 "로") */
export function withRo(word: string) {
  const c = word.replace(/[^가-힣A-Za-z0-9]+$/, "").slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return `${word}로`;
  const jong = (c - 0xac00) % 28;
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`;
}
