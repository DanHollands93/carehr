
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home, Calendar, User, FileText, Bell, LogOut, FormInput, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuSets } from "@/hooks/useMenuSets";
import { Button } from "@/components/ui/button";

interface HRSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const HRSidebar = ({
  isMobileOpen,
  setIsMobileOpen
}: HRSidebarProps) => {
  const { signOut } = useAuth();
  const { menuSets, loading } = useMenuSets();

  const staticNavItems = [{
    label: "Overview",
    items: [{
      title: "Dashboard",
      path: "/hr",
      icon: Home
    }]
  }];

  // Convert menu sets to navigation items
  const dynamicNavItems = menuSets.map(menuSet => ({
    label: menuSet.name,
    items: menuSet.items.map(item => ({
      title: item.label,
      path: item.processId ? `/hr/process/${item.processId}` : `/hr/${item.id}`,
      icon: item.processId ? (item.processId.startsWith('form') ? FormInput : List) : FileText
    }))
  }));

  const staticHRItems = [{
    label: "My HR",
    items: [{
      title: "Holiday Requests",
      path: "/hr/holidays",
      icon: Calendar
    }, {
      title: "Personal Details",
      path: "/hr/profile",
      icon: User
    }, {
      title: "Documents",
      path: "/hr/documents",
      icon: FileText
    }, {
      title: "Notifications",
      path: "/hr/notifications",
      icon: Bell
    }]
  }];

  const allNavItems = [...staticNavItems, ...dynamicNavItems, ...staticHRItems];

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 border-b bg-blue-50">
          <h2 className="text-xl font-bold text-blue-900">HR Portal</h2>
          <p className="text-sm text-blue-700">Employee Self-Service</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading menu...
            </div>
          ) : (
            allNavItems.map(group => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.path} 
                            onClick={closeMobileSidebar} 
                            className={({ isActive }) => 
                              cn("flex items-center gap-3 w-full", isActive && "font-semibold text-sidebar-primary")
                            }
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
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
      </SidebarContent>
    </Sidebar>
  );
};

export default HRSidebar;
