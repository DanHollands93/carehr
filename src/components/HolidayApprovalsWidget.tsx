
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { approvalService, HolidayRequest } from "@/services/approvalService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HolidayApprovalsWidget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['holiday-approvals-widget'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      return requests.filter(req => req.status === 'pending').slice(0, 3); // Show only first 3
    }
  });

  const { data: todayOffCount = 0 } = useQuery({
    queryKey: ['today-off-count'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      const today = new Date().toISOString().split('T')[0];
      
      return requests.filter(req => {
        if (req.status !== 'approved') return false;
        const startDate = req.startDate;
        const endDate = req.endDate;
        return today >= startDate && today <= endDate;
      }).length;
    }
  });

  const handleQuickApprove = async (requestId: string) => {
    try {
      await approvalService.processApproval({ requestId, action: 'approve' });
      toast({
        title: "Request approved",
        description: "Holiday request has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['holiday-approvals-widget'] });
      queryClient.invalidateQueries({ queryKey: ['today-off-count'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holiday Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holiday Approvals
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link to="/holidays/approvals">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-lg font-bold">{pendingRequests.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-lg font-bold">{todayOffCount}</p>
              <p className="text-xs text-muted-foreground">Off Today</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Requests</h4>
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{request.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.startDate} to {request.endDate}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickApprove(request.id)}
                    className="bg-green-600 hover:bg-green-700 text-xs h-7"
                  >
                    Quick Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                    <Link to="/holidays/approvals">
                      Review
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No pending requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidayApprovalsWidget;
