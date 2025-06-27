
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HolidayRequestsList from "@/components/HolidayRequestsList";
import { useHolidayRequests } from "@/hooks/useHolidayRequests";

const AdminUsers = () => {
  const { requests, loading, error, refreshRequests } = useHolidayRequests();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage users and approve requests</p>
      </div>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="users">User Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          {loading ? (
            <div>Loading requests...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <HolidayRequestsList 
              requests={requests.filter(req => req.status === 'pending')}
              onUpdate={refreshRequests}
            />
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">User account management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
