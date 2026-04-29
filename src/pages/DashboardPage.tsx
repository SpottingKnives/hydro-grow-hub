import { useStore } from "@/store/useStore";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import { Calendar as CalIcon, ListChecks } from "lucide-react";
import { StageBadge } from "@/components/StageBadge";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { growCycles, events, tasks, environments } = useStore();

  const today = startOfDay(new Date());
  const weekAhead = addDays(today, 7);

  const upcoming = [
    ...tasks.filter((t) => t.due_date && !t.completed).map((t) => ({ kind: "task" as const, id: t.id, title: t.title, date: t.due_date as string, type: "task", grow_cycle_id: t.grow_cycle_id })),
    ...events.map((e) => ({ kind: "event" as const, id: e.id, title: e.title, date: e.date, type: e.type, grow_cycle_id: e.grow_cycle_id })),
  ]
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
            {upcoming.map((it) => (
              <div key={`${it.kind}-${it.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50">
                {it.kind === "task" ? <ListChecks className="w-4 h-4 text-warning shrink-0" /> : <CalIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{it.kind === "task" ? "task" : it.type.replace(/_/g, " ")}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{format(new Date(it.date), "EEE, MMM d")}</span>
              </div>
            ))}
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
    </div>
  );
}
