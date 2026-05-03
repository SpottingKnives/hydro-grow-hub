import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { STAGE_GROUPS, type Environment, type GrowStage } from "@/types";
import { cn } from "@/lib/utils";

const empty = {
  name: "",
  site_count: "",
  supported_stages: [] as GrowStage[],
  system_description: "",
  parameter_ids: [] as string[],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Environment | null;
  defaultStages?: GrowStage[];
  onCreated?: (id: string) => void;
  saveLabel?: string;
}

export function EnvironmentFormDialog({ open, onOpenChange, initial, defaultStages, onCreated, saveLabel }: Props) {
  const { parameters, addEnvironment, updateEnvironment, deleteEnvironment, addParameter } = useStore();
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [newParam, setNewParam] = useState({ name: "", unit: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        id: initial.id,
        name: initial.name,
        site_count: String(initial.site_count),
        supported_stages: initial.supported_stages,
        system_description: initial.system_description,
        parameter_ids: initial.parameter_ids.filter((id) => parameters.find((p) => p.id === id)?.active),
        updated_at: initial.updated_at,
      });
    } else {
      setForm({ ...empty, supported_stages: defaultStages ?? [] });
    }
    setNewParam({ name: "", unit: "" });
  }, [open, initial, defaultStages, parameters]);

  const toggleStageGroup = (stages: GrowStage[]) =>
    setForm((p) => {
      const all = stages.every((s) => p.supported_stages.includes(s));
      return { ...p, supported_stages: all ? p.supported_stages.filter((s) => !stages.includes(s)) : Array.from(new Set([...p.supported_stages, ...stages])) };
    });

  const toggleParameter = (pid: string) =>
    setForm((p) => ({ ...p, parameter_ids: p.parameter_ids.includes(pid) ? p.parameter_ids.filter((id) => id !== pid) : [...p.parameter_ids, pid] }));

  const createParam = () => {
    if (!newParam.name.trim()) return;
    const p = { id: crypto.randomUUID(), name: newParam.name.trim(), unit: newParam.unit.trim(), active: true };
    addParameter(p);
    setForm((f) => ({ ...f, parameter_ids: [...f.parameter_ids, p.id] }));
    setNewParam({ name: "", unit: "" });
  };

  const save = () => {
    if (!form.name.trim()) return;
    const base = {
      name: form.name.trim(),
      site_count: parseInt(form.site_count) || 1,
      supported_stages: form.supported_stages,
      system_description: form.system_description,
      parameter_ids: form.parameter_ids,
    };
    if (form.id) {
      updateEnvironment(form.id, base);
      onCreated?.(form.id);
    } else {
      const id = crypto.randomUUID();
      addEnvironment({ id, ...base, task_templates: [] });
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Environment" : "New Environment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Environment Name" htmlFor="env-name" required>
              <Input id="env-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Site Count" htmlFor="env-sites" required helper="Number of plant sites this environment supports">
              <Input id="env-sites" type="number" min={1} value={form.site_count} onChange={(e) => setForm({ ...form, site_count: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="System Description" htmlFor="env-desc" helper="Optional notes on lighting, medium, irrigation, etc.">
              <Textarea id="env-desc" value={form.system_description} onChange={(e) => setForm({ ...form, system_description: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Supported Stages" helper="Selecting Flower includes all 4 flower sub-stages">
              <div className="flex flex-wrap gap-2">
                {STAGE_GROUPS.map((group) => {
                  const active = group.stages.every((s) => form.supported_stages.includes(s));
                  return (
                    <button key={group.label} type="button" onClick={() => toggleStageGroup(group.stages)}
                      className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        active ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
                      {group.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
            <FormField label="Parameters" helper="Tracked metrics for this environment.">
              <div className="flex flex-wrap gap-2">
                {parameters.filter((p) => p.active).map((p) => (
                  <button key={p.id} type="button" onClick={() => toggleParameter(p.id)}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      form.parameter_ids.includes(p.id) ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
                    {p.name} {p.unit && `(${p.unit})`}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Quick Add Parameter" helper="Create a new parameter and add it to this environment">
              <div className="grid grid-cols-[1fr_96px_auto] gap-2">
                <Input placeholder="Name (e.g. CO₂)" value={newParam.name} onChange={(e) => setNewParam({ ...newParam, name: e.target.value })} className="bg-muted border-border" />
                <Input placeholder="Unit" value={newParam.unit} onChange={(e) => setNewParam({ ...newParam, unit: e.target.value })} className="bg-muted border-border" />
                <Button variant="outline" onClick={createParam}>Add</Button>
              </div>
            </FormField>
            <FormFooter
              onSave={save}
              onCancel={() => onOpenChange(false)}
              onDelete={form.id ? () => setConfirmDelete(true) : undefined}
              saveDisabled={!form.name.trim()}
              saveLabel={saveLabel ?? (form.id ? "Save" : "Create & Use")}
              lastUpdated={form.id ? form.updated_at : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete environment?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the environment. Historical timeline entries on grows will remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (form.id) deleteEnvironment(form.id); setConfirmDelete(false); onOpenChange(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}