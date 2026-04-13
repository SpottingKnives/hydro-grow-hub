import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { FEED_STAGES, type FeedSchedule, type FeedScheduleRow, type NutrientType } from "@/types";

export default function FeedSchedulesPage() {
  const { feedSchedules, nutrients, addFeedSchedule, updateFeedSchedule, deleteFeedSchedule } = useStore();
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
      nutrient_type: nutrient.type,
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

              {/* Feed Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Nutrient</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Type</th>
                      {FEED_STAGES.map((stage) => (
                        <th key={stage} className="text-center py-2 px-2 text-muted-foreground font-medium capitalize text-xs">{stage}</th>
                      ))}
                      {editingId === schedule.id && <th className="w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.rows.map((row) => (
                      <tr key={row.nutrient_id} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground font-medium">{row.nutrient_name}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-xs text-muted-foreground">{row.nutrient_type === 'liquid' ? 'ml/L' : 'g/L'}</span>
                        </td>
                        {FEED_STAGES.map((stage) => (
                          <td key={stage} className="py-2 px-2 text-center">
                            {editingId === schedule.id ? (
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={row.amounts[stage] || 0}
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(schedule.id, row.nutrient_id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editingId === schedule.id && (
                <Select onValueChange={(v) => addRow(schedule.id, v)}>
                  <SelectTrigger className="w-48 bg-muted border-border"><SelectValue placeholder="Add nutrient..." /></SelectTrigger>
                  <SelectContent>
                    {nutrients.filter((n) => !schedule.rows.find((r) => r.nutrient_id === n.id)).map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.name} ({n.type})</SelectItem>
                    ))}
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
