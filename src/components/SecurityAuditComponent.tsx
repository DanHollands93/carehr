
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
}

const SecurityAuditComponent = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewSecurity = hasPermission('manage_users'); // Using admin permission

  useEffect(() => {
    if (canViewSecurity) {
      performSecurityAudit();
    }
  }, [canViewSecurity]);

  const performSecurityAudit = async () => {
    setLoading(true);
    const checks: SecurityCheck[] = [];

    try {
      // Check RLS is enabled on critical tables
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public')
        .in('table_name', ['employees', 'notifications', 'holiday_requests', 'career_history']);

      if (!rlsError && rlsStatus) {
        const tablesWithoutRls = rlsStatus.filter(table => !table.row_security);
        checks.push({
          id: 'rls_enabled',
          name: 'Row Level Security',
          status: tablesWithoutRls.length === 0 ? 'pass' : 'fail',
          description: `RLS is ${tablesWithoutRls.length === 0 ? 'enabled' : 'missing'} on critical tables`,
          recommendation: tablesWithoutRls.length > 0 ? 
            `Enable RLS on: ${tablesWithoutRls.map(t => t.table_name).join(', ')}` : undefined
        });
      }

      // Check for users without proper permissions
      const { data: usersWithoutPerms, error: permsError } = await supabase
        .from('profiles')
        .select(`
          id, 
          email,
          user_permissions!left(id)
        `)
        .is('user_permissions.id', null);

      if (!permsError) {
        checks.push({
          id: 'user_permissions',
          name: 'User Permissions',
          status: (usersWithoutPerms?.length || 0) === 0 ? 'pass' : 'warning',
          description: `${usersWithoutPerms?.length || 0} users without explicit permissions`,
          recommendation: (usersWithoutPerms?.length || 0) > 0 ? 
            'Assign appropriate permissions to all users' : undefined
        });
      }

      // Check notification template security
      const { data: templates, error: templateError } = await supabase
        .from('notification_templates')
        .select('id, title_template, message_template');

      if (!templateError && templates) {
        const unsafeTemplates = templates.filter(template => {
          const content = template.title_template + ' ' + template.message_template;
          return content.includes('<script>') || content.includes('javascript:') || content.includes('eval(');
        });

        checks.push({
          id: 'template_security',
          name: 'Template Security',
          status: unsafeTemplates.length === 0 ? 'pass' : 'fail',
          description: `${unsafeTemplates.length} potentially unsafe notification templates`,
          recommendation: unsafeTemplates.length > 0 ? 
            'Review and sanitize notification templates' : undefined
        });
      }

      // Check for inactive users with active sessions
      const { data: inactiveUsers, error: inactiveError } = await supabase
        .from('profiles')
        .select('id, email, active')
        .eq('active', false);

      if (!inactiveError) {
        checks.push({
          id: 'inactive_users',
          name: 'Inactive Users',
          status: (inactiveUsers?.length || 0) === 0 ? 'pass' : 'warning',
          description: `${inactiveUsers?.length || 0} inactive user accounts`,
          recommendation: (inactiveUsers?.length || 0) > 0 ? 
            'Review and disable inactive user accounts' : undefined
        });
      }

      // Check for proper admin role assignment
      const { data: admins, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminError) {
        checks.push({
          id: 'admin_accounts',
          name: 'Admin Accounts',
          status: (admins?.length || 0) > 0 && (admins?.length || 0) < 5 ? 'pass' : 'warning',
          description: `${admins?.length || 0} admin accounts configured`,
          recommendation: (admins?.length || 0) === 0 ? 
            'At least one admin account should be configured' : 
            (admins?.length || 0) > 5 ? 'Consider reducing the number of admin accounts' : undefined
        });
      }

    } catch (error) {
      console.error('Security audit error:', error);
      toast({
        title: "Security Audit Error",
        description: "Failed to complete security audit",
        variant: "destructive"
      });
    }

    setSecurityChecks(checks);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">Secure</Badge>;
      case 'fail':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!canViewSecurity) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to view security audit information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Security Audit</h2>
        </div>
        <Button onClick={performSecurityAudit} disabled={loading}>
          <Eye className="w-4 h-4 mr-2" />
          {loading ? 'Auditing...' : 'Refresh Audit'}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Performing security audit...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {securityChecks.map((check) => (
            <Card key={check.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <CardTitle className="text-lg">{check.name}</CardTitle>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">{check.description}</p>
                {check.recommendation && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> {check.recommendation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Regularly review user permissions and remove unused accounts</li>
            <li>• Monitor notification templates for potential security issues</li>
            <li>• Ensure Row Level Security is enabled on all sensitive tables</li>
            <li>• Limit the number of admin accounts to essential personnel only</li>
            <li>• Review access logs periodically for suspicious activity</li>
            <li>• Keep notification content sanitized and free from executable code</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditComponent;
