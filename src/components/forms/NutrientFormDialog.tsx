import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type Nutrient, type NutrientCategory, type NutrientType } from "@/types";

const empty = { name: "", category: "nutrient" as NutrientCategory, form: "dry" as NutrientType };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Nutrient | null;
  defaultCategory?: NutrientCategory;
  defaultForm?: NutrientType;
  onCreated?: (nutrient: Nutrient) => void;
  saveLabel?: string;
}

export function NutrientFormDialog({ open, onOpenChange, initial, defaultCategory, defaultForm, onCreated, saveLabel }: Props) {
  const { addNutrient, updateNutrient, deleteNutrient } = useStore();
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { id: initial.id, name: initial.name, category: initial.category, form: initial.form, updated_at: initial.updated_at }
      : { ...empty, category: defaultCategory ?? "nutrient", form: defaultForm ?? "dry" });
  }, [open, initial, defaultCategory, defaultForm]);

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), category: form.category, form: form.form, active: true, unit: formUnit(form.form), type: form.form };
    if (form.id) {
      updateNutrient(form.id, payload);
      onCreated?.({ id: form.id, ...payload });
    } else {
      const id = crypto.randomUUID();
      const n: Nutrient = { id, ...payload };
      addNutrient(n);
      onCreated?.(n);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border w-[calc(100vw-1rem)]">
          <DialogHeader><DialogTitle>{form.id ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Name" htmlFor="nutrient-name" required>
              <Input id="nutrient-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
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
            <FormFooter onSave={save} onCancel={() => onOpenChange(false)} onDelete={form.id ? () => setConfirmDelete(true) : undefined} saveDisabled={!form.name.trim()} saveLabel={saveLabel ?? (form.id ? "Save" : "Create & Use")} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the item and remove it from all schedules. Historical logs remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (form.id) { deleteNutrient(form.id); } setConfirmDelete(false); onOpenChange(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}