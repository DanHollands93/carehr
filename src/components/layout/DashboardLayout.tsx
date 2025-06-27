
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import UnifiedSidebar from "./UnifiedSidebar";

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <UnifiedSidebar 
          isMobileOpen={isMobileOpen} 
          setIsMobileOpen={setIsMobileOpen} 
        />
        <SidebarInset className="flex-1">
          <DashboardHeader 
            isMobileOpen={isMobileOpen} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
