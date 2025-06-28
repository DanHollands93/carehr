import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { 
  Home, Calendar, User, FileText, Bell, LogOut, Settings, Users, 
  Clock, CheckCircle, BarChart3, Menu, UserPlus, Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { unifiedMenuConfig } from "@/config/menuConfig";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const iconMap = {
  Home,
  Calendar,
  User,
  FileText,
  Bell,
  Settings,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  Menu,
  UserPlus,
  Mail
};

interface UnifiedSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const UnifiedSidebar = ({
  isMobileOpen,
  setIsMobileOpen
}: UnifiedSidebarProps) => {
  const { signOut, userRole } = useAuth();
  const { hasPermission, loading: permissionsLoading, permissions } = usePermissions();
  const isMobile = useIsMobile();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  const isMenuItemVisible = (item: any) => {
    // Special debugging for My Shifts
    if (item.title === 'My Shifts') {
      console.log('=== MY SHIFTS DEBUG ===');
      console.log('Item:', item);
      console.log('Required permission:', item.requiredPermission);
      console.log('Location:', item.location);
      console.log('Has view_staff_shifts permission?', hasPermission('view_staff_shifts'));
      console.log('Has permission with location?', hasPermission(item.requiredPermission, item.location));
      console.log('All permissions that match view_staff_shifts:', 
        permissions.filter(p => p.permission.name === 'view_staff_shifts')
      );
      console.log('========================');
    }

    // If no permission required, show to everyone
    if (!item.requiredPermission) {
      return true;
    }
    
    // Check if user has the required permission
    const hasRequiredPermission = hasPermission(item.requiredPermission, item.location);
    
    if (item.title === 'My Shifts') {
      console.log('My Shifts final result:', hasRequiredPermission);
    }
    
    return hasRequiredPermission;
  };

  const getVisibleGroups = () => {    
    const visibleGroups = unifiedMenuConfig.map(group => ({
      ...group,
      items: group.items.filter(isMenuItemVisible)
    })).filter(group => group.items.length > 0);

    // Special debug for Roster & Time group
    const rosterGroup = unifiedMenuConfig.find(g => g.label === 'Roster & Time');
    const visibleRosterGroup = visibleGroups.find(g => g.label === 'Roster & Time');
    
    console.log('Original Roster & Time items:', rosterGroup?.items);
    console.log('Visible Roster & Time items:', visibleRosterGroup?.items);
    
    return visibleGroups;
  };

  const visibleGroups = getVisibleGroups();

  const sidebarContent = (
    <>
      <div className="p-6 border-b bg-blue-50">
        <h2 className="text-xl font-bold text-blue-900">
          {userRole === 'admin' ? 'Admin Portal' : 'HR System'}
        </h2>
        <p className="text-sm text-blue-700">
          {userRole === 'admin' ? 'System Administration' : 'Employee Portal'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {permissionsLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading menu...
          </div>
        ) : (
          visibleGroups.map(group => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => {
                    const IconComponent = iconMap[item.icon as keyof typeof iconMap] || FileText;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.path} 
                            onClick={closeMobileSidebar} 
                            className={({ isActive }) => 
                              cn("flex items-center gap-3 w-full", isActive && "font-semibold text-sidebar-primary")
                            }
                          >
                            <IconComponent className="w-5 h-5" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full w-full flex-col">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        {sidebarContent}
      </SidebarContent>
    </Sidebar>
  );
};

export default UnifiedSidebar;
