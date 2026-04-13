import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { STAGES, type GrowStage, type GrowStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function GrowCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { growCycles, stageHistory, events, tasks, feedLogs, parameterLogs, changeStage, updateGrowCycle } = useStore();

  const cycle = growCycles.find((c) => c.id === id);
  if (!cycle) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Grow cycle not found</p>
      <Button variant="ghost" onClick={() => navigate("/grows")} className="mt-4">Go back</Button>
    </div>
  );

  const history = stageHistory.filter((h) => h.grow_cycle_id === id).sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  const cycleEvents = events.filter((e) => e.grow_cycle_id === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const cycleTasks = tasks.filter((t) => t.grow_cycle_id === id);
  const cycleFeedLogs = feedLogs.filter((f) => f.grow_cycle_id === id);
  const cycleParams = parameterLogs.filter((p) => p.grow_cycle_id === id);
  const daysSinceStart = Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000);
  const currentStageIdx = STAGES.indexOf(cycle.current_stage);
  const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate("/grows")} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Grows
      </Button>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{cycle.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Day {daysSinceStart} · Started {format(new Date(cycle.start_date), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={cycle.status} onValueChange={(v) => updateGrowCycle(cycle.id, { status: v as GrowStatus })}>
              <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stage progress */}
        <div className="mt-6">
          <div className="flex items-center gap-1 mb-3">
            {STAGES.map((stage, idx) => (
              <div key={stage} className="flex items-center">
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-default",
                  idx <= currentStageIdx ? `${STAGES[idx] === cycle.current_stage ? 'ring-2 ring-primary/50' : ''} bg-primary/20 text-primary` : "bg-muted text-muted-foreground"
                )}>
                  {stage}
                </div>
                {idx < STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />}
              </div>
            ))}
          </div>
          {nextStage && cycle.status === "active" && (
            <Button size="sm" onClick={() => changeStage(cycle.id, nextStage)} className="gradient-primary text-primary-foreground">
              Advance to {nextStage}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events ({cycleEvents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({cycleTasks.length})</TabsTrigger>
          <TabsTrigger value="feed">Feed Logs ({cycleFeedLogs.length})</TabsTrigger>
          <TabsTrigger value="params">Parameters ({cycleParams.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Stage History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stage history yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-sm">
                    <StageBadge stage={h.stage} />
                    <span className="text-muted-foreground">
                      {format(new Date(h.started_at), "MMM d, yyyy")}
                      {h.ended_at && ` → ${format(new Date(h.ended_at), "MMM d, yyyy")}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="glass-card p-4">
            {cycleEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <div className="space-y-2">
                {cycleEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                    <span className="capitalize text-xs text-muted-foreground w-20 shrink-0">{e.type}</span>
                    <span className="font-medium text-foreground">{e.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(e.date), "MMM d")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="glass-card p-4">
            {cycleTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet. Add tasks from the Tasks page.</p>
            ) : (
              <div className="space-y-2">
                {cycleTasks.map((t) => (
                  <div key={t.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm", t.completed && "opacity-50")}>
                    <span className={cn("font-medium text-foreground", t.completed && "line-through")}>{t.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto capitalize">{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feed">
          <div className="glass-card p-4">
            {cycleFeedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feed logs yet.</p>
            ) : (
              <div className="space-y-2">
                {cycleFeedLogs.map((f) => (
                  <div key={f.id} className="px-3 py-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{f.water_volume}L water</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(f.date), "MMM d")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {f.nutrients.map((n) => `${n.name}: ${n.amount}${n.unit}`).join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="params">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Log parameters from the Logs page.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
