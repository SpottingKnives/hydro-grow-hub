import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { FEED_STAGES, formUnit, formUnitShort, type GrowStage, type FeedLog } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  growCycleId: string;
  /** Optional override for reservoir volume in liters (e.g. partial refill). */
  volumeOverride?: number;
}

export function FeedCalculatorDialog({ open, onOpenChange, growCycleId, volumeOverride }: Props) {
  const { growCycles, environments, feedSchedules, addFeedLog } = useStore();
  const cycle = growCycles.find((c) => c.id === growCycleId);
  const env = environments.find((e) => e.id === cycle?.environment_id);
  const schedule = feedSchedules.find((f) => f.id === cycle?.feed_schedule_id);
  const reservoir = volumeOverride ?? env?.reservoir_volume ?? 0;

  const stage: GrowStage | null = useMemo(() => {
    if (!cycle) return null;
    if (FEED_STAGES.includes(cycle.current_stage)) return cycle.current_stage;
    if (cycle.current_stage === "nursery") return "veg";
    return null;
  }, [cycle]);

  const rows = useMemo(() => {
    if (!schedule || !stage || !reservoir) return [];
    return [...schedule.rows]
      .sort((a, b) => a.order_index - b.order_index)
      .map((r) => {
        const rate = r.amounts[stage] ?? 0;
        return { ...r, rate, total: rate * reservoir };
      })
      .filter((r) => r.rate > 0);
  }, [schedule, stage, reservoir]);

  const missing: string[] = [];
  if (!env) missing.push("environment");
  if (!reservoir) missing.push("reservoir volume");
  if (!schedule) missing.push("feed schedule");
  if (!stage) missing.push("applicable stage");

  const [logged, setLogged] = useState(false);

  const onLog = () => {
    if (!cycle || !env || !schedule || !stage) return;
    const groups: Record<"nutrient" | "additive" | "treatment", { nutrient_id: string; name: string; amount: number; unit: string }[]> = { nutrient: [], additive: [], treatment: [] };
    rows.forEach((r) => {
      groups[r.category].push({ nutrient_id: r.nutrient_id, name: r.nutrient_name, amount: r.total, unit: formUnitShort(r.nutrient_type) });
    });
    const log: FeedLog = {
      id: crypto.randomUUID(),
      grow_cycle_id: cycle.id,
      feed_schedule_id: schedule.id,
      stage,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      water_volume: reservoir,
      liters: reservoir,
      nutrients: groups.nutrient,
      additives: groups.additive,
      treatments: groups.treatment,
      ec_measured: null,
    };
    addFeedLog(log);
    setLogged(true);
    setTimeout(() => { setLogged(false); onOpenChange(false); }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Feed Calculator</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          {missing.length > 0 ? (
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Feed calculation unavailable — missing required data
              <div className="text-xs mt-1">Missing: {missing.join(", ")}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><span className="text-foreground font-medium">{cycle?.name}</span></div>
                <div className="text-right">Stage: <span className="text-foreground capitalize">{stage}</span></div>
                <div>Env: <span className="text-foreground">{env?.name}</span></div>
                <div className="text-right">Reservoir: <span className="text-foreground">{reservoir} L</span></div>
                <div className="col-span-2">Schedule: <span className="text-foreground">{schedule?.name}</span></div>
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items with values for the current stage.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2 font-medium">Item</th>
                        <th className="text-right py-2 px-2 font-medium">Rate</th>
                        <th className="text-right py-2 px-2 font-medium">Total Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="py-2 px-2 text-foreground">{r.nutrient_name}</td>
                          <td className="py-2 px-2 text-right text-muted-foreground">{r.rate} {formUnit(r.nutrient_type)}</td>
                          <td className="py-2 px-2 text-right text-foreground font-medium">{Number(r.total.toFixed(3))} {formUnitShort(r.nutrient_type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                <Button className="gradient-primary text-primary-foreground" onClick={onLog} disabled={rows.length === 0 || logged}>
                  {logged ? "Logged" : "Log Feed Applied"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}