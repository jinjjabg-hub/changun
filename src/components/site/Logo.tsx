import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="창운 홈">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill={light ? "#fff" : "#0f5a43"} />
        <path d="M9 22 L16 8 L23 22" fill="none" stroke={light ? "#0f5a43" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="21.5" r="2.4" fill="#f2a93b" />
      </svg>
      <span className={`text-[22px] font-extrabold tracking-tight ${light ? "text-white" : "text-brand-dark"}`}>창운</span>
    </Link>
  );
}
