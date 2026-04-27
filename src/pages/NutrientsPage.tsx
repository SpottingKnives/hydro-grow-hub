import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type Nutrient, type NutrientCategory, type NutrientType } from "@/types";

const empty = { name: "", category: "nutrient" as NutrientCategory, form: "dry" as NutrientType };

export default function NutrientsPage() {
  const { nutrients, feedSchedules, feedLogs, addNutrient, updateNutrient, deleteNutrient } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isUsed = (nid: string) => feedSchedules.some((s) => s.rows.some((r) => r.nutrient_id === nid)) || feedLogs.some((l) => [...(l.nutrients||[]), ...(l.additives||[]), ...(l.treatments||[])].some((it) => it.nutrient_id === nid));
  const handleDelete = (nid: string) => { if (isUsed(nid)) setConfirmId(nid); else deleteNutrient(nid); };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), category: form.category, form: form.form, active: true, unit: formUnit(form.form), type: form.form };
    form.id ? updateNutrient(form.id, payload) : addNutrient({ id: crypto.randomUUID(), ...payload });
    setOpen(false);
  };

  const openForm = (category?: NutrientCategory, item?: Nutrient) => {
    setForm(item ? { id: item.id, name: item.name, category: item.category, form: item.form } : { ...empty, category: category ?? "nutrient" });
    setOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Nutrients & Additives</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> New Item</Button>
      </div>
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = nutrients.filter((n) => n.category === cat);
          return (
            <div key={cat} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[cat]}</h2>
                <Button variant="ghost" size="sm" onClick={() => openForm(cat)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((n) => (
                  <div key={n.id} className="flex items-center justify-between gap-3 py-2 opacity-100 data-[inactive=true]:opacity-50" data-inactive={!n.active}>
                    <div className="min-w-0">
                      <div className="text-foreground font-medium truncate">{n.name}</div>
                      <div className="text-xs text-muted-foreground">{n.form} · {formUnit(n.form)}{!n.active ? " · inactive" : ""}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => openForm(undefined, n)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NutrientCategory })}><SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger><SelectContent>{CATEGORY_ORDER.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c].slice(0, -1)}</SelectItem>)}</SelectContent></Select>
              <Select value={form.form} onValueChange={(v) => setForm({ ...form, form: v as NutrientType })}><SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dry">Dry (g/L)</SelectItem><SelectItem value="liquid">Liquid (ml/L)</SelectItem></SelectContent></Select>
            </div>
            <Button onClick={save} className="w-full gradient-primary text-primary-foreground">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This item is used in feed schedules or logs. Delete anyway? Historical logs will remain intact; it will be removed from schedules.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) deleteNutrient(confirmId); setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
