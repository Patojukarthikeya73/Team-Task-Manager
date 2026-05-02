import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
