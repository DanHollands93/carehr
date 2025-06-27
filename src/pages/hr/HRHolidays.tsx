
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HolidayRequestForm from "@/components/HolidayRequestForm";
import HolidayRequestsList from "@/components/HolidayRequestsList";
import { useHolidayRequests } from "@/hooks/useHolidayRequests";

const HRHolidays = () => {
  const { requests, loading, error, submitRequest } = useHolidayRequests();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Holiday Management</h1>
        <p className="text-gray-600 mt-2">Request time off and manage your holiday balance</p>
      </div>

      <Tabs defaultValue="request" className="space-y-6">
        <TabsList>
          <TabsTrigger value="request">New Request</TabsTrigger>
          <TabsTrigger value="history">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <HolidayRequestForm onSubmit={submitRequest} />
        </TabsContent>

        <TabsContent value="history">
          <HolidayRequestsList 
            requests={requests} 
            onUpdate={() => window.location.reload()} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRHolidays;
