import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";

// Lazy-load secondary routes — only the dashboard ships in the initial bundle.
const GrowCyclesPage = lazy(() => import("@/pages/GrowCyclesPage"));
const GrowCycleDetailPage = lazy(() => import("@/pages/GrowCycleDetailPage"));
const FeedSchedulesPage = lazy(() => import("@/pages/FeedSchedulesPage"));
const EnvironmentsPage = lazy(() => import("@/pages/EnvironmentsPage"));
const TasksEventsPage = lazy(() => import("@/pages/TasksEventsPage"));
const LogsPage = lazy(() => import("@/pages/LogsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const RouteFallback = () => (
  <div className="p-6 text-muted-foreground text-sm">Loading…</div>
);

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/feeds" element={<FeedSchedulesPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/grows" element={<GrowCyclesPage />} />
            <Route path="/grows/:id" element={<GrowCycleDetailPage />} />
            <Route path="/tasks" element={<TasksEventsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/nutrients" element={<Navigate to="/feeds" replace />} />
            <Route path="/parameters" element={<Navigate to="/environments" replace />} />
            <Route path="/strains" element={<Navigate to="/grows" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
