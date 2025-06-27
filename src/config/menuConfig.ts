
export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  requiredPermission?: string;
  location?: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const unifiedMenuConfig: MenuGroup[] = [
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
    label: "Employee Management",
    items: [
      {
        title: "View Employees",
        path: "/employees",
        icon: "Users",
        requiredPermission: "view_employees"
      },
      {
        title: "Add Employee",
        path: "/employees/new",
        icon: "UserPlus",
        requiredPermission: "create_employees"
      }
    ]
  },
  {
    label: "Roster Management",
    items: [
      {
        title: "View Roster",
        path: "/roster",
        icon: "Calendar",
        requiredPermission: "view_roster"
      },
      {
        title: "Roster Templates",
        path: "/roster-templates",
        icon: "FileText",
        requiredPermission: "edit_roster"
      },
      {
        title: "Shift Templates",
        path: "/shift-templates",
        icon: "Clock",
        requiredPermission: "edit_roster"
      }
    ]
  },
  {
    label: "Holiday Management",
    items: [
      {
        title: "My Holiday Requests",
        path: "/hr/holidays",
        icon: "Calendar",
        requiredPermission: "submit_holidays"
      },
      {
        title: "Holiday Approvals",
        path: "/holidays/approvals",
        icon: "CheckCircle",
        requiredPermission: "approve_holidays"
      }
    ]
  },
  {
    label: "Personal",
    items: [
      {
        title: "My Profile",
        path: "/hr/profile",
        icon: "User"
      },
      {
        title: "My Documents",
        path: "/hr/documents",
        icon: "FileText"
      },
      {
        title: "Notifications",
        path: "/hr/notifications",
        icon: "Bell"
      }
    ]
  },
  {
    label: "Reports & Analytics",
    items: [
      {
        title: "View Reports",
        path: "/reports",
        icon: "BarChart3",
        requiredPermission: "view_reports"
      }
    ]
  },
  {
    label: "System Administration",
    items: [
      {
        title: "Menu Sets",
        path: "/menu-sets",
        icon: "Menu",
        requiredPermission: "edit_settings"
      },
      {
        title: "Processes",
        path: "/processes",
        icon: "Settings",
        requiredPermission: "edit_settings"
      },
      {
        title: "System Settings",
        path: "/settings",
        icon: "Settings",
        requiredPermission: "edit_settings"
      },
      {
        title: "User Management",
        path: "/admin/users",
        icon: "Users",
        requiredPermission: "manage_users"
      }
    ]
  }
];
