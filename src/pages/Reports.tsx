
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { BarChart3, Calendar, Users, Clock, TrendingUp, FileText } from "lucide-react";
import HolidayCalendarWidget from "@/components/reporting/HolidayCalendarWidget";
import StaffOverviewWidget from "@/components/reporting/StaffOverviewWidget";
import HolidayTrendsWidget from "@/components/reporting/HolidayTrendsWidget";
import UpcomingHolidaysWidget from "@/components/reporting/UpcomingHolidaysWidget";
import TeamAvailabilityWidget from "@/components/reporting/TeamAvailabilityWidget";
import HolidayBalanceWidget from "@/components/reporting/HolidayBalanceWidget";

const Reports = () => {
  const { hasPermission } = usePermissions();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive reporting and insights dashboard</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StaffOverviewWidget />
            <UpcomingHolidaysWidget />
            <TeamAvailabilityWidget />
            <HolidayBalanceWidget />
          </div>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <HolidayCalendarWidget 
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>
            <div className="space-y-6">
              <UpcomingHolidaysWidget />
              <HolidayBalanceWidget />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StaffOverviewWidget />
            <TeamAvailabilityWidget />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <HolidayTrendsWidget />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
