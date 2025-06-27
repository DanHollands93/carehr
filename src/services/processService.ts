
import { supabase } from "@/integrations/supabase/client";

export interface Process {
  id: string;
  name: string;
  description: string;
  type: "form" | "list" | "dashboard";
  createdAt: string;
  menuSetId?: string;
}

export interface MenuSet {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  processId?: string;
  children?: MenuItem[];
}

// Mock data service - in a real app, this would connect to Supabase
export const processService = {
  async getProcesses(): Promise<Process[]> {
    // This would be a real Supabase query in production
    return [
      {
        id: "form-1",
        name: "Employee Information Form",
        description: "Collect and update employee personal details",
        type: "form",
        createdAt: "2025-05-01",
        menuSetId: "1"
      },
      {
        id: "list-1",
        name: "Leave Requests List",
        description: "Display and manage employee leave requests",
        type: "list",
        createdAt: "2025-05-01",
        menuSetId: "1"
      },
      {
        id: "dashboard-1",
        name: "HR Analytics Dashboard",
        description: "Key HR metrics and insights",
        type: "dashboard",
        createdAt: "2025-05-03",
        menuSetId: "2"
      }
    ];
  },

  async getMenuSets(): Promise<MenuSet[]> {
    return [
      {
        id: "1",
        name: "Employee Self Service",
        description: "Menu for employee self-service portal",
        items: [
          { id: "1-1", label: "Personal Info", processId: "form-1" },
          { id: "1-2", label: "Leave Requests", processId: "list-1" },
          { id: "1-3", label: "Holiday Balance", processId: "dashboard-1" }
        ]
      }
    ];
  },

  async getProcessById(id: string): Promise<Process | null> {
    const processes = await this.getProcesses();
    return processes.find(p => p.id === id) || null;
  }
};
