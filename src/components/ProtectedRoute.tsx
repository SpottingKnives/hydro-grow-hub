import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}