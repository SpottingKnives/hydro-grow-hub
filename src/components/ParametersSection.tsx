import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import type { Parameter } from "@/types";

const empty = { name: "", unit: "" };

export function ParametersSection() {
  const { parameters, addParameter, updateParameter, deleteParameter } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openForm = (p?: Parameter) => {
    setForm(p ? { id: p.id, name: p.name, unit: p.unit, updated_at: p.updated_at } : empty);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), unit: form.unit.trim(), active: true };
    form.id ? updateParameter(form.id, payload) : addParameter({ id: crypto.randomUUID(), ...payload });
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Parameters</h2>
        <Button size="sm" variant="outline" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> New Parameter</Button>
      </div>
      <div className="glass-card p-4">
        <div className="divide-y divide-border/50">
          {parameters.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-foreground font-medium truncate text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.unit || "No unit"}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {parameters.length === 0 && <p className="text-sm text-muted-foreground py-2">No parameters yet.</p>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Edit Parameter" : "New Parameter"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Parameter Name" htmlFor="param-name" required>
              <Input id="param-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Unit" htmlFor="param-unit" helper="e.g. pH, ppm, °C, %">
              <Input id="param-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormFooter onSave={save} onCancel={() => setOpen(false)} onDelete={form.id ? () => setConfirmId(form.id!) : undefined} saveDisabled={!form.name.trim()} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parameter?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the parameter and remove it from all environments. Historical logs remain intact.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) { deleteParameter(confirmId); setOpen(false); } setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
