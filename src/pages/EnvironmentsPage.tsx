import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STAGES, type Environment, type GrowStage } from "@/types";
import { cn } from "@/lib/utils";

export default function EnvironmentsPage() {
  const { environments, addEnvironment, deleteEnvironment } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newEnv, setNewEnv] = useState({ name: "", site_count: 4, supported_stages: [] as GrowStage[], monitored_params: ["temp", "humidity", "pH", "EC"] });

  const toggleStage = (stage: GrowStage) => {
    setNewEnv((prev) => ({
      ...prev,
      supported_stages: prev.supported_stages.includes(stage)
        ? prev.supported_stages.filter((s) => s !== stage)
        : [...prev.supported_stages, stage],
    }));
  };

  const handleCreate = () => {
    if (!newEnv.name) return;
    const env: Environment = {
      id: crypto.randomUUID(),
      name: newEnv.name,
      supported_stages: newEnv.supported_stages,
      site_count: newEnv.site_count,
      monitored_params: newEnv.monitored_params,
    };
    addEnvironment(env);
    setNewEnv({ name: "", site_count: 4, supported_stages: [], monitored_params: ["temp", "humidity", "pH", "EC"] });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Environments</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> New Environment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Environment</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Environment name" value={newEnv.name} onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })} className="bg-muted border-border" />
              <div>
                <label className="text-sm text-muted-foreground">Site Count</label>
                <Input type="number" min={1} value={newEnv.site_count} onChange={(e) => setNewEnv({ ...newEnv, site_count: parseInt(e.target.value) || 1 })} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Supported Stages</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((stage) => (
                    <button key={stage} onClick={() => toggleStage(stage)} className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize border transition-colors", newEnv.supported_stages.includes(stage) ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {environments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No environments yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div key={env.id} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{env.name}</h3>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteEnvironment(env.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{env.site_count} sites</p>
              <div className="flex flex-wrap gap-1">
                {env.supported_stages.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs capitalize border-border text-muted-foreground">{s}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {env.monitored_params.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
