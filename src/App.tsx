import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import GrowCyclesPage from "@/pages/GrowCyclesPage";
import GrowCycleDetailPage from "@/pages/GrowCycleDetailPage";
import FeedSchedulesPage from "@/pages/FeedSchedulesPage";
import EnvironmentsPage from "@/pages/EnvironmentsPage";
import TasksEventsPage from "@/pages/TasksEventsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/feeds" element={<FeedSchedulesPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/grows" element={<GrowCyclesPage />} />
            <Route path="/grows/:id" element={<GrowCycleDetailPage />} />
            <Route path="/tasks" element={<TasksEventsPage />} />
            <Route path="/nutrients" element={<Navigate to="/feeds" replace />} />
            <Route path="/parameters" element={<Navigate to="/environments" replace />} />
            <Route path="/strains" element={<Navigate to="/grows" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
