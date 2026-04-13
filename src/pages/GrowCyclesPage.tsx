import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { STAGES, type GrowCycle, type GrowStage } from "@/types";
import { Link } from "react-router-dom";

export default function GrowCyclesPage() {
  const { growCycles, environments, feedSchedules, addGrowCycle, deleteGrowCycle } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newCycle, setNewCycle] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    environment_id: "",
    feed_schedule_id: "",
    current_stage: "nursery" as GrowStage,
  });

  const handleCreate = () => {
    const startDate = new Date(newCycle.start_date);
    const name = `Grow ${format(startDate, "MMM yyyy")} #${growCycles.length + 1}`;
    const cycle: GrowCycle = {
      id: crypto.randomUUID(),
      name,
      start_date: startDate.toISOString(),
      status: "active",
      current_stage: newCycle.current_stage,
      stage_start_date: startDate.toISOString(),
      environment_id: newCycle.environment_id || null,
      feed_schedule_id: newCycle.feed_schedule_id || null,
      strains: [],
      created_at: new Date().toISOString(),
    };
    addGrowCycle(cycle);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Grow Cycles</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> New Grow
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Grow Cycle</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm text-muted-foreground">Start Date</label>
                <Input type="date" value={newCycle.start_date} onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Starting Stage</label>
                <Select value={newCycle.current_stage} onValueChange={(v) => setNewCycle({ ...newCycle, current_stage: v as GrowStage })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {environments.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Environment</label>
                  <Select value={newCycle.environment_id} onValueChange={(v) => setNewCycle({ ...newCycle, environment_id: v })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {environments.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {feedSchedules.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Feed Schedule</label>
                  <Select value={newCycle.feed_schedule_id} onValueChange={(v) => setNewCycle({ ...newCycle, feed_schedule_id: v })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {feedSchedules.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Grow Cycle</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {growCycles.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No grow cycles yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {growCycles.map((cycle) => {
            const daysSinceStart = Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000);
            return (
              <Link key={cycle.id} to={`/grows/${cycle.id}`} className="glass-card p-4 flex items-center justify-between hover:border-primary/30 transition-colors block">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{cycle.name}</h3>
                    <p className="text-xs text-muted-foreground">Day {daysSinceStart} · Started {format(new Date(cycle.start_date), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StageBadge stage={cycle.current_stage} />
                  <StatusBadge status={cycle.status} />
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); deleteGrowCycle(cycle.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
