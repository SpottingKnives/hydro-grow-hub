import { useState } from "react";
import { useStore } from "@/store/useStore";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import { Calendar as CalIcon, ListChecks, Trash2 } from "lucide-react";
import { StageBadge } from "@/components/StageBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogParametersDialog } from "@/components/LogParametersDialog";

export default function DashboardPage() {
  const { growCycles, tasks, environments, clearAllData } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [logParams, setLogParams] = useState<{ growId: string | null; taskId: string } | null>(null);

  const today = startOfDay(new Date());
  const weekAhead = addDays(today, 7);

  const upcoming = tasks
    .filter((t) => t.due_date && !t.completed)
    .map((t) => ({ kind: "task" as const, id: t.id, title: t.title, date: t.due_date as string, type: "task", grow_cycle_id: t.grow_cycle_id }))
    .filter((it) => {
      const d = new Date(it.date);
      return !isBefore(d, today) && !isAfter(d, weekAhead);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeGrows = growCycles.filter((c) => c.current_stage !== "cure");

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-foreground">Home</h1>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Upcoming (next 7 days)</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">Nothing scheduled.</p></div>
        ) : (
          <div className="glass-card p-3 space-y-1">
            {upcoming.map((it) => {
              const isLogParams = it.kind === "task" && it.title === "Log Parameters";
              return (
              <div key={`${it.kind}-${it.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50">
                {it.kind === "task" ? <ListChecks className="w-4 h-4 text-warning shrink-0" /> : <CalIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  {isLogParams ? (
                    <button
                      type="button"
                      onClick={() => setLogParams({ growId: it.grow_cycle_id, taskId: it.id })}
                      className="text-sm font-medium text-primary truncate text-left underline-offset-2 hover:underline"
                    >
                      {it.title}
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                  )}
                  <p className="text-[12px] leading-tight text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    <span>Upcoming</span>
                    {" • "}
                    <span className="capitalize">{it.kind === "task" ? "Task" : it.type.replace(/_/g, " ")}</span>
                    {" • "}
                    <span>{format(new Date(it.date), "d MMM HH:mm")}</span>
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Active Grows</h2>
        {activeGrows.length === 0 ? (
          <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No active grows.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeGrows.map((cycle) => {
              const env = environments.find((e) => e.id === cycle.environment_id);
              const stageWeek = Math.max(1, Math.floor((Date.now() - new Date(cycle.stage_start_date).getTime()) / (7 * 86400000)) + 1);
              return (
                <Link key={cycle.id} to={`/grows/${cycle.id}`} className="glass-card p-4 space-y-2 hover:border-primary/30 transition-colors block">
                  <h3 className="font-semibold text-foreground truncate">{cycle.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{env ? env.name : "No environment"}</p>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={cycle.current_stage} />
                    <span className="text-xs text-muted-foreground capitalize">Week {stageWeek}</span>
                  </div>
                </Link>
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
        taskId={logParams?.taskId ?? null}
      />
    </div>
  );
}
