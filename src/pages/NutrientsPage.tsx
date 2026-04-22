import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  CATEGORY_ORDER, CATEGORY_LABELS, formUnit,
  type Nutrient, type NutrientCategory, type NutrientType,
} from "@/types";

interface FormState {
  id?: string;
  name: string;
  brand: string;
  category: NutrientCategory;
  form: NutrientType;
}

const empty: FormState = { name: "", brand: "", category: "nutrient", form: "dry" };

export default function NutrientsPage() {
  const { nutrients, addNutrient, updateNutrient, deleteNutrient } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const openAdd = (category?: NutrientCategory) => {
    setForm({ ...empty, category: category ?? "nutrient" });
    setOpen(true);
  };
  const openEdit = (n: Nutrient) => {
    setForm({ id: n.id, name: n.name, brand: n.brand, category: n.category, form: n.form });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const unit = form.form === "liquid" ? "ml/L" : "g/L";
    if (form.id) {
      updateNutrient(form.id, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        form: form.form,
        type: form.form,
        unit,
      });
    } else {
      const newItem: Nutrient = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        form: form.form,
        type: form.form,
        unit,
      };
      addNutrient(newItem);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nutrients & Additives</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openAdd()}>
          <Plus className="w-4 h-4 mr-1" /> New Item
        </Button>
      </div>

      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = nutrients.filter((n) => n.category === cat);
          return (
            <div key={cat} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => openAdd(cat)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {items.map((n) => (
                    <div key={n.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-foreground font-medium">{n.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.brand ? `${n.brand} · ` : ""}{n.form} · {formUnit(n.form)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(n)}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNutrient(n.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{form.id ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Brand (optional)</label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NutrientCategory })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c].slice(0, -1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Form</label>
                <Select value={form.form} onValueChange={(v) => setForm({ ...form, form: v as NutrientType })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Dry (g/L)</SelectItem>
                    <SelectItem value="liquid">Liquid (ml/L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={save} className="w-full gradient-primary text-primary-foreground">
              {form.id ? "Save" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
