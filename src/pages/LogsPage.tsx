import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PARAMS = ["temp", "humidity", "pH", "EC", "CO2", "VPD"];

export default function LogsPage() {
  const { growCycles, parameterLogs, feedLogs, nutrients, feedSchedules, addParameterLog, addFeedLog, addEvent } = useStore();
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [paramForm, setParamForm] = useState({ param: "pH", value: "" });
  const [feedForm, setFeedForm] = useState({ water_volume: "" });

  const activeCycles = growCycles.filter((c) => c.status === "active");
  const selectedCycle = growCycles.find((c) => c.id === selectedCycleId);
  const cycleLogs = parameterLogs.filter((l) => l.grow_cycle_id === selectedCycleId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const cycleFeedLogs = feedLogs.filter((l) => l.grow_cycle_id === selectedCycleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const logParam = () => {
    if (!selectedCycleId || !paramForm.value) return;
    addParameterLog({
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      environment_id: selectedCycle?.environment_id || null,
      timestamp: new Date().toISOString(),
      param: paramForm.param,
      value: parseFloat(paramForm.value),
    });
    setParamForm({ ...paramForm, value: "" });
  };

  const logFeed = () => {
    if (!selectedCycleId || !feedForm.water_volume) return;
    const schedule = feedSchedules.find((f) => f.id === selectedCycle?.feed_schedule_id);
    const stage = selectedCycle?.current_stage || "veg";
    const nutrientAmounts = (schedule?.rows || []).map((row) => ({
      nutrient_id: row.nutrient_id,
      name: row.nutrient_name,
      amount: (row.amounts[stage] || 0) * parseFloat(feedForm.water_volume),
      unit: row.nutrient_type === "liquid" ? "ml" : "g",
    }));

    const log = {
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      date: new Date().toISOString(),
      water_volume: parseFloat(feedForm.water_volume),
      nutrients: nutrientAmounts,
    };
    addFeedLog(log);
    addEvent({
      id: crypto.randomUUID(),
      grow_cycle_id: selectedCycleId,
      type: "feed",
      title: `Fed ${feedForm.water_volume}L`,
      description: nutrientAmounts.map((n) => `${n.name}: ${n.amount.toFixed(1)}${n.unit}`).join(", "),
      date: new Date().toISOString(),
    });
    setFeedForm({ water_volume: "" });
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
                  <Select value={paramForm.param} onValueChange={(v) => setParamForm({ ...paramForm, param: v })}>
                    <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                      <span className="w-16 text-muted-foreground font-medium">{log.param}</span>
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
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Water Volume (L)</label>
                      <Input type="number" min={0} step={0.5} value={feedForm.water_volume} onChange={(e) => setFeedForm({ water_volume: e.target.value })} placeholder="0" className="w-32 bg-muted border-border" />
                    </div>
                    {waterVol > 0 && (
                      <div className="space-y-1">
                        {schedule.rows.map((row) => {
                          const perL = row.amounts[stage] || 0;
                          const total = perL * waterVol;
                          const unit = row.nutrient_type === "liquid" ? "ml" : "g";
                          return (
                            <div key={row.nutrient_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm">
                              <span className="text-foreground">{row.nutrient_name}</span>
                              <span className="font-semibold text-primary">{total.toFixed(1)} {unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                  {cycleFeedLogs.map((log) => (
                    <div key={log.id} className="px-3 py-2 rounded-lg bg-muted/50 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{log.water_volume}L</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(log.date), "MMM d, HH:mm")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.nutrients.map((n) => `${n.name}: ${n.amount.toFixed(1)}${n.unit}`).join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
