import { describe, it, expect, beforeEach, vi } from "vitest";
import { useStore } from "@/store/useStore";
import { undoableDelete } from "@/lib/undoToast";

const toastFn = vi.fn();
vi.mock("sonner", () => ({
  toast: (label: string, opts: { action?: { onClick: () => void } }) => {
    toastFn(label, opts);
    // expose the latest action so tests can invoke "Undo"
    (toastFn as unknown as { last?: () => void }).last = opts?.action?.onClick;
  },
}));

const mkTask = (id: string) => ({
  id, grow_cycle_id: null, name: id, title: id, description: "",
  due_date: null, stage_trigger: null, status: "open" as const,
  completed: false, generated_from_environment: false,
  priority: "medium" as const, reminder_time: null,
  repeat: "none" as const, repeat_parent_id: null,
});

describe("undoableDelete", () => {
  beforeEach(() => {
    toastFn.mockClear();
    useStore.setState({
      growCycles: [], stageHistory: [], environments: [], feedSchedules: [],
      nutrients: [], tasks: [], events: [], parameterLogs: [], alertRules: [],
      feedLogs: [], strains: [], growStrains: [], plants: [], environmentTimeline: [],
      parameters: [],
    });
  });

  it("performs the delete and exposes an Undo action that restores it", () => {
    useStore.setState({ tasks: [mkTask("a"), mkTask("b")] });
    const { deleteTask } = useStore.getState();

    undoableDelete({ label: "Task deleted", slices: ["tasks"], perform: () => deleteTask("a") });

    expect(useStore.getState().tasks.map((t) => t.id)).toEqual(["b"]);
    expect(toastFn).toHaveBeenCalledWith("Task deleted", expect.any(Object));

    // Invoke Undo
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().tasks.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("preserves new items added between delete and undo", () => {
    useStore.setState({ tasks: [mkTask("a")] });
    undoableDelete({ label: "Task deleted", slices: ["tasks"], perform: () => useStore.getState().deleteTask("a") });
    useStore.setState({ tasks: [...useStore.getState().tasks, mkTask("c")] });
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().tasks.map((t) => t.id).sort()).toEqual(["a", "c"]);
  });

  it("restores cascaded deletes across multiple slices (grow cycle)", () => {
    useStore.setState({
      growCycles: [{
        id: "g1", name: "G1", custom_name: "G1", start_date: "2024-01-01",
        status: "active", current_stage: "veg", stage_start_date: "2024-01-01",
        flower_weeks: 8, feed_mode: "fixed", environment_id: null,
        feed_schedule_id: null, strains: [], created_at: "2024-01-01",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any],
      tasks: [mkTask("t1"), { ...mkTask("t2"), grow_cycle_id: "g1" }],
    });
    undoableDelete({
      label: "Grow cycle deleted",
      slices: ["growCycles", "tasks"],
      perform: () => useStore.getState().deleteGrowCycle("g1"),
    });
    expect(useStore.getState().growCycles).toHaveLength(0);
    expect(useStore.getState().tasks.map((t) => t.id)).toEqual(["t1"]);
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().growCycles.map((g) => g.id)).toEqual(["g1"]);
    expect(useStore.getState().tasks.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });
});