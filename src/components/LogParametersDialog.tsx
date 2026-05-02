import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { useStore } from "@/store/useStore";
import type { ParameterLog } from "@/types";

interface LogParametersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  growCycleId?: string | null;
  /** Optional task id to mark complete after saving */
  taskId?: string | null;
}

export function LogParametersDialog({ open, onOpenChange, growCycleId, taskId }: LogParametersDialogProps) {
  const { growCycles, environments, parameters, addParameterLog, toggleTask, tasks } = useStore();

  // If no growCycleId passed, let user pick one
  const [selectedGrow, setSelectedGrow] = useState<string>(growCycleId || "");
  useEffect(() => { setSelectedGrow(growCycleId || ""); }, [growCycleId, open]);

  const cycle = growCycles.find((c) => c.id === selectedGrow);
  const env = environments.find((e) => e.id === cycle?.environment_id);
  const envParams = useMemo(() =>
    (env?.parameter_ids ?? []).map((pid) => parameters.find((p) => p.id === pid)).filter(Boolean) as { id: string; name: string; unit: string }[],
    [env, parameters]
  );

  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => { if (open) setValues({}); }, [open, selectedGrow]);

  const activeGrows = growCycles.filter((c) => c.status === "active");

  const save = () => {
    if (!cycle) return;
    const numericValues: Record<string, number> = {};
    Object.entries(values).forEach(([pid, v]) => {
      const n = parseFloat(v);
      if (!isNaN(n) && v.trim() !== "") numericValues[pid] = n;
    });
    const log: ParameterLog = {
      id: crypto.randomUUID(),
      grow_cycle_id: cycle.id,
      environment_id: env?.id ?? null,
      values: numericValues,
      timestamp: new Date().toISOString(),
    };
    addParameterLog(log);
    if (taskId) {
      const t = tasks.find((x) => x.id === taskId);
      if (t && !t.completed) toggleTask(taskId);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log Parameters</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          {!growCycleId && (
            <FormField label="Grow Cycle" required>
              <Select value={selectedGrow} onValueChange={setSelectedGrow}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select grow" /></SelectTrigger>
                <SelectContent>
                  {activeGrows.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {cycle && (
            <p className="text-xs text-muted-foreground">
              {cycle.name} {env ? `· ${env.name}` : "· No environment assigned"}
            </p>
          )}

          {!cycle ? null : !env ? (
            <p className="text-sm text-muted-foreground">No environment is assigned to this grow yet. Assign one to log parameters.</p>
          ) : envParams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parameters are configured for the current environment.</p>
          ) : (
            <div className="space-y-3">
              {envParams.map((p) => (
                <FormField key={p.id} label={p.name} htmlFor={`param-${p.id}`}>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`param-${p.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={values[p.id] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                      className="bg-muted border-border flex-1"
                      placeholder="—"
                    />
                    {p.unit && <span className="text-xs text-muted-foreground shrink-0 w-16">{p.unit}</span>}
                  </div>
                </FormField>
              ))}
            </div>
          )}

          <FormFooter
            onSave={save}
            onCancel={() => onOpenChange(false)}
            saveLabel="Save Log"
            saveDisabled={!cycle || !env || envParams.length === 0}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}