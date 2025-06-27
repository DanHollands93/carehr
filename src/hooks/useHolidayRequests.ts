
import { useState, useEffect } from "react";
import { approvalService, HolidayRequest } from "@/services/approvalService";
import { useAuth } from "@/contexts/AuthContext";

export const useHolidayRequests = () => {
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole } = useAuth();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        let holidayRequests: HolidayRequest[];
        
        if (userRole === 'admin') {
          // Admins see all requests
          holidayRequests = await approvalService.getHolidayRequests();
        } else {
          // HR users see only their own requests
          holidayRequests = await approvalService.getMyRequests(user?.id || '');
        }
        
        setRequests(holidayRequests);
      } catch (err) {
        setError('Failed to load holiday requests');
        console.error('Error loading holiday requests:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadRequests();
    }
  }, [user, userRole]);

  const submitRequest = async (request: Omit<HolidayRequest, 'id' | 'status' | 'submittedAt' | 'employeeId' | 'employeeName'>) => {
    try {
      await approvalService.submitHolidayRequest({
        ...request,
        employeeId: user?.id || '',
        employeeName: user?.email || ''
      });
      // Reload requests
      const updatedRequests = userRole === 'admin' 
        ? await approvalService.getHolidayRequests()
        : await approvalService.getMyRequests(user?.id || '');
      setRequests(updatedRequests);
    } catch (err) {
      setError('Failed to submit request');
      throw err;
    }
  };

  return { requests, loading, error, submitRequest };
};
