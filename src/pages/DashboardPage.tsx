import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import {
  format, isSameDay, startOfDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth,
} from "date-fns";
import { Calendar as CalIcon, ListChecks, Trash2, Plus, Activity, Droplets, ArrowRight, ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import { StageBadge } from "@/components/StageBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogParametersDialog } from "@/components/LogParametersDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { FeedCalculatorDialog } from "@/components/FeedCalculatorDialog";
import { STAGES, type GrowStage } from "@/types";
import { cn } from "@/lib/utils";

// Stable color per environment
const envHue = (id: string | null | undefined) => {
  if (!id) return 215;
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
};
const nextStageOf = (s: GrowStage): GrowStage | null => {
  const i = STAGES.indexOf(s);
  return i < 0 || i >= STAGES.length - 1 ? null : STAGES[i + 1];
};
const STAGES_NEED_FEED: GrowStage[] = ["nursery","veg","stretch","stack","swell","ripen"];

export default function DashboardPage() {
  const { growCycles, tasks, events, environments, clearAllData, changeStage } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [logParams, setLogParams] = useState<{ growId: string | null; taskId: string } | null>(null);
  const [taskFor, setTaskFor] = useState<string | null>(null);
  const [refillFor, setRefillFor] = useState<{ growId: string; max: number } | null>(null);
  const [refillVolume, setRefillVolume] = useState("");
  const [calc, setCalc] = useState<{ growId: string; volume?: number } | null>(null);
  const [confirmStage, setConfirmStage] = useState<{ growId: string; next: GrowStage } | null>(null);
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const today = startOfDay(new Date());
  const activeGrows = growCycles.filter((c) => c.current_stage !== "cure");

  const calendarItems = useMemo(() => {
    const items: { id: string; date: Date; kind: "task" | "event"; title: string; grow_cycle_id: string | null }[] = [];
    tasks.forEach((t) => { if (t.due_date) items.push({ id: t.id, date: new Date(t.due_date), kind: "task", title: t.title, grow_cycle_id: t.grow_cycle_id }); });
    events.forEach((e) => { if (e.date) items.push({ id: e.id, date: new Date(e.date), kind: "event", title: e.title, grow_cycle_id: e.grow_cycle_id || null }); });
    return items;
  }, [tasks, events]);

  const monthDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  }), [month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, typeof calendarItems>();
    calendarItems.forEach((it) => {
      const k = format(it.date, "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    });
    return map;
  }, [calendarItems]);

  const growEnvId = (gid: string | null) => gid ? (growCycles.find((c) => c.id === gid)?.environment_id ?? null) : null;

  const openRefill = (growId: string, max: number) => { setRefillFor({ growId, max }); setRefillVolume(String(max)); };
  const confirmRefill = () => {
    if (!refillFor) return;
    const v = Math.min(parseFloat(refillVolume) || 0, refillFor.max);
    if (v <= 0) return;
    setCalc({ growId: refillFor.growId, volume: v });
    setRefillFor(null);
  };
  const advanceStage = (growId: string) => {
    const c = growCycles.find((x) => x.id === growId); if (!c) return;
    const next = nextStageOf(c.current_stage); if (!next) return;
    setConfirmStage({ growId, next });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-foreground">Home</h1>

      {/* CALENDAR */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{format(month, "MMMM yyyy")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => subMonths(m, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => addMonths(m, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="glass-card p-2">
          <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground uppercase tracking-wide px-1 pb-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d) => {
              const k = format(d, "yyyy-MM-dd");
              const items = itemsByDay.get(k) ?? [];
              const inMonth = isSameMonth(d, month);
              const isToday = isSameDay(d, today);
              const firstWithGrow = items.find((i) => i.grow_cycle_id);
              const tintGid = firstWithGrow?.grow_cycle_id ?? null;
              const tintHue = tintGid ? envHue(growEnvId(tintGid)) : null;
              return (
                <div
                  key={k}
                  className={cn(
                    "relative min-h-[56px] sm:min-h-[68px] rounded-md border p-1 flex flex-col gap-0.5",
                    inMonth ? "border-border/60" : "border-border/20 opacity-50",
                    isToday && "ring-1 ring-primary/60",
                  )}
                  style={tintHue !== null ? { backgroundColor: `hsl(${tintHue} 60% 45% / 0.08)` } : undefined}
                >
                  <div className={cn("text-[10px] font-medium", isToday ? "text-primary" : "text-muted-foreground")}>{format(d, "d")}</div>
                  <div className="flex flex-wrap gap-0.5">
                    {items.slice(0, 4).map((it) => {
                      const hue = envHue(growEnvId(it.grow_cycle_id));
                      const Icon = it.kind === "task" ? ListChecks : CalIcon;
                      return (
                        <span
                          key={`${it.kind}-${it.id}`}
                          title={it.title}
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm"
                          style={{ color: `hsl(${hue} 70% 60%)` }}
                        >
                          <Icon className="w-3 h-3" />
                        </span>
                      );
                    })}
                    {items.length > 4 && <span className="text-[9px] text-muted-foreground">+{items.length - 4}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACTIVE GROWS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Active Grows</h2>
        {activeGrows.length === 0 ? (
          <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No active grows.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGrows.map((cycle) => {
              const env = environments.find((e) => e.id === cycle.environment_id);
              const stageWeek = Math.max(1, Math.floor((Date.now() - new Date(cycle.stage_start_date).getTime()) / (7 * 86400000)) + 1);
              const hasReservoir = !!env?.reservoir_volume && STAGES_NEED_FEED.includes(cycle.current_stage);
              const next = nextStageOf(cycle.current_stage);
              return (
                <div key={cycle.id} className="glass-card p-4 space-y-3">
                  <Link to={`/grows/${cycle.id}`} className="block space-y-1.5 hover:opacity-90">
                    <h3 className="font-semibold text-foreground truncate">{cycle.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{env ? env.name : "No environment"}</p>
                    <div className="flex items-center gap-2">
                      <StageBadge stage={cycle.current_stage} />
                      <span className="text-xs text-muted-foreground">Week {stageWeek}</span>
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="justify-start" onClick={() => setLogParams({ growId: cycle.id, taskId: "" })}>
                      <Activity className="w-3.5 h-3.5 mr-1.5" /> Log Params
                    </Button>
                    {hasReservoir && (
                      <Button size="sm" variant="outline" className="justify-start" onClick={() => openRefill(cycle.id, env!.reservoir_volume!)}>
                        <Droplets className="w-3.5 h-3.5 mr-1.5" /> Refill
                      </Button>
                    )}
                    {next && (
                      <Button size="sm" variant="outline" className="justify-start" onClick={() => advanceStage(cycle.id)}>
                        <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Next: <span className="capitalize ml-1">{next}</span>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="justify-start" onClick={() => setTaskFor(cycle.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Task/Event
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2 pt-4 border-t border-border/50">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">DEV ONLY</p>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmClear(true)}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear All Data
        </Button>
      </section>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear ALL app data?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All grow cycles, plants, environments, parameters, feed schedules, nutrients, tasks, events, and logs will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearAllData(); setConfirmClear(false); }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LogParametersDialog
        open={!!logParams}
        onOpenChange={(o) => !o && setLogParams(null)}
        growCycleId={logParams?.growId ?? null}
        taskId={logParams?.taskId || null}
      />

      <TaskFormDialog open={!!taskFor} onOpenChange={(o) => !o && setTaskFor(null)} growCycleId={taskFor} />

      {calc && (
        <FeedCalculatorDialog
          open={!!calc}
          onOpenChange={(o) => !o && setCalc(null)}
          growCycleId={calc.growId}
          volumeOverride={calc.volume}
        />
      )}

      <Dialog open={!!refillFor} onOpenChange={(o) => !o && setRefillFor(null)}>
        <DialogContent className="bg-card border-border w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> Refill Reservoir</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">Enter volume to fill (max {refillFor?.max} L). Calculator will open with the calculated nutrient amounts.</p>
            <Input type="number" min={0.1} max={refillFor?.max} step="0.1" value={refillVolume} onChange={(e) => setRefillVolume(e.target.value)} className="bg-muted border-border" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRefillFor(null)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={confirmRefill}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmStage} onOpenChange={(o) => !o && setConfirmStage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Progress to next stage?</AlertDialogTitle>
            <AlertDialogDescription>The grow will move to <span className="capitalize font-medium">{confirmStage?.next}</span>. This is logged in the timeline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmStage) return;
              const growId = confirmStage.growId;
              const next = confirmStage.next;
              changeStage(growId, next);
              const cycle = growCycles.find((c) => c.id === growId);
              const env = environments.find((e) => e.id === cycle?.environment_id);
              setConfirmStage(null);
              if (STAGES_NEED_FEED.includes(next) && env?.reservoir_volume) {
                openRefill(growId, env.reservoir_volume);
              }
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
