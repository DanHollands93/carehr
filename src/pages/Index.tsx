
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // If not authenticated, go to login
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // If authenticated and permissions are loaded, redirect based on permissions
    if (user && !authLoading && !permissionsLoading) {
      if (hasPermission('view_dashboard')) {
        // User has dashboard access, stay on root
        navigate("/");
      } else if (hasPermission('view_staff_shifts')) {
        // Redirect to My Shifts if no dashboard access
        navigate("/staff/shifts");
      } else {
        // Fallback to profile
        navigate("/hr/profile");
      }
    }
  }, [navigate, user, authLoading, permissionsLoading, hasPermission]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
