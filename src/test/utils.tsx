import { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";

/** Reset Zustand store to a known-empty baseline between tests. */
export function resetStore() {
  useStore.setState({
    growCycles: [], stageHistory: [], environments: [], feedSchedules: [],
    nutrients: [], tasks: [], events: [], parameterLogs: [], alertRules: [],
    feedLogs: [], strains: [], growStrains: [], plants: [], environmentTimeline: [],
    parameters: [],
  });
}

export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      {children}
      <Sonner />
    </MemoryRouter>
  );
  return render(ui, { wrapper });
}