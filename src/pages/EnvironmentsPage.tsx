import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { STAGE_GROUPS, type Environment, type GrowStage, type TaskTriggerType } from "@/types";
import { cn } from "@/lib/utils";

const empty = {
  name: "",
  site_count: "",
  supported_stages: [] as GrowStage[],
  system_description: "",
  parameter_ids: [] as string[],
  taskName: "",
  taskTrigger: "on_enter" as TaskTriggerType,
  taskOffset: "0",
  taskStage: "veg" as GrowStage,
};

export default function EnvironmentsPage() {
  const { environments, parameters, addEnvironment, updateEnvironment, deleteEnvironment, addParameter } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [newParam, setNewParam] = useState({ name: "", unit: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openForm = (env?: Environment) => {
    setForm(env ? {
      id: env.id,
      name: env.name,
      site_count: String(env.site_count),
      supported_stages: env.supported_stages,
      system_description: env.system_description,
      parameter_ids: env.parameter_ids.filter((id) => parameters.find((p) => p.id === id)?.active),
      taskName: "",
      taskTrigger: "on_enter",
      taskOffset: "0",
      taskStage: "veg",
      updated_at: env.updated_at,
    } : empty);
    setOpen(true);
  };

  const toggleStageGroup = (stages: GrowStage[]) =>
    setForm((p) => {
      const all = stages.every((s) => p.supported_stages.includes(s));
      return {
        ...p,
        supported_stages: all
          ? p.supported_stages.filter((s) => !stages.includes(s))
          : Array.from(new Set([...p.supported_stages, ...stages])),
      };
    });

  const toggleParameter = (pid: string) =>
    setForm((p) => ({
      ...p,
      parameter_ids: p.parameter_ids.includes(pid)
        ? p.parameter_ids.filter((id) => id !== pid)
        : [...p.parameter_ids, pid],
    }));

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
    if (form.id) updateEnvironment(form.id, base);
    else addEnvironment({ id: crypto.randomUUID(), ...base, task_templates: [] });
    setOpen(false);
  };

  const addTemplate = () => {
    if (!form.id || !form.taskName.trim()) return;
    const env = environments.find((e) => e.id === form.id);
    if (!env) return;
    updateEnvironment(form.id, {
      task_templates: [
        ...env.task_templates,
        {
          id: crypto.randomUUID(),
          environment_id: form.id,
          name: form.taskName.trim(),
          trigger_type: form.taskTrigger,
          trigger_offset_days: parseInt(form.taskOffset) || 0,
          trigger_stage: form.taskTrigger === "on_stage" ? form.taskStage : null,
        },
      ],
    });
    setForm({ ...form, taskName: "", taskOffset: "0" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Environments</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-1" /> New Environment
        </Button>
      </div>

      {environments.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No environments yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div key={env.id} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{env.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openForm(env)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteEnvironment(env.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{env.site_count} sites · {env.system_description || "No system description"}</p>
              <div className="flex flex-wrap gap-1">
                {env.supported_stages.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs capitalize border-border text-muted-foreground">{s}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {env.parameter_ids.map((pid) => {
                  const p = parameters.find((x) => x.id === pid);
                  return p ? <Badge key={pid} variant="secondary" className="text-xs">{p.name}</Badge> : null;
                })}
              </div>
              {env.task_templates.length > 0 && <p className="text-xs text-muted-foreground">{env.task_templates.length} task templates</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Environment" : "New Environment"}</DialogTitle>
          </DialogHeader>

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
                    <button
                      key={group.label}
                      type="button"
                      onClick={() => toggleStageGroup(group.stages)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/30",
                      )}
                    >
                      {group.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField label="Parameters" helper="Tracked metrics for this environment. Manage all parameters from the Parameters page.">
              <div className="flex flex-wrap gap-2">
                {parameters.filter((p) => p.active).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParameter(p.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      form.parameter_ids.includes(p.id)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/30",
                    )}
                  >
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

            {form.id && (
              <FormField label="New Task Template" helper="Tasks auto-generated when a grow enters this environment">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Input placeholder="Task name" value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} className="bg-muted border-border md:col-span-2" />
                  <Select value={form.taskTrigger} onValueChange={(v) => setForm({ ...form, taskTrigger: v as TaskTriggerType })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_enter">On enter</SelectItem>
                      <SelectItem value="after_days">After days</SelectItem>
                      <SelectItem value="on_stage">On stage</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" value={form.taskOffset} onChange={(e) => setForm({ ...form, taskOffset: e.target.value })} className="bg-muted border-border" />
                  <Button variant="outline" onClick={addTemplate}>Add</Button>
                </div>
              </FormField>
            )}

            <FormFooter
              onSave={save}
              onCancel={() => setOpen(false)}
              onDelete={form.id ? () => setConfirmDelete(true) : undefined}
              saveDisabled={!form.name.trim()}
              lastUpdated={form.id ? form.updated_at : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete environment?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the environment. Historical timeline entries on grows will remain intact.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (form.id) deleteEnvironment(form.id); setConfirmDelete(false); setOpen(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
