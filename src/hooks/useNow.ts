"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};
const minute = () => Math.floor(Date.now() / 60_000);

/** 서버 렌더에서는 null (정적 HTML이 빌드 시각에 고정되지 않도록), 클라이언트에서는 현재 시각(분 단위). */
export function useNow(): Date | null {
  const m = useSyncExternalStore(subscribe, minute, () => null);
  return m === null ? null : new Date(m * 60_000);
}
