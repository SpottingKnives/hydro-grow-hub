import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Trash2, ChevronRight, AlertTriangle } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { STAGES, type FeedMode, type GrowCycle, type GrowStage, type Plant } from "@/types";
import { Link } from "react-router-dom";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function GrowCyclesPage() {
  const { growCycles, environments, feedSchedules, strains, plants, addGrowCycle, deleteGrowCycle, moveGrowEnvironment } = useStore();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    custom: "Grow",
    starting_stage: "veg" as GrowStage,
    flower_weeks: "8",
    environment_id: "",
    feed_schedule_id: "",
    feed_mode: "fixed" as FeedMode,
    strain_id: "",
    plant_count: "1",
  });
  const [selected, setSelected] = useState<{ strain_id: string; plant_count: string }[]>([]);

  const addStrain = () => {
    if (!form.strain_id) return;
    setSelected([...selected, { strain_id: form.strain_id, plant_count: form.plant_count || "1" }]);
    setForm({ ...form, strain_id: "", plant_count: "1" });
  };

  const generatedName = `${form.custom.trim() || "Grow"} - ${todayStr()}`;
  const eligibleEnvs = environments.filter((e) => e.supported_stages.includes(form.starting_stage));

  const create = () => {
    const gid = crypto.randomUUID();
    const start = new Date().toISOString();
    const flower = parseInt(form.flower_weeks) || 8;
    const cycle: GrowCycle = {
      id: gid, name: generatedName, custom_name: form.custom.trim() || "Grow",
      start_date: start, status: "active",
      current_stage: form.starting_stage, stage_start_date: start,
      flower_weeks: flower, feed_mode: form.feed_mode,
      environment_id: null, feed_schedule_id: form.feed_schedule_id || null,
      strains: selected.map((s) => s.strain_id),
      created_at: new Date().toISOString(),
    };
    // Generate plant records
    const plantRecs: Plant[] = [];
    const counts: Record<string, number> = {};
    for (const link of selected) {
      const strain = strains.find((x) => x.id === link.strain_id);
      if (!strain) continue;
      const qty = parseInt(link.plant_count) || 1;
      const base = `${strain.name.replace(/\s+/g, "")}-${(form.custom.trim() || "Grow").replace(/\s+/g, "")}`;
      for (let i = 0; i < qty; i++) {
        counts[strain.id] = (counts[strain.id] || 0) + 1;
        plantRecs.push({
          id: crypto.randomUUID(), grow_cycle_id: gid, strain_id: strain.id, strain_name: strain.name,
          plant_tag: `${base}-${String(counts[strain.id]).padStart(2, "0")}`,
          status: "active", created_at: new Date().toISOString(), removed_at: null,
        });
      }
    }
    addGrowCycle(cycle, plantRecs);
    if (form.environment_id) setTimeout(() => moveGrowEnvironment(gid, form.environment_id, todayStr()), 0);
    setOpen(false);
    setSelected([]);
    setForm({ custom: "Grow", starting_stage: "veg", flower_weeks: "8", environment_id: "", feed_schedule_id: "", feed_mode: "fixed", strain_id: "", plant_count: "1" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Grow Cycles</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Grow</Button>
      </div>
      {growCycles.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No grow cycles yet.</p></div>
      ) : (
        <div className="space-y-3">
          {[...growCycles].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((cycle) => {
            const days = Math.max(0, Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000));
            const cyclePlants = plants.filter((p) => p.grow_cycle_id === cycle.id);
            const active = cyclePlants.filter((p) => p.status === "active");
            const flowerTimes = new Set<number>();
            active.forEach((p) => { const s = strains.find((x) => x.id === p.strain_id); if (s) flowerTimes.add(s.flower_weeks); });
            const byStrain: Record<string, number> = {};
            active.forEach((p) => { byStrain[p.strain_name] = (byStrain[p.strain_name] || 0) + 1; });
            return (
              <Link key={cycle.id} to={`/grows/${cycle.id}`} className="glass-card p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors block">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{cycle.name}</h3>
                  <p className="text-xs text-muted-foreground">Day {days} · {active.length} plants · est. {cycle.flower_weeks}w flower · {cycle.feed_mode}</p>
                  {Object.keys(byStrain).length > 0 && <p className="text-xs text-muted-foreground truncate">{Object.entries(byStrain).map(([n, c]) => `${n} x${c}`).join(" · ")}</p>}
                  {flowerTimes.size > 1 && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Mixed flowering times</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StageBadge stage={cycle.current_stage} />
                  <StatusBadge status={cycle.status} />
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); setConfirmDelete(cycle.id); }}><Trash2 className="w-4 h-4" /></Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader><DialogTitle>New Grow Cycle</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Name Prefix" htmlFor="grow-prefix" helper={<>Will be saved as <span className="text-primary">{generatedName}</span></>}>
              <Input id="grow-prefix" value={form.custom} onChange={(e) => setForm({ ...form, custom: e.target.value })} className="bg-muted border-border" />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Starting Stage" helper="Determines which environments are eligible">
                <Select value={form.starting_stage} onValueChange={(v) => setForm({ ...form, starting_stage: v as GrowStage, environment_id: "" })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Est. Flower Duration (weeks)" htmlFor="grow-flower" helper="Used for stage timing suggestions">
                <Input id="grow-flower" type="number" inputMode="decimal" step="0.1" min="0" value={form.flower_weeks} onChange={(e) => setForm({ ...form, flower_weeks: e.target.value })} className="bg-muted border-border" />
              </FormField>
            </div>

            <FormField label="Feed Mode" helper="Fixed follows the schedule exactly. Guided suggests values and logs your actual measurements.">
              <Select value={form.feed_mode} onValueChange={(v) => setForm({ ...form, feed_mode: v as FeedMode })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed feed</SelectItem>
                  <SelectItem value="guided">Guided feed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Environment" helper={eligibleEnvs.length === 0 ? "No environment supports the selected starting stage" : "Filtered by starting stage"}>
                <Select value={form.environment_id} onValueChange={(v) => setForm({ ...form, environment_id: v })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder={eligibleEnvs.length === 0 ? "No matching environment" : "Select environment"} /></SelectTrigger>
                  <SelectContent>{eligibleEnvs.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Feed Schedule" helper="Optional. Can be set later.">
                <Select value={form.feed_schedule_id} onValueChange={(v) => setForm({ ...form, feed_schedule_id: v })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select schedule" /></SelectTrigger>
                  <SelectContent>{feedSchedules.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Plants" helper="Tags will be generated as Strain-GrowName-NN">
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_88px_auto] gap-2">
                  <Select value={form.strain_id} onValueChange={(v) => setForm({ ...form, strain_id: v })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select strain" /></SelectTrigger>
                    <SelectContent>{strains.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={1} value={form.plant_count} onChange={(e) => setForm({ ...form, plant_count: e.target.value })} className="bg-muted border-border" />
                  <Button variant="outline" onClick={addStrain} disabled={!form.strain_id}>Add</Button>
                </div>
                {selected.map((s, i) => {
                  const st = strains.find((x) => x.id === s.strain_id);
                  return (
                    <div key={`${s.strain_id}-${i}`} className="flex justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span>{st?.name} ×{s.plant_count}</span>
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => setSelected(selected.filter((_, idx) => idx !== i))}>Remove</button>
                    </div>
                  );
                })}
              </div>
            </FormField>

            <FormFooter
              onSave={create}
              onCancel={() => setOpen(false)}
              saveLabel="Create Grow"
              saveDisabled={selected.length === 0}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete grow cycle?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the grow cycle and all linked plants, tasks, events, and timeline entries. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDelete) deleteGrowCycle(confirmDelete); setConfirmDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
