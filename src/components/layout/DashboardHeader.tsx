
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, Bell, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const DashboardHeader = ({ isMobileOpen, setIsMobileOpen }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const { unseenCount } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate('/hr/notifications');
  };

  const handleProfileClick = () => {
    navigate('/hr/profile');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="border-b bg-card py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">HR Flow Builder</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationClick}
            className="hover:bg-gray-100"
          >
            <Bell className={`h-5 w-5 ${unseenCount > 0 ? 'text-red-600' : 'text-black'}`} />
          </Button>
          {unseenCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-600"
            >
              {unseenCount > 9 ? '9+' : unseenCount}
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <UserCircle className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
