import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Trash2, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { StrainsSection } from "@/components/StrainsSection";
import { LibraryRow } from "@/components/LibraryRow";
import { STAGES, type FeedMode, type GrowCycle, type GrowStage, type Plant, type Strain } from "@/types";
import { Link } from "react-router-dom";

const todayStr = () => new Date().toISOString().slice(0, 10);
const ADD_NEW_STRAIN = "__add_new_strain__";

export default function GrowCyclesPage() {
  const { growCycles, environments, feedSchedules, plants, strains, addGrowCycle, addStrain, deleteGrowCycle, moveGrowEnvironment, assignPlantToSlot } = useStore();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [strainCreateOpen, setStrainCreateOpen] = useState(false);
  const [strainDraft, setStrainDraft] = useState({ name: "", flower_weeks: "8" });
  const [plantRows, setPlantRows] = useState<{ tmpId: string; strain_id: string }[]>([]);
  const [form, setForm] = useState({
    custom: "Grow",
    starting_stage: "veg" as GrowStage,
    flower_weeks: "8",
    environment_id: "",
    feed_schedule_id: "",
    feed_mode: "fixed" as FeedMode,
  });

  const generatedName = `${form.custom.trim() || "Grow"} - ${todayStr()}`;
  const eligibleEnvs = environments.filter((e) => e.supported_stages.includes(form.starting_stage));
  const selectedEnv = environments.find((e) => e.id === form.environment_id);
  const siteCount = selectedEnv?.site_count ?? 0;
  const overCapacity = siteCount > 0 && plantRows.length > siteCount;

  const addPlantRow = () => {
    if (siteCount > 0 && plantRows.length >= siteCount) return;
    setPlantRows((r) => [...r, { tmpId: crypto.randomUUID(), strain_id: "" }]);
  };
  const updatePlantRow = (tmpId: string, strain_id: string) => {
    if (strain_id === ADD_NEW_STRAIN) {
      setStrainCreateOpen(true);
      return;
    }
    setPlantRows((r) => r.map((x) => x.tmpId === tmpId ? { ...x, strain_id } : x));
  };
  const removePlantRow = (tmpId: string) => setPlantRows((r) => r.filter((x) => x.tmpId !== tmpId));
  const movePlantRow = (tmpId: string, dir: "up" | "down") => {
    setPlantRows((r) => {
      const idx = r.findIndex((x) => x.tmpId === tmpId);
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= r.length) return r;
      const copy = [...r]; [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const saveDraftStrain = () => {
    const name = strainDraft.name.trim(); if (!name) return;
    const flower = parseFloat(strainDraft.flower_weeks) || 8;
    const newStrain: Strain = {
      id: crypto.randomUUID(), name, breeder: "", veg_weeks: 0, flower_weeks: flower,
      traits: [], notes: "", active: true, updated_at: new Date().toISOString(),
    };
    addStrain(newStrain);
    // auto-assign to the last empty row (or add a new row)
    setPlantRows((r) => {
      const emptyIdx = r.findIndex((x) => !x.strain_id);
      if (emptyIdx >= 0) {
        const copy = [...r]; copy[emptyIdx] = { ...copy[emptyIdx], strain_id: newStrain.id }; return copy;
      }
      return [...r, { tmpId: crypto.randomUUID(), strain_id: newStrain.id }];
    });
    setStrainDraft({ name: "", flower_weeks: "8" });
    setStrainCreateOpen(false);
  };

  const create = () => {
    const gid = crypto.randomUUID();
    const start = new Date().toISOString();
    const flower = parseInt(form.flower_weeks) || 8;
    const validRows = plantRows.filter((r) => r.strain_id);
    const builtPlants: Plant[] = validRows.map((r, i) => {
      const strain = strains.find((s) => s.id === r.strain_id)!;
      const baseName = (form.custom.trim() || "Grow").replace(/\s+/g, "");
      return {
        id: crypto.randomUUID(),
        grow_cycle_id: gid,
        strain_id: strain.id,
        strain_name: strain.name,
        plant_tag: `${strain.name.replace(/\s+/g, "")}-${baseName}-${String(i + 1).padStart(2, "0")}`,
        status: "active",
        created_at: start,
        removed_at: null,
        slot_index: i,
      };
    });
    const cycle: GrowCycle = {
      id: gid, name: generatedName, custom_name: form.custom.trim() || "Grow",
      start_date: start, status: "active",
      current_stage: form.starting_stage, stage_start_date: start,
      flower_weeks: flower, feed_mode: form.feed_mode,
      environment_id: null, feed_schedule_id: form.feed_schedule_id || null,
      strains: [],
      created_at: new Date().toISOString(),
    };
    addGrowCycle(cycle, builtPlants);
    if (form.environment_id) setTimeout(() => moveGrowEnvironment(gid, form.environment_id, todayStr(), true), 0);
    setOpen(false);
    setForm({ custom: "Grow", starting_stage: "veg", flower_weeks: "8", environment_id: "", feed_schedule_id: "", feed_mode: "fixed" });
    setPlantRows([]);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Grow Cycles</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Grow
        </Button>
        <LibraryRow label="Strains" onManage={() => setLibraryOpen(true)} />
      </div>
      {growCycles.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No grow cycles yet.</p></div>
      ) : (
        <div className="space-y-3">
          {[...growCycles].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((cycle) => {
            const days = Math.max(0, Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000));
            const cyclePlants = plants.filter((p) => p.grow_cycle_id === cycle.id);
            const active = cyclePlants.filter((p) => p.status === "active");
            const byStrain: Record<string, number> = {};
            active.forEach((p) => { byStrain[p.strain_name] = (byStrain[p.strain_name] || 0) + 1; });
            return (
              <Link key={cycle.id} to={`/grows/${cycle.id}`} className="glass-card p-4 flex items-center justify-between gap-2 hover:border-primary/30 transition-colors block">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground break-words">{cycle.name}</h3>
                  <p className="text-xs text-muted-foreground break-words">Day {days} · {active.length} plants · est. {cycle.flower_weeks}w flower · {cycle.feed_mode}</p>
                  {Object.keys(byStrain).length > 0 && <p className="text-xs text-muted-foreground break-words">{Object.entries(byStrain).map(([n, c]) => `${n} x${c}`).join(" · ")}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StageBadge stage={cycle.current_stage} />
                  <StatusBadge status={cycle.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); setConfirmDelete(cycle.id); }}><Trash2 className="w-4 h-4" /></Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[calc(100vw-1rem)] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0"><DialogTitle>New Grow Cycle</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2 px-6 overflow-y-auto flex-1 min-h-0">
            <FormField label="Name Prefix" htmlFor="grow-prefix" helper={<>Will be saved as <span className="text-primary">{generatedName}</span></>}>
              <Input id="grow-prefix" value={form.custom} onChange={(e) => setForm({ ...form, custom: e.target.value })} className="bg-muted border-border" />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <FormField
              label={`Plants${siteCount > 0 ? ` (${plantRows.length}/${siteCount})` : ""}`}
              helper={selectedEnv ? "Each row = one plant slot. Reorder with arrows." : "Select an environment to set plant capacity."}
            >
              <div className="space-y-2">
                {plantRows.map((r, i) => (
                  <div key={r.tmpId} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-6 shrink-0 text-center">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Select value={r.strain_id || undefined} onValueChange={(v) => updatePlantRow(r.tmpId, v)}>
                        <SelectTrigger className="bg-muted border-border h-9"><SelectValue placeholder="Select strain" /></SelectTrigger>
                        <SelectContent>
                          {strains.filter((s) => s.active).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          <SelectItem value={ADD_NEW_STRAIN}>+ Create New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={i === 0} onClick={() => movePlantRow(r.tmpId, "up")}><ArrowUp className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={i === plantRows.length - 1} onClick={() => movePlantRow(r.tmpId, "down")}><ArrowDown className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePlantRow(r.tmpId)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPlantRow} disabled={siteCount > 0 && plantRows.length >= siteCount} className="w-full sm:w-auto">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Plant
                </Button>
                {overCapacity && <p className="text-xs text-destructive">Exceeds environment capacity ({siteCount} sites).</p>}
              </div>
            </FormField>

          </div>
          <div className="px-6 pb-6 pt-2 border-t border-border/50 bg-card shrink-0">
            <FormFooter
              onSave={create}
              onCancel={() => setOpen(false)}
              saveLabel="Create Grow"
              saveDisabled={overCapacity}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={strainCreateOpen} onOpenChange={setStrainCreateOpen}>
        <DialogContent className="bg-card border-border w-[calc(100vw-1rem)]">
          <DialogHeader><DialogTitle>New Strain</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Strain Name" htmlFor="quick-strain" required>
              <Input id="quick-strain" autoFocus value={strainDraft.name} onChange={(e) => setStrainDraft({ ...strainDraft, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Est. Flower Duration (weeks)" htmlFor="quick-flower">
              <Input id="quick-flower" type="number" min="0" step="0.1" value={strainDraft.flower_weeks} onChange={(e) => setStrainDraft({ ...strainDraft, flower_weeks: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormFooter onSave={saveDraftStrain} onCancel={() => setStrainCreateOpen(false)} saveLabel="Create & Use" saveDisabled={!strainDraft.name.trim()} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete grow cycle?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the grow cycle and all linked plants, tasks, events, and timeline entries. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDelete) deleteGrowCycle(confirmDelete); setConfirmDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="bg-card border-border max-w-3xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Strains Library</DialogTitle></DialogHeader>
          <div className="mt-2"><StrainsSection /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
