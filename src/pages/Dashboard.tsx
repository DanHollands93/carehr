
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and user management</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
};

export default Dashboard;
