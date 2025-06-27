
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import HRSidebar from "./HRSidebar";
import HRHeader from "./HRHeader";

const HRLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HRSidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
        <SidebarInset>
          <HRHeader onToggleSidebar={toggleMobileSidebar} />
          <main className="flex-1 p-6 bg-gray-50">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default HRLayout;
