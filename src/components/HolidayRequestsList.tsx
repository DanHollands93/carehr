
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HolidayRequest, ApprovalAction } from "@/services/approvalService";
import { useAuth } from "@/contexts/AuthContext";
import { approvalService } from "@/services/approvalService";
import { useToast } from "@/hooks/use-toast";

interface HolidayRequestsListProps {
  requests: HolidayRequest[];
  onUpdate: () => void;
}

const HolidayRequestsList = ({ requests, onUpdate }: HolidayRequestsListProps) => {
  const { userRole } = useAuth();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await approvalService.processApproval({ requestId, action });
      toast({
        title: `Request ${action}d`,
        description: `Holiday request has been ${action}d successfully.`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No holiday requests found.</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {userRole === 'admin' ? request.employeeName : 'Your Request'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {request.startDate} to {request.endDate}
                  </p>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Reason:</strong> {request.reason}</p>
                <p><strong>Submitted:</strong> {new Date(request.submittedAt).toLocaleDateString()}</p>
                {request.approvedAt && (
                  <p><strong>Approved:</strong> {new Date(request.approvedAt).toLocaleDateString()}</p>
                )}
                {request.comments && (
                  <p><strong>Comments:</strong> {request.comments}</p>
                )}
              </div>
              
              {userRole === 'admin' && request.status === 'pending' && (
                <div className="flex gap-2 mt-4">
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
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default HolidayRequestsList;
