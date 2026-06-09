import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type Nutrient, type NutrientCategory } from "@/types";
import { NutrientFormDialog } from "@/components/forms/NutrientFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function NutrientsSection() {
  const { nutrients, deleteNutrient } = useStore(
    useShallow((s) => ({ nutrients: s.nutrients, deleteNutrient: s.deleteNutrient }))
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nutrient | null>(null);
  const [defaultCat, setDefaultCat] = useState<NutrientCategory | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openForm = (category?: NutrientCategory, item?: Nutrient) => {
    setEditing(item ?? null);
    setDefaultCat(category);
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

      <NutrientFormDialog open={open} onOpenChange={setOpen} initial={editing} defaultCategory={defaultCat} />

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="Delete item?"
        description="This will permanently delete the item and remove it from all schedules. Historical logs remain intact. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (confirmId) deleteNutrient(confirmId); setConfirmId(null); }}
      />
    </div>
  );
}
