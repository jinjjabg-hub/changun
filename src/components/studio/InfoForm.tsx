"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { INDUSTRIES, MOODS, PALETTES } from "@/studio/palettes";
import { fileToAsset } from "@/studio/store";
import { sampleInfo, type Asset, type CardInfo } from "@/studio/types";
import { cn } from "@/lib/utils";

const field = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 text-sm outline-none focus:border-brand";

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) return d.length < 3 ? d : d.length < 6 ? `${d.slice(0, 2)}-${d.slice(2)}` : `${d.slice(0, 2)}-${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

export function validateInfo(info: CardInfo): Record<string, string> {
  const e: Record<string, string> = {};
  if (info.name.trim().length < 2) e.name = "이름을 2자 이상 입력해 주세요";
  if (info.phone && !/^0\d{1,2}-\d{3,4}-\d{4}$/.test(info.phone)) e.phone = "전화번호 형식을 확인해 주세요 (예: 010-1234-5678)";
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) e.email = "이메일 형식을 확인해 주세요";
  if (info.qrUrl && !/^(https?:\/\/)?[^\s.]+\.[^\s]+$/.test(info.qrUrl)) e.qrUrl = "주소 형식을 확인해 주세요 (예: https://example.com)";
  return e;
}

/** 각 단계에서 검사할 항목 */
const STEP_FIELDS = [["name"], [], ["phone", "email"], ["qrUrl"]];
export const INFO_STEPS = ["기본 정보", "회사 정보", "연락처", "이미지 · QR · 취향"];

function Row({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}{required ? <span className="text-danger"> *</span> : <span className="ml-1 text-xs font-normal text-mute">선택</span>}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs text-danger">{error}</span> : hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

function Upload({ label, hint, value, onChange }: { label: string; hint: string; value: Asset | null; onChange: (a: Asset | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    try {
      setError(null);
      onChange(await fileToAsset(f));
    } catch (e) {
      setError(e instanceof Error && e.message.length < 60 ? e.message : "이미지를 읽지 못했어요.");
    }
  };
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}<span className="ml-1 text-xs font-normal text-mute">선택</span></p>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border-2 border-line p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 data URL 미리보기 */}
          <img src={value.url} alt={`${label} 미리보기`} className="size-14 rounded bg-surface object-contain" />
          <div className="min-w-0 flex-1 text-xs"><p className="truncate font-semibold">{value.name}</p><p className="text-mute">{value.w}×{value.h}px</p></div>
          <button type="button" aria-label={`${label} 지우기`} onClick={() => onChange(null)} className="rounded p-1 text-mute hover:text-danger"><X size={16} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }} className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-line px-3 py-3 text-left text-sm hover:border-brand/50">
          <ImagePlus size={20} className="shrink-0 text-brand" />
          <span><b>{label} 올리기</b><span className="block text-xs text-mute">{hint}</span></span>
        </button>
      )}
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

export function InfoForm({ info, onChange, sub, onSub, onDone }: { info: CardInfo; onChange: (i: CardInfo) => void; sub: number; onSub: (n: number) => void; onDone: () => void }) {
  const [touched, setTouched] = useState(false);
  const errors = validateInfo(info);
  const set = <K extends keyof CardInfo>(k: K, v: CardInfo[K]) => onChange({ ...info, [k]: v });
  const err = (k: string) => (touched ? errors[k] : undefined);

  const next = () => {
    if (STEP_FIELDS[sub].some((k) => errors[k])) return setTouched(true);
    setTouched(false);
    if (sub < INFO_STEPS.length - 1) onSub(sub + 1);
    else if (Object.keys(errors).length) {
      // 앞 단계에 오류가 남아 있으면 그 단계로 돌아간다
      setTouched(true);
      onSub(STEP_FIELDS.findIndex((fs) => fs.some((k) => errors[k])));
    } else onDone();
  };

  return (
    <div>
      <ol className="mb-5 flex gap-1.5 text-xs font-semibold">
        {INFO_STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button type="button" onClick={() => onSub(i)} aria-current={i === sub ? "step" : undefined} className={cn("w-full rounded-full px-2 py-1.5 transition-colors", i === sub ? "bg-brand text-white" : i < sub ? "bg-brand-soft text-brand" : "bg-surface text-mute")}>
              <span className="sm:hidden">{i + 1}</span><span className="hidden sm:inline">{i + 1}. {s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="space-y-4">
        {sub === 0 && (
          <>
            <Row label="이름" required error={err("name")}><input className={field} value={info.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" autoComplete="name" /></Row>
            <Row label="직책"><input className={field} value={info.title} onChange={(e) => set("title", e.target.value)} placeholder="대표 / 팀장 / 디자이너" /></Row>
            <Row label="전문분야" hint="이름 아래나 뒷면에 한 줄로 들어가요"><input className={field} value={info.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="브랜드 · 인쇄 디자인" /></Row>
          </>
        )}
        {sub === 1 && (
          <>
            <Row label="회사명"><input className={field} value={info.company} onChange={(e) => set("company", e.target.value)} placeholder="창운 스튜디오" autoComplete="organization" /></Row>
            <Row label="회사 주소"><input className={field} value={info.address} onChange={(e) => set("address", e.target.value)} placeholder="서울시 중구 세종대로 110" /></Row>
            <Row label="업종" required hint="업종에 어울리는 템플릿과 색을 먼저 골라 드려요">
              <select className={field} value={info.industry} onChange={(e) => set("industry", e.target.value)}>
                {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Row>
          </>
        )}
        {sub === 2 && (
          <>
            <Row label="전화번호" error={err("phone")}><input className={field} inputMode="numeric" value={info.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} placeholder="010-0000-0000" autoComplete="tel" /></Row>
            <Row label="이메일" error={err("email")}><input className={field} type="email" value={info.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" autoComplete="email" /></Row>
            <Row label="홈페이지"><input className={field} value={info.website} onChange={(e) => set("website", e.target.value)} placeholder="www.company.com" /></Row>
            <Row label="SNS"><input className={field} value={info.sns} onChange={(e) => set("sns", e.target.value)} placeholder="@instagram_id" /></Row>
          </>
        )}
        {sub === 3 && (
          <>
            <Upload label="로고" hint="배경이 투명한 PNG나 SVG가 가장 좋아요" value={info.logo} onChange={(a) => set("logo", a)} />
            <Upload label="인물 사진" hint="사진 자리가 있는 템플릿에 들어가요" value={info.photo} onChange={(a) => set("photo", a)} />
            <Row label="QR 코드에 연결할 주소" error={err("qrUrl")} hint="입력하면 뒷면에 QR 코드가 들어가요"><input className={field} value={info.qrUrl} onChange={(e) => set("qrUrl", e.target.value.trim())} placeholder="https://" inputMode="url" /></Row>
            <div>
              <p className="mb-1.5 text-sm font-semibold">원하는 분위기</p>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => <button key={m.id} type="button" aria-pressed={info.mood === m.id} onClick={() => set("mood", m.id)} className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-semibold", info.mood === m.id ? "border-brand bg-brand text-white" : "border-line hover:border-brand/50")}>{m.name}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold">선호 색상</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" aria-pressed={info.color === "auto"} onClick={() => set("color", "auto")} className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-semibold", info.color === "auto" ? "border-brand bg-brand text-white" : "border-line hover:border-brand/50")}>업종에 맞게</button>
                {PALETTES.map((p) => (
                  <button key={p.id} type="button" aria-pressed={info.color === p.id} title={p.name} onClick={() => set("color", p.id)} className={cn("flex items-center gap-1.5 rounded-full border-2 py-1 pl-1 pr-3 text-sm font-semibold", info.color === p.id ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50")}>
                    <span className="flex overflow-hidden rounded-full ring-1 ring-line"><i className="block size-5" style={{ background: p.accent }} /><i className="block size-5" style={{ background: p.dark }} /></span>{p.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2">
        {sub > 0 && <button type="button" onClick={() => onSub(sub - 1)} className="h-11 rounded-xl border-2 border-line px-5 text-sm font-bold hover:border-brand/50">이전</button>}
        <button type="button" onClick={next} className="h-11 flex-1 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">
          {sub < INFO_STEPS.length - 1 ? "다음" : "디자인 시안 4종 만들기 →"}
        </button>
      </div>
      <button type="button" onClick={() => onChange({ ...sampleInfo, logo: info.logo, photo: info.photo, industry: info.industry, mood: info.mood, color: info.color })} className="mt-3 text-xs text-mute underline">예시 정보로 채워 보기</button>
    </div>
  );
}
