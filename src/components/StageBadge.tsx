import { cn } from "@/lib/utils";
import { STAGE_COLORS, type GrowStage } from "@/types";

export function StageBadge({ stage, className }: { stage: GrowStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-primary-foreground capitalize",
        STAGE_COLORS[stage],
        className
      )}
    >
      {stage}
    </span>
  );
}
