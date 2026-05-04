import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { FilterBar } from "@/components/FilterBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, ScrollText } from "lucide-react";
import { STAGES, type GrowStage } from "@/types";

type LogKind = "all" | "parameters" | "tasks" | "events" | "feed";

interface LogEntry {
  id: string;
  source: "parameter" | "feed" | "event";
  kind: Exclude<LogKind, "all">;
  title: string;
  timestamp: string;
  grow_cycle_id: string | null;
  environment_id?: string | null;
  stage?: GrowStage | null;
}

const KIND_LABELS: Record<Exclude<LogKind, "all">, string> = {
  parameters: "Parameters",
  tasks: "Task",
  events: "Event",
  feed: "Feed",
};

export default function LogsPage() {
  const { parameterLogs, feedLogs, events, growCycles, environments, deleteParameterLog, deleteFeedLog, deleteEvent } = useStore();
  const [kind, setKind] = useState<LogKind>("all");
  const [growId, setGrowId] = useState<string>("all");
  const [envId, setEnvId] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [confirmDel, setConfirmDel] = useState<LogEntry | null>(null);

  const entries = useMemo<LogEntry[]>(() => {
    const out: LogEntry[] = [];
    parameterLogs.forEach((l) => {
      const count = l.values ? Object.keys(l.values).length : (l.value != null ? 1 : 0);
      out.push({
        id: l.id, source: "parameter", kind: "parameters",
        title: count > 0 ? `Parameters logged (${count})` : "Parameters logged",
        timestamp: l.timestamp, grow_cycle_id: l.grow_cycle_id, environment_id: l.environment_id ?? null,
      });
    });
    feedLogs.forEach((l) => {
      out.push({
        id: l.id, source: "feed", kind: "feed",
        title: `Feed logged${l.ec_measured != null ? ` (EC: ${l.ec_measured})` : ""}`,
        timestamp: l.timestamp || l.date, grow_cycle_id: l.grow_cycle_id, stage: l.stage,
      });
    });
    events.forEach((e) => {
      const isTaskLog = e.title.startsWith("Task ");
      out.push({
        id: e.id, source: "event", kind: isTaskLog ? "tasks" : "events",
        title: e.title, timestamp: e.date, grow_cycle_id: e.grow_cycle_id || null,
      });
    });
    return out;
  }, [parameterLogs, feedLogs, events]);

  const filtered = useMemo(() => entries.filter((e) => {
    if (kind !== "all" && e.kind !== kind) return false;
    if (growId !== "all" && e.grow_cycle_id !== growId) return false;
    if (envId !== "all" && e.environment_id !== envId) return false;
    if (stage !== "all" && e.stage !== stage) return false;
    return true;
  }), [entries, kind, growId, envId, stage]);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    filtered.forEach((e) => {
      const key = e.grow_cycle_id || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    map.forEach((arr) => arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    return Array.from(map.entries());
  }, [filtered]);

  const confirmDelete = () => {
    if (!confirmDel) return;
    if (confirmDel.source === "parameter") deleteParameterLog(confirmDel.id);
    else if (confirmDel.source === "feed") deleteFeedLog(confirmDel.id);
    else deleteEvent(confirmDel.id);
    setConfirmDel(null);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Logs</h1>
      </div>

      <FilterBar<LogKind>
        ariaLabel="Log type filter"
        options={["all", "parameters", "tasks", "events", "feed"] as const}
        value={kind}
        onChange={setKind}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select value={growId} onValueChange={setGrowId}>
          <SelectTrigger className="bg-muted border-border h-9 text-xs"><SelectValue placeholder="Grow Cycle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grows</SelectItem>
            {growCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={envId} onValueChange={setEnvId}>
          <SelectTrigger className="bg-muted border-border h-9 text-xs"><SelectValue placeholder="Environment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All environments</SelectItem>
            {environments.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="bg-muted border-border h-9 text-xs"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No logs match these filters.</p></div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([gid, items]) => {
            const cycle = growCycles.find((c) => c.id === gid);
            return (
              <div key={gid} className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground px-1">
                  {cycle ? cycle.name : "Unlinked"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
                </h2>
                <div className="space-y-1.5">
                  {items.map((it) => (
                    <div key={`${it.source}-${it.id}`} className="glass-card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                        <p className="mt-0.5 text-[12px] leading-tight text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                          <span>{format(new Date(it.timestamp), "d MMM HH:mm")}</span>
                          {" • "}
                          <span>{KIND_LABELS[it.kind]}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{it.kind}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDel(it)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}