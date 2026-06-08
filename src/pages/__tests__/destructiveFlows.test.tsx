import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders, resetStore } from "@/test/utils";
import { useStore } from "@/store/useStore";
import TasksEventsPage from "@/pages/TasksEventsPage";
import LogsPage from "@/pages/LogsPage";
import EnvironmentsPage from "@/pages/EnvironmentsPage";
import FeedSchedulesPage from "@/pages/FeedSchedulesPage";
import GrowCyclesPage from "@/pages/GrowCyclesPage";

const toastFn = vi.fn();
vi.mock("sonner", async () => {
  const actual = await vi.importActual<typeof import("sonner")>("sonner");
  return {
    ...actual,
    toast: (label: string, opts: { action?: { onClick: () => void } }) => {
      toastFn(label, opts);
      (toastFn as unknown as { last?: () => void }).last = opts?.action?.onClick;
    },
  };
});

const baseTask = (id: string, title = "Sample task") => ({
  id, grow_cycle_id: null, name: title, title, description: "",
  due_date: null, stage_trigger: null, status: "open" as const,
  completed: false, generated_from_environment: false,
  priority: "medium" as const, reminder_time: null,
  repeat: "none" as const, repeat_parent_id: null,
});

beforeEach(() => {
  resetStore();
  toastFn.mockClear();
});

describe("Tasks delete flow", () => {
  it("opens confirm, deletes on confirm, and shows undo toast that restores", () => {
    useStore.setState({ tasks: [baseTask("t1", "Water plants")] });
    renderWithProviders(<TasksEventsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Delete this task?")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(useStore.getState().tasks).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith("Task deleted", expect.any(Object));

    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().tasks.map((t) => t.id)).toEqual(["t1"]);
  });

  it("does nothing when cancel is pressed", () => {
    useStore.setState({ tasks: [baseTask("t1")] });
    renderWithProviders(<TasksEventsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    expect(useStore.getState().tasks).toHaveLength(1);
    expect(toastFn).not.toHaveBeenCalled();
  });
});

describe("Logs delete flow", () => {
  it("deletes a parameter log and offers undo", () => {
    useStore.setState({
      parameterLogs: [{ id: "p1", grow_cycle_id: "", timestamp: new Date().toISOString(), values: { ph: 6.0 } }],
    });
    renderWithProviders(<LogsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete log entry" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(useStore.getState().parameterLogs).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith("Log entry deleted", expect.any(Object));
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().parameterLogs).toHaveLength(1);
  });
});

describe("Environments delete flow", () => {
  it("deletes environment, shows undo, and cancel preserves it", () => {
    useStore.setState({
      environments: [{
        id: "e1", name: "Room A", site_count: 4,
        supported_stages: ["veg"], system_description: "",
        parameter_ids: [], task_templates: [], reservoir_volume: 50,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any],
    });
    renderWithProviders(<EnvironmentsPage />);
    // cancel
    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    expect(useStore.getState().environments).toHaveLength(1);
    // confirm
    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(useStore.getState().environments).toHaveLength(0);
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().environments).toHaveLength(1);
  });
});

describe("Feed schedules delete flow", () => {
  it("deletes feed schedule with undo", () => {
    useStore.setState({
      feedSchedules: [{
        id: "f1", name: "S1", notes: "", created_at: "2024-01-01",
        ec_targets: {}, rows: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any],
    });
    renderWithProviders(<FeedSchedulesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete feed schedule" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(useStore.getState().feedSchedules).toHaveLength(0);
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().feedSchedules).toHaveLength(1);
  });
});

describe("Grow cycles delete flow", () => {
  it("deletes grow cycle and restores via undo", () => {
    useStore.setState({
      growCycles: [{
        id: "g1", name: "Grow 1", custom_name: "Grow 1",
        start_date: "2024-01-01T00:00:00.000Z", status: "active",
        current_stage: "veg", stage_start_date: "2024-01-01T00:00:00.000Z",
        flower_weeks: 8, feed_mode: "fixed", environment_id: null,
        feed_schedule_id: null, strains: [], created_at: "2024-01-01T00:00:00.000Z",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any],
    });
    renderWithProviders(<GrowCyclesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete grow cycle" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(useStore.getState().growCycles).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith("Grow cycle deleted", expect.any(Object));
    (toastFn as unknown as { last: () => void }).last();
    expect(useStore.getState().growCycles).toHaveLength(1);
  });
});