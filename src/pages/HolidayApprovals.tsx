
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { approvalService, HolidayRequest } from "@/services/approvalService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Users, Clock } from "lucide-react";
import HolidayCalendarView from "@/components/HolidayCalendarView";

const HolidayApprovals = () => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['holiday-approvals'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      return requests.filter(req => req.status === 'pending');
    }
  });

  const { data: approvedRequests = [] } = useQuery({
    queryKey: ['approved-holidays'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      return requests.filter(req => req.status === 'approved');
    }
  });

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const comments = action === 'reject' ? rejectionNotes : undefined;
      await approvalService.processApproval({ requestId, action, comments });
      
      toast({
        title: `Request ${action}d`,
        description: `Holiday request has been ${action}d successfully.`,
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['holiday-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approved-holidays'] });
      
      // Reset state
      setSelectedRequest(null);
      setRejectionNotes("");
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request.`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading holiday requests...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Holiday Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve employee holiday requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Currently Off</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Current Holiday Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <HolidayCalendarView holidays={approvedRequests} />
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending holiday requests
              </p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{request.employeeName}</h3>
                      <p className="text-sm text-gray-600">
                        {request.startDate} to {request.endDate}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  {selectedRequest === request.id ? (
                    <div className="space-y-3 pt-3 border-t">
                      <Textarea
                        placeholder="Add notes (optional for approval, required for rejection)..."
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(request.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(request.id, 'reject')}
                          disabled={!rejectionNotes.trim()}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(null);
                            setRejectionNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request.id)}
                        variant="outline"
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(request.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Quick Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HolidayApprovals;
