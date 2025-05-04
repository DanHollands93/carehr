
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
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeMobileSidebar}
        />
      )}
      
      <Sidebar className={cn(
        "fixed top-0 left-0 z-50 md:relative md:z-0 h-full transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <SidebarContent>
          <div className="p-6">
            <h2 className="text-xl font-bold text-sidebar-foreground">HR System</h2>
          </div>

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
                            cn("flex items-center gap-3", isActive && "font-semibold text-sidebar-primary")
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
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default DashboardSidebar;
