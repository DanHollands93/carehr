import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home, Calendar, Settings, Users, Menu, FileText, LogOut, Clock, Grid3X3, CalendarDays } from "lucide-react";
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
  const { signOut } = useAuth();

  const navigationItems = [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          path: "/",
          icon: Home
        }
      ]
    },
    {
      label: "Management",
      items: [
        {
          title: "Menu Sets",
          path: "/menu-sets",
          icon: Menu
        },
        {
          title: "Processes",
          path: "/processes",
          icon: FileText
        }
      ]
    },
    {
      label: "Rostering",
      items: [
        {
          title: "Weekly Roster",
          path: "/roster",
          icon: Calendar
        },
        {
          title: "Roster Templates",
          path: "/roster-templates",
          icon: CalendarDays
        },
        {
          title: "Shift Templates",
          path: "/shift-templates",
          icon: Clock
        }
      ]
    },
    {
      label: "Administration",
      items: [
        {
          title: "User Management",
          path: "/admin/users",
          icon: Users
        },
        {
          title: "Settings",
          path: "/settings",
          icon: Settings
        }
      ]
    }
  ];

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
          <h2 className="text-xl font-bold text-blue-900">Admin Portal</h2>
          <p className="text-sm text-blue-700">Management Dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navigationItems.map(group => (
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
