import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders, resetStore } from "@/test/utils";
import { useStore } from "@/store/useStore";
import DashboardPage from "@/pages/DashboardPage";
import { format } from "date-fns";

const today = () => new Date();
const todayISO = () => today().toISOString().slice(0, 10);

const mkTask = (id: string, title: string) => ({
  id, grow_cycle_id: null, name: title, title, description: "",
  due_date: todayISO(), stage_trigger: null, status: "open" as const,
  completed: false, generated_from_environment: false,
  priority: "medium" as const, reminder_time: null,
  repeat: "none" as const, repeat_parent_id: null,
});
const mkEvent = (id: string, title: string) => ({
  id, grow_cycle_id: "", type: "note" as const, title, description: "",
  date: new Date().toISOString(),
});

beforeEach(() => resetStore());

describe("Dashboard day drawer", () => {
  it("opens drawer when clicking a day with items, filters by type, and searches", () => {
    useStore.setState({
      tasks: [mkTask("t1", "Water reservoir"), mkTask("t2", "Prune lower fans")],
      events: [mkEvent("e1", "Pest scout"), mkEvent("e2", "Photo log")],
    });
    renderWithProviders(<DashboardPage />);

    // Click the day cell for today
    const dayCell = screen.getByLabelText(new RegExp(`Open ${format(today(), "MMM d")} agenda`, "i"));
    fireEvent.click(dayCell);

    // All four items visible
    expect(screen.getByText("Water reservoir")).toBeInTheDocument();
    expect(screen.getByText("Pest scout")).toBeInTheDocument();

    // Filter to Tasks only
    fireEvent.click(screen.getByRole("tab", { name: /tasks/i }));
    expect(screen.getByText("Water reservoir")).toBeInTheDocument();
    expect(screen.queryByText("Pest scout")).not.toBeInTheDocument();

    // Switch back to All and search
    fireEvent.click(screen.getByRole("tab", { name: /^all/i }));
    const search = screen.getByLabelText(/search day agenda/i);
    fireEvent.change(search, { target: { value: "photo" } });
    expect(screen.getByText("Photo log")).toBeInTheDocument();
    expect(screen.queryByText("Water reservoir")).not.toBeInTheDocument();
    expect(screen.queryByText("Prune lower fans")).not.toBeInTheDocument();
  });

  it("renders virtualization for large day item counts without crashing", () => {
    const tasks = Array.from({ length: 60 }, (_, i) => mkTask(`t${i}`, `Task ${i}`));
    useStore.setState({ tasks });
    renderWithProviders(<DashboardPage />);

    fireEvent.click(screen.getByLabelText(new RegExp(`Open ${format(today(), "MMM d")} agenda`, "i")));
    // The "All" tab label includes the total count from itemsByDay
    const allTab = screen.getByRole("tab", { name: /^all \(60\)/i });
    expect(allTab).toBeInTheDocument();
  });
});