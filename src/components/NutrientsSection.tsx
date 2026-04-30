import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type Nutrient, type NutrientCategory, type NutrientType } from "@/types";

const empty = { name: "", category: "nutrient" as NutrientCategory, form: "dry" as NutrientType };

export function NutrientsSection() {
  const { nutrients, addNutrient, updateNutrient, deleteNutrient } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), category: form.category, form: form.form, active: true, unit: formUnit(form.form), type: form.form };
    form.id ? updateNutrient(form.id, payload) : addNutrient({ id: crypto.randomUUID(), ...payload });
    setOpen(false);
  };

  const openForm = (category?: NutrientCategory, item?: Nutrient) => {
    setForm(item ? { id: item.id, name: item.name, category: item.category, form: item.form, updated_at: item.updated_at } : { ...empty, category: category ?? "nutrient" });
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Nutrients & Additives</h2>
        <Button size="sm" variant="outline" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> New Item</Button>
      </div>
      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => {
          const items = nutrients.filter((n) => n.category === cat);
          return (
            <div key={cat} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[cat]}</h3>
                <Button variant="ghost" size="sm" onClick={() => openForm(cat)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((n) => (
                  <div key={n.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="text-foreground font-medium truncate text-sm">{n.name}</div>
                      <div className="text-xs text-muted-foreground">{n.form} · {formUnit(n.form)}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(undefined, n)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmId(n.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-sm text-muted-foreground py-1">No items yet.</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Name" htmlFor="nutrient-name" required>
              <Input id="nutrient-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category" helper="Where this item appears in your feed schedule">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NutrientCategory })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORY_ORDER.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c].slice(0, -1)}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Form" helper="Dry uses g/L, Liquid uses ml/L">
                <Select value={form.form} onValueChange={(v) => setForm({ ...form, form: v as NutrientType })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="dry">Dry (g/L)</SelectItem><SelectItem value="liquid">Liquid (ml/L)</SelectItem></SelectContent>
                </Select>
              </FormField>
            </div>
            <FormFooter onSave={save} onCancel={() => setOpen(false)} onDelete={form.id ? () => setConfirmId(form.id!) : undefined} saveDisabled={!form.name.trim()} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the item and remove it from all schedules. Historical logs remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) { deleteNutrient(confirmId); setOpen(false); } setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
