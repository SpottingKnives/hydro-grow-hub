import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { STAGES, type GrowStage, type GrowStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function GrowCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { growCycles, stageHistory, environments, environmentTimeline, events, tasks, feedLogs, parameterLogs, plants, strains, changeStage, updateGrowCycle, moveGrowEnvironment, assignPlantToSlot, removePlant } = useStore();

  const [slotDialog, setSlotDialog] = useState<number | null>(null);
  const [pickStrainId, setPickStrainId] = useState("");
  const [pendingEnvId, setPendingEnvId] = useState<string | null>(null);
  const [removeForEnv, setRemoveForEnv] = useState<string[]>([]);

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
  const stageWeek = Math.max(1, Math.floor((Date.now() - new Date(cycle.stage_start_date).getTime()) / (7 * 86400000)) + 1);

  const eligibleEnvs = environments.filter((e) => e.supported_stages.includes(cycle.current_stage));
  const currentEnv = environments.find((e) => e.id === cycle.environment_id);
  const siteCount = currentEnv?.site_count ?? 0;
  const slots = Array.from({ length: siteCount }, (_, i) => activePlants.find((p) => p.slot_index === i) ?? null);

  const tryEnvChange = (envId: string) => {
    if (!envId) return;
    const target = environments.find((e) => e.id === envId);
    if (!target) return;
    if (activePlants.length > target.site_count) {
      setPendingEnvId(envId);
      setRemoveForEnv([]);
      return;
    }
    moveGrowEnvironment(cycle.id, envId);
  };

  const confirmDownsize = () => {
    if (!pendingEnvId) return;
    const target = environments.find((e) => e.id === pendingEnvId);
    if (!target) return;
    const needed = activePlants.length - target.site_count;
    if (removeForEnv.length < needed) return;
    removeForEnv.forEach((pid) => removePlant(pid));
    moveGrowEnvironment(cycle.id, pendingEnvId);
    setPendingEnvId(null); setRemoveForEnv([]);
  };

  const onAssign = () => {
    const strain = strains.find((s) => s.id === pickStrainId);
    if (!strain || slotDialog === null) return;
    assignPlantToSlot(cycle.id, slotDialog, strain);
    setSlotDialog(null); setPickStrainId("");
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
            <p className="text-sm text-muted-foreground mt-1 capitalize">Stage: {cycle.current_stage} — Week {stageWeek}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={cycle.status} />
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Current stage" helper="Manual transitions only">
            <Select value={cycle.current_stage} onValueChange={(v) => changeStage(cycle.id, v as GrowStage)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Environment" helper="Filtered by current stage">
            <Select value={cycle.environment_id ?? ""} onValueChange={tryEnvChange}>
              <SelectTrigger className="bg-muted border-border"><SelectValue placeholder={eligibleEnvs.length === 0 ? "No matching environment" : "Select environment"} /></SelectTrigger>
              <SelectContent>{eligibleEnvs.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.site_count} sites)</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      <Tabs defaultValue="plants" className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="plants">Plants ({activePlants.length}{currentEnv ? `/${siteCount}` : ""})</TabsTrigger>
          <TabsTrigger value="overview">Stages</TabsTrigger>
          <TabsTrigger value="events">Events ({cycleEvents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({cycleTasks.length})</TabsTrigger>
          <TabsTrigger value="feed">Feed Logs ({cycleFeedLogs.length})</TabsTrigger>
          <TabsTrigger value="params">Parameters ({cycleParams.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plants" className="space-y-4">
          {!currentEnv ? (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Select an environment above to allocate plant slots.</p>
            </div>
          ) : (
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Plant Slots</h3>
                <p className="text-xs text-muted-foreground">{activePlants.length} of {siteCount} sites assigned</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {slots.map((p, i) => (
                  <div key={i} className={cn("rounded-lg border p-3 flex flex-col gap-1.5 min-h-[88px]", p ? "bg-muted border-border" : "bg-muted/30 border-dashed border-border")}>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Site {i + 1}</div>
                    {p ? (
                      <>
                        <div className="text-sm text-foreground font-medium truncate">{p.strain_name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{p.plant_tag}</div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive justify-start px-1 -mx-1" onClick={() => removePlant(p.id)}>
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs justify-start px-1 -mx-1 text-primary" onClick={() => { setSlotDialog(i); setPickStrainId(""); }}>
                        <Plus className="w-3 h-3 mr-1" /> Assign
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {removedPlants.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Removed ({removedPlants.length})</h3>
              <div className="space-y-1 opacity-60">
                {removedPlants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-muted/30 text-xs line-through">
                    <span>{p.plant_tag}</span>
                    <span className="text-muted-foreground">{p.removed_at && format(new Date(p.removed_at), "MMM d")}</span>
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
                      <span className="font-medium text-foreground">{f.water_volume || f.liters}L water</span>
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
            <p className="text-sm text-muted-foreground">Parameter logging UI coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign slot dialog */}
      <Dialog open={slotDialog !== null} onOpenChange={(o) => !o && setSlotDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Assign Plant — Site {slotDialog !== null ? slotDialog + 1 : ""}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Strain" required>
              <Select value={pickStrainId} onValueChange={setPickStrainId}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select strain" /></SelectTrigger>
                <SelectContent>{strains.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormFooter onSave={onAssign} onCancel={() => setSlotDialog(null)} saveLabel="Assign" saveDisabled={!pickStrainId} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Downsize plant removal dialog */}
      <AlertDialog open={!!pendingEnvId} onOpenChange={(o) => !o && setPendingEnvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reduce plants to fit new environment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Remove {Math.max(0, activePlants.length - (environments.find((e) => e.id === pendingEnvId)?.site_count ?? 0))} plants to match environment capacity.</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {activePlants.map((p) => {
                    const checked = removeForEnv.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={() => setRemoveForEnv((r) => r.includes(p.id) ? r.filter((x) => x !== p.id) : [...r, p.id])} />
                        <span>{p.plant_tag} <span className="text-muted-foreground">({p.strain_name})</span></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDownsize} disabled={removeForEnv.length < (activePlants.length - (environments.find((e) => e.id === pendingEnvId)?.site_count ?? 0))}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
