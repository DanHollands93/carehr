
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  category: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: 'success' | 'warning' | 'info';
  category: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadTemplates();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading notification templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user?.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: user.id,
        read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      loadNotifications();
    }
  };

  return {
    notifications,
    templates,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: loadNotifications
  };
};
