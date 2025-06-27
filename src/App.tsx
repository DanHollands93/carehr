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
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import HRDashboard from "./pages/hr/HRDashboard";
import HRHolidays from "./pages/hr/HRHolidays";
import HRProfile from "./pages/hr/HRProfile";
import HRDocuments from "./pages/hr/HRDocuments";
import HRNotifications from "./pages/hr/HRNotifications";

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
            
            {/* Admin Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="menu-sets" element={<MenuSets />} />
              <Route path="processes" element={<Processes />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
            </Route>

            {/* HR User Routes */}
            <Route path="/hr" element={
              <ProtectedRoute requiredRole="hr_user">
                <HRLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HRDashboard />} />
              <Route path="holidays" element={<HRHolidays />} />
              <Route path="profile" element={<HRProfile />} />
              <Route path="documents" element={<HRDocuments />} />
              <Route path="notifications" element={<HRNotifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
