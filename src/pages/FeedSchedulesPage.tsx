import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { FEED_STAGES, CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type FeedSchedule, type FeedScheduleRow, type GrowStage } from "@/types";

export default function FeedSchedulesPage() {
  const { feedSchedules, nutrients, addFeedSchedule, updateFeedSchedule, deleteFeedSchedule, reorderFeedScheduleRow } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName) return;
    const schedule: FeedSchedule = {
      id: crypto.randomUUID(),
      name: newName,
      rows: [],
    };
    addFeedSchedule(schedule);
    setNewName("");
    setShowCreate(false);
    setEditingId(schedule.id);
  };

  const addRow = (scheduleId: string, nutrientId: string) => {
    const nutrient = nutrients.find((n) => n.id === nutrientId);
    if (!nutrient) return;
    const schedule = feedSchedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const newRow: FeedScheduleRow = {
      nutrient_id: nutrientId,
      nutrient_name: nutrient.name,
      nutrient_type: nutrient.form,
      category: nutrient.category,
      amounts: Object.fromEntries(FEED_STAGES.map((s) => [s, 0])),
    };
    updateFeedSchedule(scheduleId, { rows: [...schedule.rows, newRow] });
  };

  const updateAmount = (scheduleId: string, nutrientId: string, stage: string, value: number) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const rows = schedule.rows.map((r) =>
      r.nutrient_id === nutrientId ? { ...r, amounts: { ...r.amounts, [stage]: value } } : r
    );
    updateFeedSchedule(scheduleId, { rows });
  };

  const removeRow = (scheduleId: string, nutrientId: string) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    updateFeedSchedule(scheduleId, { rows: schedule.rows.filter((r) => r.nutrient_id !== nutrientId) });
  };

  const updateEcTarget = (scheduleId: string, stage: GrowStage, key: 'min' | 'max', value: number) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const current = schedule.ec_targets?.[stage] ?? { min: 0, max: 0 };
    const ec_targets = { ...(schedule.ec_targets || {}), [stage]: { ...current, [key]: value } };
    updateFeedSchedule(scheduleId, { ec_targets });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feed Schedules</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Feed Schedule</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Schedule name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-muted border-border" />
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {feedSchedules.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No feed schedules yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {feedSchedules.map((schedule) => (
            <div key={schedule.id} className="glass-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">{schedule.name}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === schedule.id ? null : schedule.id)}>
                    {editingId === schedule.id ? "Done" : "Edit"}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteFeedSchedule(schedule.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Feed Grid - grouped by category */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Unit</th>
                      {FEED_STAGES.map((stage) => (
                        <th key={stage} className="text-center py-2 px-2 text-muted-foreground font-medium capitalize text-xs">
                          <div>{stage}</div>
                          {schedule.ec_targets?.[stage] && (
                            <div className="text-[10px] font-normal text-primary/80 normal-case mt-0.5">
                              EC {schedule.ec_targets[stage]!.min}–{schedule.ec_targets[stage]!.max}
                            </div>
                          )}
                        </th>
                      ))}
                      {editingId === schedule.id && <th className="w-24"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {editingId === schedule.id && (
                      <tr className="border-b border-border/50 bg-muted/20">
                        <td className="py-2 px-2 text-xs font-semibold uppercase tracking-wide text-primary" colSpan={2}>EC Target</td>
                        {FEED_STAGES.map((stage) => {
                          const t = schedule.ec_targets?.[stage] ?? { min: 0, max: 0 };
                          return (
                            <td key={stage} className="py-2 px-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input type="number" min={0} step={0.1} value={t.min} onChange={(e) => updateEcTarget(schedule.id, stage, 'min', parseFloat(e.target.value) || 0)} className="w-12 h-7 text-center bg-muted border-border text-xs px-1" />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input type="number" min={0} step={0.1} value={t.max} onChange={(e) => updateEcTarget(schedule.id, stage, 'max', parseFloat(e.target.value) || 0)} className="w-12 h-7 text-center bg-muted border-border text-xs px-1" />
                              </div>
                            </td>
                          );
                        })}
                        <td></td>
                      </tr>
                    )}
                    {CATEGORY_ORDER.map((cat) => {
                      const rows = schedule.rows.filter((r) => r.category === cat);
                      if (rows.length === 0) return null;
                      return (
                        <>
                          <tr key={`hdr-${cat}`} className="bg-muted/30">
                            <td colSpan={2 + FEED_STAGES.length + (editingId === schedule.id ? 1 : 0)} className="py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-primary">
                              {CATEGORY_LABELS[cat]}
                            </td>
                          </tr>
                          {rows.map((row, rowIdx) => (
                            <tr key={row.nutrient_id} className="border-b border-border/50">
                              <td className="py-2 px-2 text-foreground font-medium">{row.nutrient_name}</td>
                              <td className="py-2 px-2 text-center">
                                <span className="text-xs text-muted-foreground">{formUnit(row.nutrient_type)}</span>
                              </td>
                              {FEED_STAGES.map((stage) => (
                                <td key={stage} className="py-2 px-2 text-center">
                                  {editingId === schedule.id ? (
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={row.amounts[stage] ?? 0}
                                      onChange={(e) => updateAmount(schedule.id, row.nutrient_id, stage, parseFloat(e.target.value) || 0)}
                                      className="w-16 h-8 text-center bg-muted border-border text-xs mx-auto"
                                    />
                                  ) : (
                                    <span className="text-foreground">{row.amounts[stage] || "–"}</span>
                                  )}
                                </td>
                              ))}
                              {editingId === schedule.id && (
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-0.5 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={rowIdx === 0} onClick={() => reorderFeedScheduleRow(schedule.id, row.nutrient_id, 'up')}>
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={rowIdx === rows.length - 1} onClick={() => reorderFeedScheduleRow(schedule.id, row.nutrient_id, 'down')}>
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(schedule.id, row.nutrient_id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {editingId === schedule.id && (
                <Select onValueChange={(v) => addRow(schedule.id, v)}>
                  <SelectTrigger className="w-48 bg-muted border-border"><SelectValue placeholder="Add nutrient..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.flatMap((cat) =>
                      nutrients
                        .filter((n) => n.category === cat && !schedule.rows.find((r) => r.nutrient_id === n.id))
                        .map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name} · {CATEGORY_LABELS[cat].slice(0, -1)} ({formUnit(n.form)})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
