
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User, Bell, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HRDashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Request Holiday",
      description: "Submit a new holiday request",
      icon: Calendar,
      action: () => navigate('/hr/holidays'),
      color: "bg-blue-500"
    },
    {
      title: "Update Profile",
      description: "Edit your personal details",
      icon: User,
      action: () => navigate('/hr/profile'),
      color: "bg-green-500"
    },
    {
      title: "View Documents",
      description: "Access company documents",
      icon: FileText,
      action: () => navigate('/hr/documents'),
      color: "bg-purple-500"
    },
    {
      title: "Notifications",
      description: "Check latest updates",
      icon: Bell,
      action: () => navigate('/hr/notifications'),
      color: "bg-orange-500"
    }
  ];

  const stats = [
    {
      title: "Holiday Balance",
      value: "15 days",
      icon: Calendar,
      description: "Remaining this year",
      color: "text-blue-600"
    },
    {
      title: "Pending Requests",
      value: "2",
      icon: Clock,
      description: "Awaiting approval",
      color: "text-orange-600"
    },
    {
      title: "Profile Complete",
      value: "85%",
      icon: TrendingUp,
      description: "Update remaining fields",
      color: "text-green-600"
    },
    {
      title: "Documents Read",
      value: "8/12",
      icon: CheckCircle,
      description: "Policies acknowledged",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your HR overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <div className={`p-3 rounded-full ${action.color} text-white`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Holiday request submitted</p>
                <p className="text-xs text-gray-600">Dec 23-27, 2024 - Awaiting approval</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Profile updated</p>
                <p className="text-xs text-gray-600">Emergency contact information added</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Complete</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New policy document</p>
                <p className="text-xs text-gray-600">Remote work policy v2.1 - Please review</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Action Required</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboard;
