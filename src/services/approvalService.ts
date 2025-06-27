
import { supabase } from "@/integrations/supabase/client";

export interface HolidayRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface ApprovalAction {
  requestId: string;
  action: 'approve' | 'reject';
  comments?: string;
}

export const approvalService = {
  async getHolidayRequests(): Promise<HolidayRequest[]> {
    // Mock data - in production this would be a real Supabase query
    return [
      {
        id: "req-1",
        employeeId: "emp-1",
        employeeName: "John Doe",
        startDate: "2025-07-15",
        endDate: "2025-07-22",
        reason: "Summer vacation",
        status: "pending",
        submittedAt: "2025-06-20T10:00:00Z"
      },
      {
        id: "req-2",
        employeeId: "emp-2",
        employeeName: "Jane Smith",
        startDate: "2025-08-01",
        endDate: "2025-08-05",
        reason: "Family event",
        status: "approved",
        submittedAt: "2025-06-18T14:30:00Z",
        approvedBy: "manager-1",
        approvedAt: "2025-06-19T09:15:00Z"
      }
    ];
  },

  async submitHolidayRequest(request: Omit<HolidayRequest, 'id' | 'status' | 'submittedAt'>): Promise<void> {
    // Mock implementation - would create record in Supabase
    console.log('Holiday request submitted:', request);
  },

  async processApproval(approval: ApprovalAction): Promise<void> {
    // Mock implementation - would update record in Supabase
    console.log('Approval processed:', approval);
  },

  async getMyRequests(employeeId: string): Promise<HolidayRequest[]> {
    const allRequests = await this.getHolidayRequests();
    return allRequests.filter(req => req.employeeId === employeeId);
  }
};
