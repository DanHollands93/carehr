
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
        // No permission required - everyone can see dashboard
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
        requiredPermission: "submit_holidays"
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
        icon: "Menu"
        // Remove permission requirement temporarily to see if this shows up
      },
      {
        title: "Processes",
        path: "/processes",
        icon: "FileText"
        // Remove permission requirement temporarily to see if this shows up
      },
      {
        title: "User Management",
        path: "/admin/users",
        icon: "Users",
        requiredPermission: "manage_users"
      },
      {
        title: "Employees",
        path: "/employees",
        icon: "UserPlus",
        requiredPermission: "view_employees"
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
        requiredPermission: "view_roster"
      },
      {
        title: "Roster Templates",
        path: "/roster-templates",
        icon: "CalendarDays",
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
        title: "Holiday Approvals",
        path: "/holidays/approvals",
        icon: "CheckCircle",
        requiredPermission: "approve_holidays"
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
        icon: "Settings"
        // Remove permission requirement temporarily to see if this shows up
      },
      {
        title: "Email Logs",
        path: "/admin/email-logs",
        icon: "Mail",
        requiredPermission: "view_email_logs"
      }
    ]
  }
];
