
interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  approvedRequests: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'holiday_request' | 'profile_update' | 'document_access';
  user: string;
  timestamp: string;
  description: string;
}

interface PersonalAnalytics {
  holidaysUsed: number;
  holidaysRemaining: number;
  pendingRequests: number;
  documentsAccessed: number;
  recentActivity: ActivityItem[];
}

export const analyticsService = {
  async getAdminAnalytics(): Promise<UserAnalytics> {
    // Mock data - in production this would be real Supabase queries
    return {
      totalUsers: 45,
      activeUsers: 38,
      pendingRequests: 7,
      approvedRequests: 23,
      recentActivity: [
        {
          id: "1",
          type: "holiday_request",
          user: "John Doe",
          timestamp: "2025-06-27T10:30:00Z",
          description: "Submitted holiday request for July 15-22"
        },
        {
          id: "2",
          type: "profile_update",
          user: "Jane Smith",
          timestamp: "2025-06-27T09:15:00Z",
          description: "Updated personal details"
        },
        {
          id: "3",
          type: "document_access",
          user: "Mike Johnson",
          timestamp: "2025-06-26T16:45:00Z",
          description: "Accessed employee handbook"
        }
      ]
    };
  },

  async getPersonalAnalytics(userId: string): Promise<PersonalAnalytics> {
    // Mock data - in production this would be real Supabase queries
    return {
      holidaysUsed: 8,
      holidaysRemaining: 17,
      pendingRequests: 1,
      documentsAccessed: 12,
      recentActivity: [
        {
          id: "1",
          type: "holiday_request",
          user: "You",
          timestamp: "2025-06-25T14:20:00Z",
          description: "Submitted holiday request for August 1-5"
        },
        {
          id: "2",
          type: "document_access",
          user: "You",
          timestamp: "2025-06-24T11:30:00Z",
          description: "Downloaded payslip for May 2025"
        }
      ]
    };
  }
};
