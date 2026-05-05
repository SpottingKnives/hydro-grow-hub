import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import type { GrowTask, Priority, TaskRepeat } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the grow cycle field is hidden and pre-filled. */
  growCycleId?: string | null;
  defaultDate?: string;
  onCreated?: (task: GrowTask) => void;
}

const empty = { title: "", description: "", grow_cycle_id: "", due_date: "", priority: "medium" as Priority, repeat: "none" as TaskRepeat };

export function TaskFormDialog({ open, onOpenChange, growCycleId, defaultDate, onCreated }: Props) {
  const { growCycles, addTask } = useStore();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, grow_cycle_id: growCycleId ?? "", due_date: defaultDate ?? "" });
  }, [open, growCycleId, defaultDate]);

  const create = () => {
    if (!form.title.trim()) return;
    const task: GrowTask = {
      id: crypto.randomUUID(),
      grow_cycle_id: form.grow_cycle_id || null,
      name: form.title, title: form.title, description: form.description,
      due_date: form.due_date || null, stage_trigger: null, status: "open",
      priority: form.priority, completed: false, generated_from_environment: false,
      reminder_time: null, repeat: form.repeat, repeat_parent_id: null,
    };
    addTask(task);
    onCreated?.(task);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <FormField label="Title" htmlFor="t-title" required>
            <Input id="t-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-muted border-border" />
          </FormField>
          <FormField label="Description" htmlFor="t-desc" helper="Optional context for the task">
            <Textarea id="t-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-border" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Due Date" htmlFor="t-due">
              <Input id="t-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Repeat" helper="Auto-creates the next occurrence when this task is completed">
            <Select value={form.repeat} onValueChange={(v) => setForm({ ...form, repeat: v as TaskRepeat })}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {!growCycleId && (
            <FormField label="Grow Cycle" helper="Optional. Link this task to a specific grow.">
              <Select value={form.grow_cycle_id} onValueChange={(v) => setForm({ ...form, grow_cycle_id: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Unlinked" /></SelectTrigger>
                <SelectContent>
                  {growCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          )}
          <FormFooter onSave={create} onCancel={() => onOpenChange(false)} saveDisabled={!form.title.trim()} saveLabel="Create" />
        </div>
      </DialogContent>
    </Dialog>
  );
}