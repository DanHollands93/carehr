
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const HRDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your personal HR overview</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
};

export default HRDashboard;
