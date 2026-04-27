import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { STAGES, type GrowStage, type GrowStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function GrowCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { growCycles, stageHistory, environments, environmentTimeline, events, tasks, feedLogs, parameterLogs, plants, strains, changeStage, updateGrowCycle, moveGrowEnvironment, addPlants, removePlant } = useStore();

  const [addStrainId, setAddStrainId] = useState("");
  const [addQty, setAddQty] = useState("1");

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
  const cyclePlants = plants.filter((p) => p.grow_cycle_id === id);
  const activePlants = cyclePlants.filter((p) => p.status === "active");
  const removedPlants = cyclePlants.filter((p) => p.status === "removed");
  const daysSinceStart = Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000);

  const eligibleEnvs = environments.filter((e) => e.supported_stages.includes(cycle.current_stage));
  const currentEnv = environments.find((e) => e.id === cycle.environment_id);
  const overCapacity = currentEnv ? activePlants.length > currentEnv.site_count : false;

  const grow_name_short = (cycle.custom_name || cycle.name.split(" - ")[0] || "Grow").replace(/\s+/g, "");

  const doAddPlants = () => {
    const strain = strains.find((s) => s.id === addStrainId);
    const qty = parseInt(addQty) || 0;
    if (!strain || qty <= 0) return;
    addPlants(cycle.id, strain, qty, grow_name_short);
    setAddStrainId(""); setAddQty("1");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate("/grows")} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Grows
      </Button>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{cycle.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Day {daysSinceStart} · Started {format(new Date(cycle.start_date), "MMMM d, yyyy")} · Est. {cycle.flower_weeks}w flower
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

        {/* Stage controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Current stage</label>
            <Select value={cycle.current_stage} onValueChange={(v) => changeStage(cycle.id, v as GrowStage)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Environment (filtered by stage)</label>
            <Select value={cycle.environment_id ?? ""} onValueChange={(v) => moveGrowEnvironment(cycle.id, v)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue placeholder={eligibleEnvs.length === 0 ? "No matching environment" : "Select environment"} /></SelectTrigger>
              <SelectContent>{eligibleEnvs.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.site_count} sites)</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {overCapacity && currentEnv && (
          <p className="text-xs text-warning mt-3">⚠ {activePlants.length} active plants exceed environment capacity ({currentEnv.site_count} sites). Remove plants below.</p>
        )}
      </div>

      <Tabs defaultValue="plants" className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="plants">Plants ({activePlants.length})</TabsTrigger>
          <TabsTrigger value="overview">Stages</TabsTrigger>
          <TabsTrigger value="events">Events ({cycleEvents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({cycleTasks.length})</TabsTrigger>
          <TabsTrigger value="feed">Feed Logs ({cycleFeedLogs.length})</TabsTrigger>
          <TabsTrigger value="params">Parameters ({cycleParams.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plants" className="space-y-4">
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Add plants</h3>
            <div className="grid grid-cols-[1fr_88px_auto] gap-2">
              <Select value={addStrainId} onValueChange={setAddStrainId}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Strain" /></SelectTrigger>
                <SelectContent>{strains.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={1} value={addQty} onChange={(e) => setAddQty(e.target.value)} className="bg-muted border-border" />
              <Button onClick={doAddPlants} disabled={!addStrainId} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </div>
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Active plants ({activePlants.length})</h3>
            {activePlants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active plants.</p>
            ) : (
              <div className="space-y-1">
                {activePlants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                    <div>
                      <span className="text-foreground font-medium">{p.plant_tag}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.strain_name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePlant(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {removedPlants.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Removed ({removedPlants.length})</h3>
              <div className="space-y-1 opacity-60">
                {removedPlants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/30 text-sm line-through">
                    <span>{p.plant_tag}</span>
                    <span className="text-xs text-muted-foreground">{p.removed_at && format(new Date(p.removed_at), "MMM d")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

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
            {environmentTimeline.filter((t) => t.grow_cycle_id === id).length > 0 && (
              <>
                <h3 className="font-semibold text-foreground mt-6 mb-3">Environment Timeline</h3>
                <div className="space-y-2">
                  {environmentTimeline.filter((t) => t.grow_cycle_id === id).map((t) => (
                    <div key={t.id} className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{t.environment_name}</span> · {format(new Date(t.start_date), "MMM d")}{t.end_date && ` → ${format(new Date(t.end_date), "MMM d")}`}
                    </div>
                  ))}
                </div>
              </>
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
                    <span className="capitalize text-xs text-muted-foreground w-24 shrink-0">{e.type.replace(/_/g, " ")}</span>
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
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {cycleTasks.map((t) => (
                  <div key={t.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm", t.completed && "opacity-50")}>
                    <span className={cn("font-medium text-foreground", t.completed && "line-through")}>{t.title}</span>
                    {t.due_date && <span className="text-xs text-muted-foreground ml-auto">{format(new Date(t.due_date), "MMM d")}</span>}
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
                      {f.nutrients.map((n) => `${n.name}: ${n.amount.toFixed(2)}${n.unit}`).join(" · ")}
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
