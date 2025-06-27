
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HRHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const HRHeader = ({ isMobileOpen, setIsMobileOpen }: HRHeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="border-b bg-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">Welcome to HR Portal</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">{user?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default HRHeader;
