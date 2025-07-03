import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import HRLayout from "./components/layout/HRLayout";
import Dashboard from "./pages/Dashboard";
import MenuSets from "./pages/MenuSets";
import Processes from "./pages/Processes";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import Employees from "./pages/Employees";
import HRDashboard from "./pages/hr/HRDashboard";
import HRHolidays from "./pages/hr/HRHolidays";
import HRProfile from "./pages/hr/HRProfile";
import HRDocuments from "./pages/hr/HRDocuments";
import HRNotifications from "./pages/hr/HRNotifications";
import DynamicProcessPage from "./pages/DynamicProcessPage";
import ShiftTemplates from "./pages/ShiftTemplates";
import Roster from "./pages/Roster";
import RosterTemplates from "./pages/RosterTemplates";
import HolidayApprovals from "./pages/HolidayApprovals";
import EmailLogs from "./pages/EmailLogs";
import StaffShifts from "./pages/StaffShifts";
import TimeDiscrepancyManager from "./components/TimeDiscrepancyManager";
import ProcessCustomizer from "./pages/ProcessCustomizer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Unified Routes - All authenticated users use the same layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="menu-sets" element={<MenuSets />} />
              <Route path="processes" element={<Processes />} />
              <Route path="process-customizer" element={
                <ProtectedRoute requiredPermission="manage_processes">
                  <ProcessCustomizer />
                </ProtectedRoute>
              } />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
              <Route path="employees" element={
                <ProtectedRoute requiredPermission="view_employees">
                  <Employees />
                </ProtectedRoute>
              } />
              <Route path="employees/new" element={
                <ProtectedRoute requiredPermission="create_employees">
                  <Employees />
                </ProtectedRoute>
              } />
              <Route path="roster" element={
                <ProtectedRoute requiredPermission="view_roster">
                  <Roster />
                </ProtectedRoute>
              } />
              <Route path="roster-templates" element={
                <ProtectedRoute requiredPermission="edit_roster">
                  <RosterTemplates />
                </ProtectedRoute>
              } />
              <Route path="shift-templates" element={
                <ProtectedRoute requiredPermission="edit_roster">
                  <ShiftTemplates />
                </ProtectedRoute>
              } />
              
              {/* Staff Shifts Route */}
              <Route path="staff/shifts" element={
                <ProtectedRoute requiredPermission="view_staff_shifts">
                  <StaffShifts />
                </ProtectedRoute>
              } />
              
              {/* Time Management Routes */}
              <Route path="time/discrepancies" element={
                <ProtectedRoute requiredPermission="manage_time_records">
                  <TimeDiscrepancyManager />
                </ProtectedRoute>
              } />
              
              {/* HR Routes accessible to all users with permissions */}
              <Route path="hr/holidays" element={
                <ProtectedRoute requiredPermission="submit_holidays">
                  <HRHolidays />
                </ProtectedRoute>
              } />
              <Route path="hr/profile" element={<HRProfile />} />
              <Route path="hr/documents" element={<HRDocuments />} />
              <Route path="hr/notifications" element={<HRNotifications />} />
              <Route path="hr/process/:processId" element={<DynamicProcessPage />} />
              
              {/* Holiday Approvals Route */}
              <Route path="holidays/approvals" element={
                <ProtectedRoute requiredPermission="approve_holidays">
                  <HolidayApprovals />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes - now permission-based instead of role-based */}
              <Route path="admin/users" element={
                <ProtectedRoute requiredPermission="manage_users">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="admin/email-logs" element={
                <ProtectedRoute requiredPermission="view_email_logs">
                  <EmailLogs />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
