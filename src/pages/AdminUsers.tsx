
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HolidayRequestsList from "@/components/HolidayRequestsList";
import { useHolidayRequests } from "@/hooks/useHolidayRequests";
import Employees from "./Employees";

const AdminUsers = () => {
  const { requests, loading, error, refreshRequests } = useHolidayRequests();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage employees and their user accounts</p>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employee Management</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Employees />
        </TabsContent>

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
      </Tabs>
    </div>
  );
};

export default AdminUsers;
