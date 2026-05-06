import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { LibraryRow } from "@/components/LibraryRow";
import { Badge } from "@/components/ui/badge";
import { type Environment } from "@/types";
import { ParametersSection } from "@/components/ParametersSection";
import { EnvironmentFormDialog } from "@/components/forms/EnvironmentFormDialog";

export default function EnvironmentsPage() {
  const { environments, parameters, deleteEnvironment } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Environment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const openForm = (env?: Environment) => {
    setEditing(env ?? null);
    setOpen(true);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Environments</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-1" /> New Environment
        </Button>
        <LibraryRow label="Parameters" onManage={() => setLibraryOpen(true)} />
      </div>

      {environments.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No environments yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div key={env.id} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{env.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openForm(env)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeleteId(env.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{env.site_count} sites · {env.system_description || "No system description"}</p>
              <div className="flex flex-wrap gap-1">
                {env.supported_stages.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs capitalize border-border text-muted-foreground">{s}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {env.parameter_ids.map((pid) => {
                  const p = parameters.find((x) => x.id === pid);
                  return p ? <Badge key={pid} variant="secondary" className="text-xs">{p.name}</Badge> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <EnvironmentFormDialog open={open} onOpenChange={setOpen} initial={editing} />

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete environment?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the environment. Historical timeline entries on grows will remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDeleteId) deleteEnvironment(confirmDeleteId); setConfirmDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Parameters Library</DialogTitle></DialogHeader>
          <div className="mt-2"><ParametersSection /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
