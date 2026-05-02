import { cn } from "@/lib/utils";

export interface FilterBarOption<T extends string> {
  value: T;
  label: string;
}

interface FilterBarProps<T extends string> {
  options: FilterBarOption<T>[] | readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Shared compact, single-line, non-scrolling filter/segment bar.
 * Used for ALL filter bars in the app. Items distribute evenly (flex-1),
 * never wrap, never scroll horizontally.
 */
export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: FilterBarProps<T>) {
  const items: FilterBarOption<T>[] = (options as any[]).map((o) =>
    typeof o === "string" ? { value: o as T, label: o } : (o as FilterBarOption<T>)
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full items-stretch rounded-md border border-border bg-muted/30 overflow-hidden",
        className,
      )}
    >
      {items.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 min-w-0 text-center capitalize whitespace-nowrap px-1 py-1.5 text-[11px] tracking-tight transition-colors",
              active
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}