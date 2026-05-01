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
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
        {onDelete && (
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button variant="outline" onClick={onCancel} className="sm:ml-auto w-full sm:w-auto">Cancel</Button>
        <Button onClick={onSave} disabled={saveDisabled} className="gradient-primary text-primary-foreground w-full sm:w-auto">
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}