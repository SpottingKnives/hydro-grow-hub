import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import type { FeedSchedule } from "@/types";

const empty = { name: "", notes: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FeedSchedule | null;
  onCreated?: (id: string) => void;
  saveLabel?: string;
}

export function FeedScheduleFormDialog({ open, onOpenChange, initial, onCreated, saveLabel }: Props) {
  const { addFeedSchedule, updateFeedSchedule, deleteFeedSchedule } = useStore();
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { id: initial.id, name: initial.name, notes: initial.notes, updated_at: initial.updated_at } : empty);
  }, [open, initial]);

  const save = () => {
    if (!form.name.trim()) return;
    if (form.id) {
      updateFeedSchedule(form.id, { name: form.name.trim(), notes: form.notes });
      onCreated?.(form.id);
    } else {
      const id = crypto.randomUUID();
      const sched: FeedSchedule = { id, name: form.name.trim(), notes: form.notes, rows: [], ec_targets: {}, created_at: new Date().toISOString() };
      addFeedSchedule(sched);
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border w-[calc(100vw-1rem)]">
          <DialogHeader><DialogTitle>{form.id ? "Edit Feed Schedule" : "New Feed Schedule"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Schedule Name" htmlFor="sched-name" required>
              <Input id="sched-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Notes" htmlFor="sched-notes" helper="Optional context, growth phase, recipe source, etc.">
              <Textarea id="sched-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormFooter onSave={save} onCancel={() => onOpenChange(false)} onDelete={form.id ? () => setConfirmDelete(true) : undefined} saveDisabled={!form.name.trim()} saveLabel={saveLabel ?? (form.id ? "Save" : "Create & Use")} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>This removes the schedule. Historical feed logs that referenced it will remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (form.id) deleteFeedSchedule(form.id); setConfirmDelete(false); onOpenChange(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}