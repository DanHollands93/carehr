
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "./notificationService";

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
    const { data, error } = await supabase
      .from('holiday_requests')
      .select(`
        id,
        employee_id,
        employee_name,
        start_date,
        end_date,
        reason,
        status,
        submitted_at,
        approved_by,
        approval_date,
        comments,
        hours_requested
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching holiday requests:', error);
      throw error;
    }

    return (data || []).map(req => ({
      id: req.id,
      employeeId: req.employee_id,
      employeeName: req.employee_name || 'Unknown Employee',
      startDate: req.start_date,
      endDate: req.end_date,
      reason: req.reason || '',
      status: req.status as 'pending' | 'approved' | 'rejected',
      submittedAt: req.submitted_at || new Date().toISOString(),
      approvedBy: req.approved_by || undefined,
      approvedAt: req.approval_date || undefined,
      comments: req.comments || undefined
    }));
  },

  async submitHolidayRequest(request: Omit<HolidayRequest, 'id' | 'status' | 'submittedAt'>): Promise<void> {
    // First, get the employee record for the current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.employee_id) {
      throw new Error('No employee record found for current user');
    }

    // Calculate hours requested (assuming 8 hours per day)
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const hoursRequested = daysDifference * 8;

    const { error } = await supabase
      .from('holiday_requests')
      .insert({
        employee_id: profile.employee_id,
        employee_name: request.employeeName,
        start_date: request.startDate,
        end_date: request.endDate,
        reason: request.reason,
        hours_requested: hoursRequested,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error submitting holiday request:', error);
      throw error;
    }
  },

  async processApproval(approval: ApprovalAction): Promise<void> {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the holiday request details first
    const { data: holidayRequest, error: fetchError } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('id', approval.requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching holiday request:', fetchError);
      throw fetchError;
    }

    // Update the holiday request status
    const { error } = await supabase
      .from('holiday_requests')
      .update({
        status: approval.action === 'approve' ? 'approved' : 'rejected',
        approved_by: user.id,
        approval_date: new Date().toISOString(),
        comments: approval.comments
      })
      .eq('id', approval.requestId);

    if (error) {
      console.error('Error processing approval:', error);
      throw error;
    }

    // Get the user ID for the employee who made the request
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', holidayRequest.employee_id)
      .single();

    if (profile) {
      // Create notification for the employee
      const templateData = {
        start_date: holidayRequest.start_date,
        end_date: holidayRequest.end_date,
        approver_name: user.email || 'HR Team',
        rejection_reason: approval.comments || 'No reason provided'
      };

      const triggerEvent = approval.action === 'approve' ? 'holiday_approved' : 'holiday_rejected';
      
      try {
        await notificationService.createFromTemplate(
          profile.id,
          triggerEvent,
          templateData
        );
        console.log(`Notification created for ${approval.action} holiday request`);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't throw here as the approval was successful
      }
    }
  },

  async getMyRequests(employeeId: string): Promise<HolidayRequest[]> {
    // Get current user's employee record
    const { data: profile } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.employee_id) {
      return [];
    }

    const { data, error } = await supabase
      .from('holiday_requests')
      .select(`
        id,
        employee_id,
        employee_name,
        start_date,
        end_date,
        reason,
        status,
        submitted_at,
        approved_by,
        approval_date,
        comments
      `)
      .eq('employee_id', profile.employee_id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching my requests:', error);
      throw error;
    }

    return (data || []).map(req => ({
      id: req.id,
      employeeId: req.employee_id,
      employeeName: req.employee_name || 'Unknown Employee',
      startDate: req.start_date,
      endDate: req.end_date,
      reason: req.reason || '',
      status: req.status as 'pending' | 'approved' | 'rejected',
      submittedAt: req.submitted_at || new Date().toISOString(),
      approvedBy: req.approved_by || undefined,
      approvedAt: req.approval_date || undefined,
      comments: req.comments || undefined
    }));
  }
};
