import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { FormFooter } from "@/components/forms/FormFooter";
import { NutrientsSection } from "@/components/NutrientsSection";
import { FEED_STAGES, CATEGORY_ORDER, CATEGORY_LABELS, formUnit, type FeedSchedule, type GrowStage, type Nutrient, type NutrientCategory, type NutrientType } from "@/types";

const emptyMeta = { name: "", notes: "" };

export default function FeedSchedulesPage() {
  const { feedSchedules, nutrients, addFeedSchedule, updateFeedSchedule, deleteFeedSchedule, reorderFeedScheduleRow, addNutrient, addScheduleRow } = useStore();

  // Schedule create/edit metadata dialog
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaForm, setMetaForm] = useState<typeof emptyMeta & { id?: string; updated_at?: string }>(emptyMeta);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(false);
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(null);

  // Inline tabular editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add row dialog
  const [addRowFor, setAddRowFor] = useState<{ scheduleId: string; category: NutrientCategory } | null>(null);
  const [pickedId, setPickedId] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createForm, setCreateForm] = useState<NutrientType>("dry");

  const openMeta = (schedule?: FeedSchedule) => {
    setMetaForm(schedule ? { id: schedule.id, name: schedule.name, notes: schedule.notes, updated_at: schedule.updated_at } : emptyMeta);
    setMetaOpen(true);
  };

  const saveMeta = () => {
    if (!metaForm.name.trim()) return;
    if (metaForm.id) {
      updateFeedSchedule(metaForm.id, { name: metaForm.name.trim(), notes: metaForm.notes });
    } else {
      const schedule: FeedSchedule = {
        id: crypto.randomUUID(),
        name: metaForm.name.trim(),
        notes: metaForm.notes,
        rows: [],
        ec_targets: {},
        created_at: new Date().toISOString(),
      };
      addFeedSchedule(schedule);
      setEditingId(schedule.id);
    }
    setMetaOpen(false);
  };

  const updateAmount = (scheduleId: string, rowId: string, stage: GrowStage, value: number) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId); if (!schedule) return;
    updateFeedSchedule(scheduleId, { rows: schedule.rows.map((r) => r.id === rowId ? { ...r, amounts: { ...r.amounts, [stage]: value } } : r) });
  };
  const removeRow = (scheduleId: string, rowId: string) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId); if (!schedule) return;
    updateFeedSchedule(scheduleId, { rows: schedule.rows.filter((r) => r.id !== rowId).map((r, i) => ({ ...r, order_index: i })) });
  };
  const updateEcTarget = (scheduleId: string, stage: GrowStage, key: 'min' | 'max', value: number) => {
    const schedule = feedSchedules.find((s) => s.id === scheduleId); if (!schedule) return;
    const current = schedule.ec_targets?.[stage] ?? { min: 0, max: 0 };
    updateFeedSchedule(scheduleId, { ec_targets: { ...(schedule.ec_targets || {}), [stage]: { ...current, [key]: value } } });
  };
  const confirmAddRow = () => {
    if (!addRowFor) return;
    if (createMode) {
      if (!createName.trim()) return;
      const newItem: Nutrient = { id: crypto.randomUUID(), name: createName.trim(), category: addRowFor.category, form: createForm, active: true, unit: formUnit(createForm), type: createForm };
      addNutrient(newItem); addScheduleRow(addRowFor.scheduleId, newItem);
    } else {
      const item = nutrients.find((n) => n.id === pickedId); if (item) addScheduleRow(addRowFor.scheduleId, item);
    }
    setAddRowFor(null); setPickedId(""); setCreateName(""); setCreateMode(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Feed Schedules</h1>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openMeta()}>
          <Plus className="w-4 h-4 mr-1" /> New Schedule
        </Button>
      </div>

      <div className="space-y-6">
        {[...feedSchedules].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((schedule) => (
          <div key={schedule.id} className="glass-card p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-lg">{schedule.name}</h3>
                {schedule.notes && <p className="text-sm text-muted-foreground">{schedule.notes}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openMeta(schedule)} title="Edit name & notes"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === schedule.id ? null : schedule.id)}>
                  {editingId === schedule.id ? "Done" : "Edit Rows"}
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeleteRowId(schedule.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[720px]"><thead><tr className="border-b border-border"><th className="text-left py-2 px-2 text-muted-foreground font-medium">Item</th><th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Unit</th>{FEED_STAGES.map((stage) => <th key={stage} className="text-center py-2 px-2 text-muted-foreground font-medium capitalize text-xs"><div>{stage}</div>{schedule.ec_targets?.[stage] && <div className="text-[10px] font-normal text-primary/80 normal-case mt-0.5">EC {schedule.ec_targets[stage]!.min}–{schedule.ec_targets[stage]!.max}</div>}</th>)}{editingId === schedule.id && <th className="w-24" />}</tr></thead><tbody>
              {editingId === schedule.id && <tr className="border-b border-border/50 bg-muted/20"><td className="py-2 px-2 text-xs font-semibold uppercase tracking-wide text-primary" colSpan={2}>EC Target</td>{FEED_STAGES.map((stage) => { const t = schedule.ec_targets?.[stage] ?? { min: 0, max: 0 }; return <td key={stage} className="py-2 px-1"><div className="flex items-center justify-center gap-1"><Input type="number" min={0} step={0.1} value={t.min} onChange={(e) => updateEcTarget(schedule.id, stage, 'min', parseFloat(e.target.value) || 0)} className="w-12 h-7 text-center bg-muted border-border text-xs px-1" /><span className="text-muted-foreground text-xs">–</span><Input type="number" min={0} step={0.1} value={t.max} onChange={(e) => updateEcTarget(schedule.id, stage, 'max', parseFloat(e.target.value) || 0)} className="w-12 h-7 text-center bg-muted border-border text-xs px-1" /></div></td>; })}<td /></tr>}
              {CATEGORY_ORDER.map((cat) => { const rows = schedule.rows.filter((r) => r.category === cat).sort((a, b) => a.order_index - b.order_index); return <>{<tr key={`hdr-${cat}-${schedule.id}`} className="bg-muted/30"><td colSpan={2 + FEED_STAGES.length + (editingId === schedule.id ? 1 : 0)} className="py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[cat]}</td></tr>}{rows.map((row, idx) => <tr key={row.id} className="border-b border-border/50"><td className="py-2 px-2 text-foreground font-medium">{row.nutrient_name}</td><td className="py-2 px-2 text-center"><span className="text-xs text-muted-foreground">{formUnit(row.nutrient_type)}</span></td>{FEED_STAGES.map((stage) => <td key={stage} className="py-2 px-2 text-center">{editingId === schedule.id ? <Input type="number" min={0} step={0.01} value={row.amounts[stage] ?? 0} onChange={(e) => updateAmount(schedule.id, row.id, stage, parseFloat(e.target.value) || 0)} className="w-16 h-8 text-center bg-muted border-border text-xs mx-auto" /> : <span className="text-foreground">{row.amounts[stage] || "–"}</span>}</td>)}{editingId === schedule.id && <td className="py-2 px-2"><div className="flex items-center gap-0.5 justify-end"><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={idx === 0} onClick={() => reorderFeedScheduleRow(schedule.id, row.id, 'up')}><ArrowUp className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={idx === rows.length - 1} onClick={() => reorderFeedScheduleRow(schedule.id, row.id, 'down')}><ArrowDown className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(schedule.id, row.id)}><Trash2 className="w-3 h-3" /></Button></div></td>}</tr>)}</>; })}
            </tbody></table></div>

            {editingId === schedule.id && (
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddRowFor({ scheduleId: schedule.id, category: cat });
                      setPickedId("");
                      setCreateMode(false);
                      setCreateName("");
                      setCreateForm(cat === "additive" ? "liquid" : "dry");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add {CATEGORY_LABELS[cat].slice(0, -1)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule meta dialog */}
      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{metaForm.id ? "Edit Feed Schedule" : "New Feed Schedule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Schedule Name" htmlFor="sched-name" required>
              <Input id="sched-name" value={metaForm.name} onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormField label="Notes" htmlFor="sched-notes" helper="Optional context, growth phase, recipe source, etc.">
              <Textarea id="sched-notes" value={metaForm.notes} onChange={(e) => setMetaForm({ ...metaForm, notes: e.target.value })} className="bg-muted border-border" />
            </FormField>
            <FormFooter
              onSave={saveMeta}
              onCancel={() => setMetaOpen(false)}
              onDelete={metaForm.id ? () => setConfirmDeleteSchedule(true) : undefined}
              saveDisabled={!metaForm.name.trim()}
              lastUpdated={metaForm.id ? metaForm.updated_at : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add row dialog */}
      <Dialog open={!!addRowFor} onOpenChange={(o) => !o && setAddRowFor(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add {addRowFor ? CATEGORY_LABELS[addRowFor.category].slice(0, -1) : ""}</DialogTitle>
          </DialogHeader>
          {addRowFor && (
            <div className="space-y-4 mt-2">
              {!createMode ? (
                <>
                  <FormField label="Item" helper="Pick from your nutrient library">
                    <Select value={pickedId} onValueChange={setPickedId}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select an item" /></SelectTrigger>
                      <SelectContent>
                        {nutrients
                          .filter((n) => n.active && n.category === addRowFor.category && !feedSchedules.find((s) => s.id === addRowFor.scheduleId)?.rows.some((r) => r.nutrient_id === n.id))
                          .map((n) => <SelectItem key={n.id} value={n.id}>{n.name} ({formUnit(n.form)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setCreateMode(true)}>
                    + Create a new item instead
                  </button>
                </>
              ) : (
                <>
                  <FormField label="Name" htmlFor="row-new-name" required>
                    <Input id="row-new-name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="bg-muted border-border" />
                  </FormField>
                  <FormField label="Form" helper="Dry uses g/L, Liquid uses ml/L">
                    <Select value={createForm} onValueChange={(v) => setCreateForm(v as NutrientType)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dry">Dry (g/L)</SelectItem>
                        <SelectItem value="liquid">Liquid (ml/L)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setCreateMode(false)}>
                    ← Pick from library instead
                  </button>
                </>
              )}
              <FormFooter
                onSave={confirmAddRow}
                onCancel={() => setAddRowFor(null)}
                saveLabel="Add"
                saveDisabled={createMode ? !createName.trim() : !pickedId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteSchedule} onOpenChange={setConfirmDeleteSchedule}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>This removes the schedule. Historical feed logs that referenced it will remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (metaForm.id) deleteFeedSchedule(metaForm.id); setConfirmDeleteSchedule(false); setMetaOpen(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteRowId} onOpenChange={(o) => !o && setConfirmDeleteRowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>This removes the schedule. Historical feed logs that referenced it will remain intact. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDeleteRowId) deleteFeedSchedule(confirmDeleteRowId); setConfirmDeleteRowId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-t border-border/50 pt-6">
        <NutrientsSection />
      </div>
    </div>
  );
}
