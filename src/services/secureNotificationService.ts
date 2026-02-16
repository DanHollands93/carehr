
import { supabase } from '@/integrations/supabase/client';

interface SecureNotificationData {
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

// Allowed variables for template security
const ALLOWED_TEMPLATE_VARIABLES = [
  'employee_name', 'first_name', 'last_name', 'approver_name',
  'start_date', 'end_date', 'rejection_reason', 'department',
  'job_title', 'manager_name', 'shift_date', 'shift_time',
  'document_name', 'policy_name', 'training_name'
];

export const secureNotificationService = {
  // Validate template variables for security
  validateTemplateVariables: (template: string): boolean => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.match(variableRegex);
    
    if (!matches) return true;
    
    for (const match of matches) {
      const variable = match.replace(/[{}]/g, '');
      if (!ALLOWED_TEMPLATE_VARIABLES.includes(variable)) {
        console.error(`Invalid template variable: ${variable}`);
        return false;
      }
    }
    
    return true;
  },

  // Sanitize content to prevent XSS
  sanitizeContent: (content: string): string => {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\s*\(/gi, '');
  },

  // Create a notification securely
  createSecureNotification: async (notification: SecureNotificationData) => {
    // Sanitize the content
    const sanitizedNotification = {
      ...notification,
      title: secureNotificationService.sanitizeContent(notification.title),
      message: secureNotificationService.sanitizeContent(notification.message)
    };

    const { error } = await supabase
      .from('notifications')
      .insert({
        ...sanitizedNotification,
        read: false
      });

    if (error) {
      console.error('Error creating secure notification:', error);
      throw error;
    }
  },

  // Create notification from template with security validation
  createSecureNotificationFromTemplate: async (
    templateId: string,
    userId: string,
    variables: Record<string, string>
  ) => {
    // Get the template with security check
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

    // Validate template variables
    if (!secureNotificationService.validateTemplateVariables(template.title_template) ||
        !secureNotificationService.validateTemplateVariables(template.message_template)) {
      throw new Error('Template contains invalid variables');
    }

    // Sanitize variable values
    const sanitizedVariables: Record<string, string> = {};
    Object.entries(variables).forEach(([key, value]) => {
      if (ALLOWED_TEMPLATE_VARIABLES.includes(key)) {
        sanitizedVariables[key] = secureNotificationService.sanitizeContent(value);
      }
    });

    // Replace variables in template
    let title = template.title_template;
    let message = template.message_template;

    Object.entries(sanitizedVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });

    // Create the notification
    await secureNotificationService.createSecureNotification({
      user_id: userId,
      title,
      message,
      type: template.type as 'success' | 'warning' | 'info',
      category: template.category
    });
  },

  // Bulk create notifications with security validation
  createBulkSecureNotifications: async (notifications: SecureNotificationData[]) => {
    const sanitizedNotifications = notifications.map(notification => ({
      ...notification,
      title: secureNotificationService.sanitizeContent(notification.title),
      message: secureNotificationService.sanitizeContent(notification.message),
      read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(sanitizedNotifications);

    if (error) {
      console.error('Error creating bulk secure notifications:', error);
      throw error;
    }
  },

  // Get templates by trigger event with security validation
  getSecureTemplatesByEvent: async (triggerEvent: string): Promise<NotificationTemplate[]> => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching secure templates:', error);
      return [];
    }

    // Validate all templates for security
    const validTemplates = (data || []).filter(template => 
      secureNotificationService.validateTemplateVariables(template.title_template) &&
      secureNotificationService.validateTemplateVariables(template.message_template)
    );

    return validTemplates as any[];
  },

  // Helper function to send secure holiday approval notification
  sendSecureHolidayApprovalNotification: async (
    userId: string,
    approverName: string,
    startDate: string,
    endDate: string
  ) => {
    const templates = await secureNotificationService.getSecureTemplatesByEvent('holiday_approved');
    
    if (templates.length > 0) {
      await secureNotificationService.createSecureNotificationFromTemplate(
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

  // Helper function to send secure holiday rejection notification
  sendSecureHolidayRejectionNotification: async (
    userId: string,
    startDate: string,
    endDate: string,
    rejectionReason: string
  ) => {
    const templates = await secureNotificationService.getSecureTemplatesByEvent('holiday_rejected');
    
    if (templates.length > 0) {
      await secureNotificationService.createSecureNotificationFromTemplate(
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
