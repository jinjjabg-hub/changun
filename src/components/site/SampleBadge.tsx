import { cn } from "@/lib/utils";

/** 모든 가격이 샘플임을 알리는 표시 */
export function SampleBadge({ className, label = "샘플 가격" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/60 bg-accent/15 px-2 py-0.5 text-[11px] font-bold leading-none text-[#8a5a06]",
        className,
      )}
    >
      {label}
    </span>
  );
}
