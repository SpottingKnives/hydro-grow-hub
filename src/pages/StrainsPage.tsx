import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export default function StrainsPage() {
  const { strains, breeders, addStrain, deleteStrain, addBreeder } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newStrain, setNewStrain] = useState({ name: "", breeder_name: "", veg_days_est: 21, flower_days_est: 56, stretch_percent: 100, notes: "" });

  const handleCreate = () => {
    if (!newStrain.name) return;
    let breederId = breeders.find((b) => b.name.toLowerCase() === newStrain.breeder_name.toLowerCase())?.id;
    if (!breederId && newStrain.breeder_name) {
      breederId = crypto.randomUUID();
      addBreeder({ id: breederId, name: newStrain.breeder_name });
    }
    addStrain({
      id: crypto.randomUUID(),
      name: newStrain.name,
      breeder_id: breederId || "",
      breeder_name: newStrain.breeder_name,
      veg_days_est: newStrain.veg_days_est,
      flower_days_est: newStrain.flower_days_est,
      stretch_percent: newStrain.stretch_percent,
      traits: [],
      notes: newStrain.notes,
    });
    setNewStrain({ name: "", breeder_name: "", veg_days_est: 21, flower_days_est: 56, stretch_percent: 100, notes: "" });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Plants & Strains</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> Add Strain
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Add Strain</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Strain name" value={newStrain.name} onChange={(e) => setNewStrain({ ...newStrain, name: e.target.value })} className="bg-muted border-border" />
              <Input placeholder="Breeder" value={newStrain.breeder_name} onChange={(e) => setNewStrain({ ...newStrain, breeder_name: e.target.value })} className="bg-muted border-border" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Veg Days</label>
                  <Input type="number" value={newStrain.veg_days_est} onChange={(e) => setNewStrain({ ...newStrain, veg_days_est: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Flower Days</label>
                  <Input type="number" value={newStrain.flower_days_est} onChange={(e) => setNewStrain({ ...newStrain, flower_days_est: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Stretch %</label>
                  <Input type="number" value={newStrain.stretch_percent} onChange={(e) => setNewStrain({ ...newStrain, stretch_percent: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
                </div>
              </div>
              <Textarea placeholder="Notes" value={newStrain.notes} onChange={(e) => setNewStrain({ ...newStrain, notes: e.target.value })} className="bg-muted border-border" />
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Add Strain</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {strains.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No strains yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strains.map((strain) => (
            <div key={strain.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{strain.name}</h3>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteStrain(strain.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {strain.breeder_name && <p className="text-sm text-muted-foreground">by {strain.breeder_name}</p>}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-muted-foreground">Veg</div>
                  <div className="text-foreground font-medium">{strain.veg_days_est}d</div>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-muted-foreground">Flower</div>
                  <div className="text-foreground font-medium">{strain.flower_days_est}d</div>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-muted-foreground">Stretch</div>
                  <div className="text-foreground font-medium">{strain.stretch_percent}%</div>
                </div>
              </div>
              {strain.notes && <p className="text-xs text-muted-foreground">{strain.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
