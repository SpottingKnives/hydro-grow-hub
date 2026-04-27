import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Parameter } from "@/types";

const empty = { name: "", unit: "" };

export default function ParametersPage() {
  const { parameters, environments, parameterLogs, addParameter, updateParameter, deleteParameter } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openForm = (parameter?: Parameter) => {
    setForm(parameter ? { id: parameter.id, name: parameter.name, unit: parameter.unit } : empty);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), unit: form.unit.trim(), active: true };
    form.id ? updateParameter(form.id, payload) : addParameter({ id: crypto.randomUUID(), ...payload });
    setOpen(false);
  };

  const isUsed = (pid: string) => environments.some((e) => e.parameter_ids.includes(pid)) || parameterLogs.some((l) => l.parameter_id === pid);
  const handleDelete = (pid: string) => { if (isUsed(pid)) setConfirmId(pid); else deleteParameter(pid); };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Parameters</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> New Parameter</Button>
      </div>

      <div className="glass-card p-4">
        <div className="divide-y divide-border/50">
          {parameters.map((parameter) => (
            <div key={parameter.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="text-foreground font-medium truncate">{parameter.name}</div>
                <div className="text-xs text-muted-foreground">{parameter.unit || "No unit"}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8" onClick={() => openForm(parameter)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(parameter.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {parameters.length === 0 && <p className="text-sm text-muted-foreground">No parameters yet.</p>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Edit Parameter" : "New Parameter"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-muted border-border" />
            <Button onClick={save} className="w-full gradient-primary text-primary-foreground">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parameter?</AlertDialogTitle>
            <AlertDialogDescription>This parameter is used in existing data. Delete anyway? Historical logs will remain intact.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) deleteParameter(confirmId); setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
