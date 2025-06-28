
interface MenuItem {
  title: string;
  path: string;
  icon: string;
  requiredPermission?: string;
  location?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const unifiedMenuConfig: MenuGroup[] = [
  {
    label: "Personal",
    items: [
      {
        title: "Personal Details",
        path: "/hr/profile",
        icon: "User",
        requiredPermission: "view_personal"
      }
    ]
  },
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: "Home"
      }
    ]
  },
  {
    label: "Employee Services",
    items: [
      {
        title: "Holiday Requests",
        path: "/hr/holidays",
        icon: "Calendar",
        requiredPermission: "manage_holidays"
      },
      {
        title: "Documents",
        path: "/hr/documents",
        icon: "FileText",
        requiredPermission: "view_documents"
      },
      {
        title: "Notifications",
        path: "/hr/notifications",
        icon: "Bell",
        requiredPermission: "view_notifications"
      }
    ]
  },
  {
    label: "Management",
    items: [
      {
        title: "Menu Sets",
        path: "/menu-sets",
        icon: "Menu",
        requiredPermission: "manage_menu_sets"
      },
      {
        title: "Processes",
        path: "/processes",
        icon: "FileText",
        requiredPermission: "manage_processes"
      },
      {
        title: "User Management",
        path: "/admin/users",
        icon: "Users",
        requiredPermission: "manage_users"
      }
    ]
  },
  {
    label: "Rostering",
    items: [
      {
        title: "Weekly Roster",
        path: "/roster",
        icon: "Calendar",
        requiredPermission: "manage_roster"
      },
      {
        title: "Roster Templates",
        path: "/roster-templates",
        icon: "CalendarDays",
        requiredPermission: "manage_roster_templates"
      },
      {
        title: "Shift Templates",
        path: "/shift-templates",
        icon: "Clock",
        requiredPermission: "manage_shifts"
      }
    ]
  },
  {
    label: "Reports",
    items: [
      {
        title: "Analytics",
        path: "/reports",
        icon: "BarChart3",
        requiredPermission: "view_reports"
      }
    ]
  },
  {
    label: "Administration",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: "Settings",
        requiredPermission: "manage_settings"
      }
    ]
  }
];
