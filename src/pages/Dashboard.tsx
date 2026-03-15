
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import MobileDefaultRedirect from "@/components/MobileDefaultRedirect";
import AbsenceApprovalsWidget from "@/components/AbsenceApprovalsWidget";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasPermission, loading } = usePermissions();

  useEffect(() => {
    // If permissions are loaded and user doesn't have dashboard permission, redirect to My Shifts
    if (!loading && !hasPermission('view_dashboard')) {
      if (hasPermission('view_staff_shifts')) {
        navigate('/staff/shifts', { replace: true });
      } else {
        // Fallback to profile if no shifts permission either
        navigate('/hr/profile', { replace: true });
      }
    }
  }, [loading, hasPermission, navigate]);

  // Show loading while permissions are being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard if user has permission (this check is redundant due to useEffect redirect, but kept for safety)
  if (!hasPermission('view_dashboard')) {
    return null;
  }

  return (
    <MobileDefaultRedirect>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and user management</p>
        </div>

        <AnalyticsDashboard />
      </div>
    </MobileDefaultRedirect>
  );
};

export default Dashboard;
