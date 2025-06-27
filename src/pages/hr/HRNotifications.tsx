
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, Info, AlertTriangle, Calendar, FileText, Users, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import NotificationTemplateManager from '@/components/NotificationTemplateManager';

const HRNotifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const { hasPermission } = usePermissions();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Holiday':
        return <Calendar className="w-4 h-4" />;
      case 'Policy':
        return <FileText className="w-4 h-4" />;
      case 'Training':
        return <Users className="w-4 h-4" />;
      case 'Profile':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with important announcements and updates.</p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">My Notifications</TabsTrigger>
          {hasPermission('manage_users') && (
            <TabsTrigger value="templates">Manage Templates</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Categories Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Holiday', 'Policy', 'Training', 'Benefits'].map((category) => {
              const categoryCount = notifications.filter(n => n.category === category && !n.read).length;
              return (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      {categoryCount > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                          {categoryCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-md ${getNotificationBg(notification.type, notification.read)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              {getCategoryIcon(notification.category)}
                              <span>{notification.category}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(new Date(notification.created_at), 'MMM d, yyyy \'at\' HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {notifications.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {hasPermission('manage_users') && (
          <TabsContent value="templates">
            <NotificationTemplateManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default HRNotifications;
