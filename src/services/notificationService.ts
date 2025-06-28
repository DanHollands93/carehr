
// DEPRECATED: This service is deprecated for security reasons.
// Use secureNotificationService.ts instead for all new implementations.
// This file is kept temporarily for backward compatibility and will be removed.

import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  category: string;
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
}

/**
 * @deprecated Use secureNotificationService instead
 * This service lacks proper security validation and XSS protection
 */
export const notificationService = {
  // Create a notification directly
  createNotification: async (notification: NotificationData) => {
    console.warn('SECURITY WARNING: Using deprecated notificationService. Switch to secureNotificationService.');
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Create notification from template
  createNotificationFromTemplate: async (
    templateId: string,
    userId: string,
    variables: Record<string, string>
  ) => {
    console.warn('SECURITY WARNING: Using deprecated notificationService. Switch to secureNotificationService.');
    
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Error fetching template:', templateError);
      throw new Error('Template not found or inactive');
    }

    // Replace variables in template (INSECURE - no validation)
    let title = template.title_template;
    let message = template.message_template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });

    // Create the notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: template.type,
        category: template.category,
        read: false
      });

    if (error) {
      console.error('Error creating notification from template:', error);
      throw error;
    }
  },

  // Bulk create notifications (for multiple users)
  createBulkNotifications: async (notifications: NotificationData[]) => {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications.map(n => ({ ...n, read: false })));

    if (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  },

  // Get templates by trigger event
  getTemplatesByEvent: async (triggerEvent: string): Promise<NotificationTemplate[]> => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data || [];
  },

  // Helper function to send holiday approval notification
  sendHolidayApprovalNotification: async (
    userId: string,
    approverName: string,
    startDate: string,
    endDate: string
  ) => {
    const templates = await notificationService.getTemplatesByEvent('holiday_approved');
    
    if (templates.length > 0) {
      await notificationService.createNotificationFromTemplate(
        templates[0].id,
        userId,
        {
          approver_name: approverName,
          start_date: startDate,
          end_date: endDate
        }
      );
    }
  },

  // Helper function to send holiday rejection notification
  sendHolidayRejectionNotification: async (
    userId: string,
    startDate: string,
    endDate: string,
    rejectionReason: string
  ) => {
    const templates = await notificationService.getTemplatesByEvent('holiday_rejected');
    
    if (templates.length > 0) {
      await notificationService.createNotificationFromTemplate(
        templates[0].id,
        userId,
        {
          start_date: startDate,
          end_date: endDate,
          rejection_reason: rejectionReason
        }
      );
    }
  }
};
