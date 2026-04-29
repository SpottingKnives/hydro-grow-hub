import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import type { Strain } from "@/types";

const ADD_NEW = "__add_new__";
const empty = { name: "", breeder: "", veg_weeks: "", flower_weeks: "8", traits: "", notes: "" };

export function StrainsSection() {
  const { strains, addStrain, updateStrain, deleteStrain } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string; updated_at?: string }>(empty);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [addingBreeder, setAddingBreeder] = useState(false);
  const [newBreeder, setNewBreeder] = useState("");

  const breeders = useMemo(() => Array.from(new Set(strains.map((s) => s.breeder).filter(Boolean))).sort(), [strains]);

  const openForm = (s?: Strain) => {
    setAddingBreeder(false); setNewBreeder("");
    setForm(s ? { id: s.id, name: s.name, breeder: s.breeder, veg_weeks: s.veg_weeks ? String(s.veg_weeks) : "", flower_weeks: String(s.flower_weeks), traits: s.traits.join(", "), notes: s.notes, updated_at: s.updated_at } : empty);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const flower = parseFloat(form.flower_weeks); if (!flower || flower <= 0) return;
    const veg = form.veg_weeks.trim() ? parseFloat(form.veg_weeks) : 0;
    const breeder = (addingBreeder ? newBreeder : form.breeder).trim();
    const payload = { name: form.name.trim(), breeder, veg_weeks: isNaN(veg) ? 0 : veg, flower_weeks: flower, traits: form.traits.split(",").map((t) => t.trim()).filter(Boolean), notes: form.notes, active: true, updated_at: new Date().toISOString() };
    form.id ? updateStrain(form.id, payload) : addStrain({ id: crypto.randomUUID(), ...payload });
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Strains</h2>
        <Button size="sm" variant="outline" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> Add Strain</Button>
      </div>
      {strains.length === 0 ? (
        <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No strains yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {strains.map((strain) => (
            <div key={strain.id} className="glass-card p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground text-sm">{strain.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(strain)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmId(strain.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {strain.breeder && <p className="text-xs text-muted-foreground">by {strain.breeder}</p>}
              <p className="text-xs text-muted-foreground">Flower: {strain.flower_weeks}w{strain.veg_weeks ? ` · Veg: ${strain.veg_weeks}w` : ""}</p>
              {strain.traits.length > 0 && <p className="text-[11px] text-muted-foreground">{strain.traits.join(" · ")}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Strain" : "Add Strain"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Strain Name" htmlFor="strain-name" required>
              <Input id="strain-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" />
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
            <FormFooter onSave={save} onCancel={() => setOpen(false)} onDelete={form.id ? () => { setConfirmId(form.id!); } : undefined} saveDisabled={!form.name.trim()} lastUpdated={form.id ? form.updated_at : undefined} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete strain?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the strain. Existing plants linked to it will keep their snapshot data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) { deleteStrain(confirmId); setOpen(false); } setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
