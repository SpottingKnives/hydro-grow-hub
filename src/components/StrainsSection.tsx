import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Strain } from "@/types";
import { StrainFormDialog } from "@/components/forms/StrainFormDialog";

export function StrainsSection() {
  const { strains, deleteStrain } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Strain | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openForm = (s?: Strain) => { setEditing(s ?? null); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Strains</h2>
        <Button size="sm" variant="outline" onClick={() => openForm()}><Plus className="w-4 h-4 mr-1" /> Add Strain</Button>
      </div>
      {strains.length === 0 ? (
        <div className="glass-card p-6 text-center"><p className="text-sm text-muted-foreground">No strains yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {strains.map((strain) => (
            <div key={strain.id} className="glass-card p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground text-sm truncate">{strain.name}</h3>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(strain)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmId(strain.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {strain.breeder && <p className="text-xs text-muted-foreground truncate">by {strain.breeder}</p>}
              <p className="text-xs text-muted-foreground">Flower: {strain.flower_weeks}w{strain.veg_weeks ? ` · Veg: ${strain.veg_weeks}w` : ""}</p>
              {strain.traits.length > 0 && <p className="text-[11px] text-muted-foreground truncate">{strain.traits.join(" · ")}</p>}
            </div>
          ))}
        </div>
      )}

      <StrainFormDialog open={open} onOpenChange={setOpen} initial={editing} />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete strain?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the strain. Existing plants linked to it will keep their snapshot data. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId) deleteStrain(confirmId); setConfirmId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
