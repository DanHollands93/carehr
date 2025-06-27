import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  recentActivity: ActivityItem[];
  monthlyRequests: ChartData[];
  requestsByStatus: ChartData[];
}

export interface PersonalAnalyticsData {
  holidaysUsed: number;
  holidaysRemaining: number;
  pendingRequests: number;
  documentsAccessed: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'request_submitted' | 'request_approved' | 'request_rejected' | 'user_registered';
  message?: string;
  description?: string;
  user?: string;
  timestamp: string;
}

export interface ChartData {
  name: string;
  value: number;
}

const getAdminAnalytics = async (): Promise<AnalyticsData> => {
  try {
    // Get user counts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, active, created_at');

    if (profilesError) throw profilesError;

    const totalUsers = profiles?.length || 0;
    const activeUsers = profiles?.filter(p => p.active)?.length || 0;

    // Get holiday request statistics
    const { data: requests, error: requestsError } = await supabase
      .from('holiday_requests')
      .select('id, status, submitted_at, employee_name, reason');

    if (requestsError) throw requestsError;

    const totalRequests = requests?.length || 0;
    const pendingRequests = requests?.filter(r => r.status === 'pending')?.length || 0;
    const approvedRequests = requests?.filter(r => r.status === 'approved')?.length || 0;
    const rejectedRequests = requests?.filter(r => r.status === 'rejected')?.length || 0;

    // Generate recent activity
    const recentActivity: ActivityItem[] = [];
    
    // Add recent holiday requests
    requests?.slice(0, 5).forEach(req => {
      recentActivity.push({
        id: req.id,
        type: req.status === 'pending' ? 'request_submitted' : 
              req.status === 'approved' ? 'request_approved' : 'request_rejected',
        description: `${req.employee_name || 'Employee'} ${
          req.status === 'pending' ? 'submitted' : req.status
        } holiday request: ${req.reason || 'Holiday'}`,
        timestamp: req.submitted_at || new Date().toISOString(),
        user: req.employee_name || 'Unknown'
      });
    });

    // Add recent user registrations
    profiles?.slice(-3).forEach(profile => {
      recentActivity.push({
        id: profile.id,
        type: 'user_registered',
        description: `New user registered`,
        timestamp: profile.created_at || new Date().toISOString()
      });
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Generate monthly requests data (last 6 months)
    const monthlyRequests: ChartData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthlyCount = requests?.filter(r => {
        const requestDate = new Date(r.submitted_at || '');
        return requestDate >= monthStart && requestDate <= monthEnd;
      })?.length || 0;

      monthlyRequests.push({
        name: monthName,
        value: monthlyCount
      });
    }

    // Requests by status
    const requestsByStatus: ChartData[] = [
      { name: 'Pending', value: pendingRequests },
      { name: 'Approved', value: approvedRequests },
      { name: 'Rejected', value: rejectedRequests }
    ];

    return {
      totalUsers,
      activeUsers,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      recentActivity: recentActivity.slice(0, 10),
      monthlyRequests,
      requestsByStatus
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    // Return fallback data
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      recentActivity: [],
      monthlyRequests: [],
      requestsByStatus: []
    };
  }
};

const getPersonalAnalytics = async (userId: string): Promise<PersonalAnalyticsData> => {
  try {
    // Get user's employee record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (!profile?.employee_id) {
      return {
        holidaysUsed: 0,
        holidaysRemaining: 25, // Default holiday allowance
        pendingRequests: 0,
        documentsAccessed: 0,
        recentActivity: []
      };
    }

    // Get user's holiday requests
    const { data: requests, error: requestsError } = await supabase
      .from('holiday_requests')
      .select('id, status, submitted_at, hours_requested, reason')
      .eq('employee_id', profile.employee_id);

    if (requestsError) throw requestsError;

    const approvedRequests = requests?.filter(r => r.status === 'approved') || [];
    const pendingRequests = requests?.filter(r => r.status === 'pending')?.length || 0;
    const holidaysUsed = approvedRequests.reduce((total, req) => total + (Number(req.hours_requested) || 0), 0) / 8; // Convert hours to days
    const holidaysRemaining = Math.max(0, 25 - holidaysUsed); // Assuming 25 days allowance

    // Generate recent activity
    const recentActivity: ActivityItem[] = [];
    requests?.slice(0, 10).forEach(req => {
      recentActivity.push({
        id: req.id,
        type: req.status === 'pending' ? 'request_submitted' : 
              req.status === 'approved' ? 'request_approved' : 'request_rejected',
        description: `Holiday request ${req.status}: ${req.reason || 'Holiday'}`,
        timestamp: req.submitted_at || new Date().toISOString()
      });
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      holidaysUsed: Math.round(holidaysUsed),
      holidaysRemaining: Math.round(holidaysRemaining),
      pendingRequests,
      documentsAccessed: Math.floor(Math.random() * 20) + 5, // Mock for now
      recentActivity: recentActivity.slice(0, 5)
    };
  } catch (error) {
    console.error('Error fetching personal analytics:', error);
    return {
      holidaysUsed: 0,
      holidaysRemaining: 25,
      pendingRequests: 0,
      documentsAccessed: 0,
      recentActivity: []
    };
  }
};

export const analyticsService = {
  getAdminAnalytics,
  getPersonalAnalytics,
  // Keep the original method for backward compatibility
  getAnalytics: getAdminAnalytics
};
