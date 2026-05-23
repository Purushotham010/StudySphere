import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#03030b] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 w-12 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Step 1: If user is not fully onboarded, restrict their access to onboarding and settings
  if (profile && !profile.onboarded) {
    if (location.pathname !== "/onboarding" && location.pathname !== "/settings") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Prevent fully onboarded users from going to onboarding page
  if (profile && profile.onboarded && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
