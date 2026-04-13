import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Droplets, Sprout, AlertTriangle, StickyNote, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EventType, GrowEvent } from "@/types";
import { cn } from "@/lib/utils";

const eventIcons: Record<EventType, React.ReactNode> = {
  feed: <Droplets className="w-3 h-3" />,
  water: <Droplets className="w-3 h-3" />,
  transplant: <ArrowRightLeft className="w-3 h-3" />,
  issue: <AlertTriangle className="w-3 h-3" />,
  note: <StickyNote className="w-3 h-3" />,
  stage_change: <Sprout className="w-3 h-3" />,
};

const eventColors: Record<EventType, string> = {
  feed: "bg-success/20 text-success",
  water: "bg-info/20 text-info",
  transplant: "bg-warning/20 text-warning",
  issue: "bg-destructive/20 text-destructive",
  note: "bg-muted text-muted-foreground",
  stage_change: "bg-accent text-accent-foreground",
};

export default function DashboardPage() {
  const { growCycles, events, tasks, addEvent } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", type: "note" as EventType, grow_cycle_id: "", description: "" });

  const activeCycles = growCycles.filter((c) => c.status === "active");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day));

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day));

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.grow_cycle_id) return;
    const event: GrowEvent = {
      id: crypto.randomUUID(),
      grow_cycle_id: newEvent.grow_cycle_id,
      type: newEvent.type,
      title: newEvent.title,
      description: newEvent.description,
      date: (selectedDate || new Date()).toISOString(),
    };
    addEvent(event);
    setNewEvent({ title: "", type: "note", grow_cycle_id: "", description: "" });
    setShowAddEvent(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCycles.length} active grow{activeCycles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="bg-muted border-border" />
              <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as EventType })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["feed", "water", "transplant", "issue", "note"] as EventType[]).map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newEvent.grow_cycle_id} onValueChange={(v) => setNewEvent({ ...newEvent, grow_cycle_id: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select grow cycle" /></SelectTrigger>
                <SelectContent>
                  {activeCycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Description (optional)" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="bg-muted border-border" />
              <Button onClick={handleAddEvent} className="w-full gradient-primary text-primary-foreground">Add Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Grows Summary */}
      {activeCycles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCycles.map((cycle) => {
            const daysSinceStage = Math.floor((Date.now() - new Date(cycle.stage_start_date).getTime()) / 86400000);
            return (
              <div key={cycle.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground truncate">{cycle.name}</h3>
                  <StatusBadge status={cycle.status} />
                </div>
                <div className="flex items-center gap-2">
                  <StageBadge stage={cycle.current_stage} />
                  <span className="text-xs text-muted-foreground">Day {daysSinceStage}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Started {format(new Date(cycle.start_date), "MMM d, yyyy")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
          ))}
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[80px] p-1.5 text-left rounded-lg transition-colors border border-transparent",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                  isToday && "border-primary/50",
                  isSelected && "bg-accent/50 border-primary",
                  "hover:bg-muted/50"
                )}
              >
                <span className={cn("text-xs font-medium", isToday && "text-primary")}>{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div key={e.id} className={cn("flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate", eventColors[e.type])}>
                      {eventIcons[e.type]}
                      <span className="truncate">{e.title}</span>
                    </div>
                  ))}
                  {dayTasks.slice(0, 2).map((t) => (
                    <div key={t.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-warning/20 text-warning truncate">
                      <span className="truncate">📋 {t.title}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDate && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-3">{format(selectedDate, "EEEE, MMMM d")}</h3>
          {(() => {
            const dayEvents = getEventsForDay(selectedDate);
            const dayTasks = getTasksForDay(selectedDate);
            if (dayEvents.length === 0 && dayTasks.length === 0)
              return <p className="text-sm text-muted-foreground">No events or tasks</p>;
            return (
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm", eventColors[e.type])}>
                    {eventIcons[e.type]}
                    <span className="font-medium">{e.title}</span>
                    <span className="text-xs opacity-70 ml-auto capitalize">{e.type}</span>
                  </div>
                ))}
                {dayTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-warning/10 text-warning">
                    <span>📋</span>
                    <span className={cn("font-medium", t.completed && "line-through opacity-50")}>{t.title}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
