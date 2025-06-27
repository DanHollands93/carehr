
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FileText, List, Settings, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const DashboardSidebar = ({
  isMobileOpen,
  setIsMobileOpen
}: DashboardSidebarProps) => {
  const { userRole, signOut } = useAuth();

  const navItems = [{
    label: "Builder",
    items: [{
      title: "Dashboard",
      path: "/",
      icon: List
    }, {
      title: "Menu Sets",
      path: "/menu-sets",
      icon: List
    }, {
      title: "Processes",
      path: "/processes",
      icon: FileText
    }]
  }];

  // Add admin-only items
  if (userRole === 'admin') {
    navItems.push({
      label: "Administration",
      items: [{
        title: "User Management",
        path: "/admin/users",
        icon: Users
      }]
    });
  }

  navItems.push({
    label: "System",
    items: [{
      title: "Settings",
      path: "/settings",
      icon: Settings
    }]
  });

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
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-sidebar-foreground">CareHR</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navItems.map(group => (
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
          ))}
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

export default DashboardSidebar;
