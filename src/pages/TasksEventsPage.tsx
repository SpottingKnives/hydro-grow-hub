import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { isBefore, startOfDay, format } from "date-fns";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { FilterBar } from "@/components/FilterBar";
import { LogParametersDialog } from "@/components/LogParametersDialog";
import type { GrowTask, Priority, TaskRepeat } from "@/types";
import { cn } from "@/lib/utils";

type Status = "all" | "upcoming" | "overdue" | "completed";

export default function TasksEventsPage() {
  const { tasks, growCycles, addTask, toggleTask, deleteTask } = useStore();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("all");
  const [form, setForm] = useState({ title: "", description: "", grow_cycle_id: "", due_date: "", priority: "medium" as Priority, repeat: "none" as TaskRepeat });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [logParams, setLogParams] = useState<{ growId: string | null; taskId: string } | null>(null);

  const today = startOfDay(new Date());

  const items = useMemo(() => {
    return tasks
      .map((t) => ({ id: t.id, date: t.due_date, title: t.title, grow_cycle_id: t.grow_cycle_id, completed: t.completed }))
      .filter((it) => {
        if (status === "all") return true;
        if (status === "completed") return it.completed;
        if (status === "upcoming") return !it.completed && (!it.date || !isBefore(new Date(it.date), today));
        return !it.completed && !!it.date && isBefore(new Date(it.date), today);
      })
      .sort((a, b) => {
        if (!a.date) return 1; if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [tasks, status, today]);

  const create = () => {
    if (!form.title.trim()) return;
    const task: GrowTask = {
      id: crypto.randomUUID(), grow_cycle_id: form.grow_cycle_id || null,
      name: form.title, title: form.title, description: form.description,
      due_date: form.due_date || null, stage_trigger: null, status: "open",
      priority: form.priority, completed: false, generated_from_environment: false, reminder_time: null,
      repeat: form.repeat, repeat_parent_id: null,
    };
    addTask(task);
    setForm({ title: "", description: "", grow_cycle_id: "", due_date: "", priority: "medium", repeat: "none" });
    setOpen(false);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Tasks & Events</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Task
        </Button>
      </div>

      <FilterBar<Status>
        ariaLabel="Status filter"
        options={["all", "upcoming", "overdue", "completed"] as const}
        value={status}
        onChange={setStatus}
      />

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Nothing here yet.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const cycle = growCycles.find((c) => c.id === it.grow_cycle_id);
            const overdue = !it.completed && it.date && isBefore(new Date(it.date), today);
            return (
              <div key={it.id} className="glass-card p-3 flex items-center gap-3">
                <Checkbox checked={!!it.completed} onCheckedChange={() => toggleTask(it.id)} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <div className="flex-1 min-w-0">
                  {it.title === "Log Parameters" && !it.completed ? (
                    <button
                      type="button"
                      onClick={() => setLogParams({ growId: it.grow_cycle_id, taskId: it.id })}
                      className="text-sm font-medium text-primary text-left underline-offset-2 hover:underline"
                    >
                      {it.title}
                    </button>
                  ) : (
                    <p className={cn("text-sm font-medium text-foreground", it.completed && "line-through opacity-50")}>{it.title}</p>
                  )}
                  <p className="mt-0.5 text-[12px] leading-tight text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className={cn("capitalize", overdue && "text-destructive")}>
                      {it.completed ? "Completed" : overdue ? "Overdue" : "Upcoming"}
                    </span>
                    {" • "}
                    <span>Task</span>
                    {it.date && <>{" • "}<span>{format(new Date(it.date), "d MMM")}</span></>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDel(it.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
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
            <FormField label="Grow Cycle" helper="Optional. Link this task to a specific grow.">
              <Select value={form.grow_cycle_id} onValueChange={(v) => setForm({ ...form, grow_cycle_id: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Unlinked" /></SelectTrigger>
                <SelectContent>
                  {growCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormFooter onSave={create} onCancel={() => setOpen(false)} saveDisabled={!form.title.trim()} saveLabel="Create" />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) deleteTask(confirmDel); setConfirmDel(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LogParametersDialog
        open={!!logParams}
        onOpenChange={(o) => !o && setLogParams(null)}
        growCycleId={logParams?.growId ?? null}
        taskId={logParams?.taskId ?? null}
      />
    </div>
  );
}
