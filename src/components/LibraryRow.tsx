import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";

interface LibraryRowProps {
  label: string;
  onManage: () => void;
}

export function LibraryRow({ label, onManage }: LibraryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/30">
      <span className="text-sm text-foreground truncate">{label}</span>
      <Button size="sm" variant="outline" onClick={onManage} className="shrink-0">
        <Library className="w-3.5 h-3.5 mr-1" /> Manage
      </Button>
    </div>
  );
}