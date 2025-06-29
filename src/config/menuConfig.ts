import { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Home,
  Menu,
  Settings,
  Shield,
  UserCheck,
  Users,
  Workflow,
  Clock,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  permissions: string[];
  children?: {
    [key: string]: Omit<MenuItem, "icon" | "children">;
  };
}

interface MenuConfig {
  [key: string]: MenuItem;
}

export const menuConfig: MenuConfig = {
  dashboard: {
    label: "Dashboard",
    icon: Home,
    href: "/",
    permissions: ["view_dashboard"]
  },
  employees: {
    label: "Employees", 
    icon: Users,
    href: "/employees",
    permissions: ["view_employees"],
    children: {
      all_employees: {
        label: "All Employees",
        href: "/employees",
        permissions: ["view_employees"]
      },
      add_employee: {
        label: "Add Employee", 
        href: "/employees/new",
        permissions: ["create_employees"]
      }
    }
  },
  roster: {
    label: "Roster Management",
    icon: Calendar,
    href: "/roster",
    permissions: ["view_roster"],
    children: {
      roster: {
        label: "Weekly Roster",
        href: "/roster", 
        permissions: ["view_roster"]
      },
      staff_shifts: {
        label: "My Shifts",
        href: "/staff/shifts",
        permissions: ["view_staff_shifts"]
      },
      shift_templates: {
        label: "Shift Templates",
        href: "/shift-templates",
        permissions: ["edit_roster"]
      },
      roster_templates: {
        label: "Roster Templates", 
        href: "/roster-templates",
        permissions: ["edit_roster"]
      },
      time_discrepancies: {
        label: "Time Discrepancies",
        href: "/time/discrepancies",
        permissions: ["manage_time_records"]
      }
    }
  },
  hr: {
    label: "HR",
    icon: UserCheck, 
    href: "/hr/holidays",
    permissions: ["submit_holidays"],
    children: {
      holidays: {
        label: "My Holidays",
        href: "/hr/holidays",
        permissions: ["submit_holidays"]
      },
      holiday_approvals: {
        label: "Holiday Approvals",
        href: "/holidays/approvals", 
        permissions: ["approve_holidays"]
      },
      profile: {
        label: "My Profile",
        href: "/hr/profile",
        permissions: []
      },
      documents: {
        label: "Documents",
        href: "/hr/documents", 
        permissions: []
      },
      notifications: {
        label: "Notifications",
        href: "/hr/notifications",
        permissions: []
      }
    }
  },
  processes: {
    label: "Processes",
    icon: Workflow,
    href: "/processes", 
    permissions: []
  },
  menu_sets: {
    label: "Menu Sets",
    icon: Menu,
    href: "/menu-sets",
    permissions: []
  },
  settings: {
    label: "Settings", 
    icon: Settings,
    href: "/settings",
    permissions: []
  },
  reports: {
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
    permissions: ["view_reports"]
  },
  admin: {
    label: "Admin",
    icon: Shield,
    href: "/admin/users",
    permissions: ["manage_users"],
    children: {
      users: {
        label: "User Management",
        href: "/admin/users",
        permissions: ["manage_users"]
      },
      email_logs: {
        label: "Email Logs", 
        href: "/admin/email-logs",
        permissions: ["view_email_logs"]
      }
    }
  }
};

// Unified menu structure for the sidebar
interface UnifiedMenuItem {
  title: string;
  path: string;
  icon: string;
  requiredPermission?: string;
  location?: string;
}

interface UnifiedMenuGroup {
  label: string;
  items: UnifiedMenuItem[];
}

export const unifiedMenuConfig: UnifiedMenuGroup[] = [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: "Home",
        requiredPermission: "view_dashboard"
      }
    ]
  },
  {
    label: "Staff Management",
    items: [
      {
        title: "Employees",
        path: "/employees",
        icon: "Users",
        requiredPermission: "view_employees"
      }
    ]
  },
  {
    label: "Roster & Time",
    items: [
      {
        title: "Weekly Roster",
        path: "/roster",
        icon: "Calendar",
        requiredPermission: "view_roster"
      },
      {
        title: "My Shifts",
        path: "/staff/shifts",
        icon: "Clock",
        requiredPermission: "view_staff_shifts"
      },
      {
        title: "Shift Templates",
        path: "/shift-templates",
        icon: "Calendar",
        requiredPermission: "edit_roster"
      },
      {
        title: "Roster Templates",
        path: "/roster-templates",
        icon: "Calendar",
        requiredPermission: "edit_roster"
      },
      {
        title: "Time Discrepancies",
        path: "/time/discrepancies",
        icon: "CheckCircle",
        requiredPermission: "manage_time_records"
      }
    ]
  },
  {
    label: "HR & Personal",
    items: [
      {
        title: "My Holidays",
        path: "/hr/holidays",
        icon: "Calendar",
        requiredPermission: "submit_holidays"
      },
      {
        title: "Holiday Approvals",
        path: "/holidays/approvals",
        icon: "CheckCircle",
        requiredPermission: "approve_holidays"
      },
      {
        title: "My Profile",
        path: "/hr/profile",
        icon: "User"
      },
      {
        title: "Documents",
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
    label: "System",
    items: [
      {
        title: "Processes",
        path: "/processes",
        icon: "Settings"
      },
      {
        title: "Menu Sets",
        path: "/menu-sets",
        icon: "Menu"
      },
      {
        title: "Settings",
        path: "/settings",
        icon: "Settings"
      },
      {
        title: "Reports",
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
        title: "Email Logs",
        path: "/admin/email-logs",
        icon: "Mail",
        requiredPermission: "view_email_logs"
      }
    ]
  }
];
