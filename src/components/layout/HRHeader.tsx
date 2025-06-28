
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, User, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

interface HRHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const HRHeader = ({ isMobileOpen, setIsMobileOpen }: HRHeaderProps) => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    navigate('/hr/notifications');
  };

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
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationClick}
            className="hover:bg-gray-100"
          >
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-red-600' : 'text-black'}`} />
          </Button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-600"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};

export default HRHeader;
