import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { GrowTask, Priority, GrowStage } from "@/types";
import { STAGES } from "@/types";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, growCycles, addTask, toggleTask, deleteTask } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [newTask, setNewTask] = useState({
    title: "", description: "", grow_cycle_id: "", due_date: "",
    stage_trigger: "" as string, priority: "medium" as Priority,
  });

  const handleCreate = () => {
    if (!newTask.title) return;
    const task: GrowTask = {
      id: crypto.randomUUID(),
      grow_cycle_id: newTask.grow_cycle_id || null,
      name: newTask.title,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      stage_trigger: (newTask.stage_trigger as GrowStage) || null,
      status: "open",
      priority: newTask.priority,
      completed: false,
      generated_from_environment: false,
      reminder_time: null,
    };
    addTask(task);
    setNewTask({ title: "", description: "", grow_cycle_id: "", due_date: "", stage_trigger: "", priority: "medium" });
    setShowCreate(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const priorityColors: Record<Priority, string> = {
    low: "text-muted-foreground",
    medium: "text-warning",
    high: "text-destructive",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-muted border-border" />
              <Textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="bg-muted border-border" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Due Date</label>
                  <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as Priority })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {growCycles.length > 0 && (
                <Select value={newTask.grow_cycle_id} onValueChange={(v) => setNewTask({ ...newTask, grow_cycle_id: v })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Link to grow (optional)" /></SelectTrigger>
                  <SelectContent>
                    {growCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" onClick={() => setFilter(f)} className={cn("capitalize", filter === f && "gradient-primary text-primary-foreground")}>
            {f}
          </Button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">{filter === "all" ? "No tasks yet." : `No ${filter} tasks.`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const cycle = growCycles.find((c) => c.id === task.grow_cycle_id);
            return (
              <div key={task.id} className="glass-card p-3 flex items-center gap-3">
                <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground", task.completed && "line-through opacity-50")}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cycle && <span className="text-xs text-muted-foreground">{cycle.name}</span>}
                    {task.due_date && <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM d")}</span>}
                  </div>
                </div>
                <span className={cn("text-xs font-medium capitalize", priorityColors[task.priority])}>{task.priority}</span>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
