import { cn } from "@/lib/utils";
import type { GrowStatus } from "@/types";

const statusStyles: Record<GrowStatus, string> = {
  active: "bg-success/20 text-success",
  completed: "bg-info/20 text-info",
  archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: GrowStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
