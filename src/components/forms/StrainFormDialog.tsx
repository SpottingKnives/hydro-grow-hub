import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import type { Strain } from "@/types";

const ADD_NEW = "__add_new__";
const empty = { name: "", breeder: "", veg_weeks: "", flower_weeks: "8", traits: "", notes: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Strain | null;
  onCreated?: (id: string) => void;
  saveLabel?: string;
}

export function StrainFormDialog({ open, onOpenChange, initial, onCreated, saveLabel }: Props) {
  const { strains, addStrain, updateStrain, deleteStrain } = useStore();
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [addingBreeder, setAddingBreeder] = useState(false);
  const [newBreeder, setNewBreeder] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const breeders = useMemo(() => Array.from(new Set(strains.map((s) => s.breeder).filter(Boolean))).sort(), [strains]);

  useEffect(() => {
    if (!open) return;
    setAddingBreeder(false); setNewBreeder("");
    setForm(initial ? { id: initial.id, name: initial.name, breeder: initial.breeder, veg_weeks: initial.veg_weeks ? String(initial.veg_weeks) : "", flower_weeks: String(initial.flower_weeks), traits: initial.traits.join(", "), notes: initial.notes, updated_at: initial.updated_at } : empty);
  }, [open, initial]);

  const save = () => {
    if (!form.name.trim()) return;
    const flower = parseFloat(form.flower_weeks); if (!flower || flower <= 0) return;
    const veg = form.veg_weeks.trim() ? parseFloat(form.veg_weeks) : 0;
    const breeder = (addingBreeder ? newBreeder : form.breeder).trim();
    const payload = { name: form.name.trim(), breeder, veg_weeks: isNaN(veg) ? 0 : veg, flower_weeks: flower, traits: form.traits.split(",").map((t) => t.trim()).filter(Boolean), notes: form.notes, active: true, updated_at: new Date().toISOString() };
    if (form.id) {
      updateStrain(form.id, payload);
      onCreated?.(form.id);
    } else {
      const id = crypto.randomUUID();
      addStrain({ id, ...payload });
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Strain" : "Add Strain"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Strain Name" htmlFor="strain-name" required>
              <Input id="strain-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Breeder">
              {addingBreeder ? (
                <div className="flex gap-2">
                  <Input placeholder="New breeder name" value={newBreeder} onChange={(e) => setNewBreeder(e.target.value)} className="bg-muted border-border" />
                  <Button variant="outline" size="sm" onClick={() => { setAddingBreeder(false); setNewBreeder(""); }}>Cancel</Button>
                </div>
              ) : (
                <Select value={form.breeder || undefined} onValueChange={(v) => { if (v === ADD_NEW) { setAddingBreeder(true); setForm({ ...form, breeder: "" }); } else setForm({ ...form, breeder: v }); }}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select breeder" /></SelectTrigger>
                  <SelectContent>
                    {breeders.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    <SelectItem value={ADD_NEW}>+ Add new breeder</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Est. Flower Duration (weeks)" htmlFor="flower-weeks" required helper="Used for stage timing suggestions">
                <Input id="flower-weeks" type="number" inputMode="decimal" step="0.1" min="0" value={form.flower_weeks} onChange={(e) => setForm({ ...form, flower_weeks: e.target.value })} className="bg-muted border-border" />
              </FormField>
              <FormField label="Typical Veg Duration (weeks)" htmlFor="veg-weeks" helper="Optional reference only">
                <Input id="veg-weeks" type="number" inputMode="decimal" step="0.1" min="0" value={form.veg_weeks} onChange={(e) => setForm({ ...form, veg_weeks: e.target.value })} className="bg-muted border-border" />
              </FormField>
            </div>
            <FormField label="Traits" htmlFor="traits" helper="Comma separated, e.g. indica, fruity">
              <Input id="traits" value={form.traits} onChange={(e) => setForm({ ...form, traits: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Notes" htmlFor="notes">
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormFooter onSave={save} onCancel={() => onOpenChange(false)} onDelete={form.id ? () => setConfirmDelete(true) : undefined} saveDisabled={!form.name.trim()} saveLabel={saveLabel ?? (form.id ? "Save" : "Create & Use")} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete strain?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the strain. Existing plants linked to it will keep their snapshot data. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (form.id) { deleteStrain(form.id); } setConfirmDelete(false); onOpenChange(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}