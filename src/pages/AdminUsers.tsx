
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
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Employees />
        </TabsContent>

        <TabsContent value="users">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">User Account Management</h3>
            <p className="text-muted-foreground mb-4">
              User accounts are managed within the Employee Management section. 
              Go to the "Employee Management" tab, select an employee, and navigate to the "User Account" tab.
            </p>
          </div>
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
