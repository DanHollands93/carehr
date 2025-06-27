
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const DashboardHeader = ({ isMobileOpen, setIsMobileOpen }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">HR Flow Builder</h1>
      </div>
      <div className="flex items-center space-x-2">
        {/* We could add user profile, notifications, etc. here */}
        <Button variant="outline" size="sm">Help</Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
