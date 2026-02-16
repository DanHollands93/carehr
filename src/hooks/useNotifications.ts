
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
  seen_at: string | null;
  marked_read_at: string | null;
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
      setNotifications((data as any[]) || []);
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
      setTemplates((data as any[]) || []);
    }
  };

  const markAllAsSeen = async () => {
    if (!user) return;

    // Get notifications that need to be marked as seen
    const unseenNotifications = notifications.filter(n => !n.seen_at);
    
    if (unseenNotifications.length === 0) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({ 
        seen_at: now,
        updated_at: now
      })
      .eq('user_id', user.id)
      .is('seen_at', null);

    if (error) {
      console.error('Error marking notifications as seen:', error);
    } else {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => 
          n.seen_at === null ? { ...n, seen_at: now } : n
        )
      );
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        marked_read_at: now,
        updated_at: now
      })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { 
            ...n, 
            read: true, 
            marked_read_at: now
          } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        marked_read_at: now,
        updated_at: now
      })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read: true, 
          marked_read_at: now
        }))
      );
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'seen_at' | 'marked_read_at' | 'created_at' | 'updated_at'>) => {
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

  // Count unseen notifications (not seen at all)
  const unseenCount = notifications.filter(n => !n.seen_at).length;

  return {
    notifications,
    templates,
    loading,
    unseenCount,
    markAsRead,
    markAllAsRead,
    markAllAsSeen,
    createNotification,
    refetch: loadNotifications
  };
};
