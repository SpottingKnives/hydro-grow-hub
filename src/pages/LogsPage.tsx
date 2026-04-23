import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CATEGORY_ORDER, CATEGORY_LABELS, formUnitShort, type NutrientCategory } from "@/types";

export default function LogsPage() {
  const { growCycles, parameterLogs, feedLogs, nutrients, feedSchedules, parameters, addParameterLog, addFeedLog, addEvent } = useStore();
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [paramForm, setParamForm] = useState({ parameter_id: "", value: "" });
  const [feedForm, setFeedForm] = useState({ water_volume: "", ec_measured: "" });

  const activeCycles = growCycles.filter((c) => c.status === "active");
  const selectedCycle = growCycles.find((c) => c.id === selectedCycleId);
  const cycleLogs = parameterLogs.filter((l) => l.grow_cycle_id === selectedCycleId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const cycleFeedLogs = feedLogs.filter((l) => l.grow_cycle_id === selectedCycleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const logParam = () => {
    if (!selectedCycleId || !paramForm.value) return;
    addParameterLog({
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      timestamp: new Date().toISOString(),
      parameter_id: paramForm.parameter_id,
      value: parseFloat(paramForm.value),
    });
    setParamForm({ ...paramForm, value: "" });
  };

  const logFeed = () => {
    if (!selectedCycleId || !feedForm.water_volume) return;
    const schedule = feedSchedules.find((f) => f.id === selectedCycle?.feed_schedule_id);
    const stage = selectedCycle?.current_stage || "veg";
    const waterVol = parseFloat(feedForm.water_volume);
    const mapRow = (row: typeof schedule extends infer T ? any : any) => ({
      nutrient_id: row.nutrient_id,
      name: row.nutrient_name,
      amount: (row.amounts[stage] || 0) * waterVol,
      unit: formUnitShort(row.nutrient_type),
    });
    const rows = schedule?.rows || [];
    const nutrientsArr = rows.filter((r) => r.category === 'nutrient').map(mapRow);
    const additivesArr = rows.filter((r) => r.category === 'additive').map(mapRow);
    const treatmentsArr = rows.filter((r) => r.category === 'treatment').map(mapRow);

    const log = {
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      stage,
      water_volume: waterVol,
      liters: waterVol,
      nutrients: nutrientsArr,
      additives: additivesArr,
      treatments: treatmentsArr,
      ec_measured: feedForm.ec_measured ? parseFloat(feedForm.ec_measured) : null,
    };
    addFeedLog(log);
    const all = [...nutrientsArr, ...additivesArr, ...treatmentsArr];
    addEvent({
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      type: "feed",
      title: `Fed ${feedForm.water_volume}L`,
      description: all.map((n) => `${n.name}: ${n.amount.toFixed(2)}${n.unit}`).join(", "),
      date: new Date().toISOString(),
    });
    setFeedForm({ water_volume: "", ec_measured: "" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground">Logs</h1>

      <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
        <SelectTrigger className="w-64 bg-muted border-border"><SelectValue placeholder="Select grow cycle" /></SelectTrigger>
        <SelectContent>
          {activeCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedCycleId && (
        <Tabs defaultValue="params" className="space-y-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="feed">Feed Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Log Parameter</h3>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground">Parameter</label>
                  <Select value={paramForm.parameter_id} onValueChange={(v) => setParamForm({ ...paramForm, parameter_id: v })}>
                    <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {parameters.filter((p) => p.active).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Value</label>
                  <Input type="number" step="0.1" placeholder="0.0" value={paramForm.value} onChange={(e) => setParamForm({ ...paramForm, value: e.target.value })} className="w-24 bg-muted border-border" />
                </div>
                <Button onClick={logParam} size="sm" className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" /> Log
                </Button>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Recent Logs</h3>
              {cycleLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parameter logs yet.</p>
              ) : (
                <div className="space-y-1">
                  {cycleLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                      <span className="w-16 text-muted-foreground font-medium">{parameters.find((p) => p.id === log.parameter_id)?.name ?? "Parameter"}</span>
                      <span className="text-foreground font-semibold">{log.value}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(log.timestamp), "MMM d, HH:mm")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-1">Feed Calculator</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Stage: <span className="capitalize text-primary">{selectedCycle?.current_stage}</span>
                {selectedCycle?.feed_schedule_id ? "" : " · No feed schedule linked"}
              </p>

              {selectedCycle?.feed_schedule_id && (() => {
                const schedule = feedSchedules.find((f) => f.id === selectedCycle.feed_schedule_id);
                if (!schedule) return null;
                const stage = selectedCycle.current_stage;
                const waterVol = parseFloat(feedForm.water_volume) || 0;
                const ecTarget = schedule.ec_targets?.[stage];
                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Water Volume (L)</label>
                        <Input type="number" min={0} step={0.5} value={feedForm.water_volume} onChange={(e) => setFeedForm({ ...feedForm, water_volume: e.target.value })} placeholder="0" className="w-32 bg-muted border-border" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">EC Measured</label>
                        <Input type="number" min={0} step={0.01} value={feedForm.ec_measured} onChange={(e) => setFeedForm({ ...feedForm, ec_measured: e.target.value })} placeholder="–" className="w-28 bg-muted border-border" />
                      </div>
                      {ecTarget && (
                        <div className="text-xs text-muted-foreground pb-2">
                          Target EC: <span className="text-primary font-semibold">{ecTarget.min}–{ecTarget.max}</span>
                        </div>
                      )}
                    </div>
                    {waterVol > 0 && (() => {
                      const activeRows = schedule.rows.filter((r) => (r.amounts[stage] || 0) > 0);
                      const hasPhos = activeRows.some((r) => r.nutrient_id === 'phoszyme');
                      const hasHypo = activeRows.some((r) => r.nutrient_id === 'cal-hypo');
                      return (
                        <div className="space-y-3">
                          {hasPhos && hasHypo && (
                            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Steriliser may reduce enzyme effectiveness</span>
                            </div>
                          )}
                          {CATEGORY_ORDER.map((cat) => {
                            const rows = activeRows.filter((r) => r.category === cat);
                            if (rows.length === 0) return null;
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wide text-primary px-1">{CATEGORY_LABELS[cat]}</div>
                                {rows.map((row) => {
                                  const total = (row.amounts[stage] || 0) * waterVol;
                                  const unit = formUnitShort(row.nutrient_type);
                                  return (
                                    <div key={row.nutrient_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm">
                                      <span className="text-foreground">{row.nutrient_name}</span>
                                      <span className="font-semibold text-primary">{total.toFixed(2)} {unit}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <Button onClick={logFeed} disabled={waterVol <= 0} className="gradient-primary text-primary-foreground">
                      Log Feed
                    </Button>
                  </div>
                );
              })()}
            </div>

            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Feed History</h3>
              {cycleFeedLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feed logs yet.</p>
              ) : (
                <div className="space-y-2">
                  {cycleFeedLogs.map((log) => {
                    const groups: { label: string; items: { name: string; amount: number; unit: string }[] }[] = [
                      { label: 'Nutrients', items: log.nutrients || [] },
                      { label: 'Additives', items: log.additives || [] },
                      { label: 'Treatments', items: log.treatments || [] },
                    ];
                    return (
                      <div key={log.id} className="px-3 py-2 rounded-lg bg-muted/50 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-foreground">
                            {log.water_volume}L
                            {log.ec_measured != null && (
                              <span className="ml-2 text-xs text-muted-foreground">EC <span className="text-primary font-semibold">{log.ec_measured}</span></span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{format(new Date(log.date), "MMM d, HH:mm")}</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {groups.filter((g) => g.items.length > 0).map((g) => (
                            <div key={g.label} className="text-xs text-muted-foreground">
                              <span className="text-primary font-medium">{g.label}:</span>{" "}
                              {g.items.map((n) => `${n.name} ${n.amount.toFixed(2)}${n.unit}`).join(" · ")}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
