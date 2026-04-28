import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface FormFooterProps {
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  lastUpdated?: string | null;
}

export function FormFooter({ onSave, onCancel, onDelete, saveLabel = "Save", saveDisabled, lastUpdated }: FormFooterProps) {
  return (
    <div className="space-y-3 pt-2">
      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated {format(new Date(lastUpdated), "MMM d, yyyy")}
        </p>
      )}
      <div className="flex items-center gap-2">
        {onDelete && (
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
            Delete
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saveDisabled} className="gradient-primary text-primary-foreground">
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}