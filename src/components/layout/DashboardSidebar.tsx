
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FileText, List, Settings } from "lucide-react";

interface DashboardSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const DashboardSidebar = ({ isMobileOpen, setIsMobileOpen }: DashboardSidebarProps) => {
  const navItems = [
    {
      label: "Builder",
      items: [
        {
          title: "Dashboard",
          path: "/",
          icon: List,
        },
        {
          title: "Menu Sets",
          path: "/menu-sets",
          icon: List,
        },
        {
          title: "Processes",
          path: "/processes",
          icon: FileText,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-sidebar-foreground">HR System</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navItems.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
