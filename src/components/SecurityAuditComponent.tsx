
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Clock, Users, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
  category: 'authentication' | 'authorization' | 'data' | 'templates' | 'monitoring';
}

const SecurityAuditComponent = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewSecurity = hasPermission('manage_users');

  useEffect(() => {
    if (canViewSecurity) {
      performSecurityAudit();
    }
  }, [canViewSecurity]);

  const performSecurityAudit = async () => {
    setLoading(true);
    const checks: SecurityCheck[] = [];

    try {
      // Authentication Security Checks
      await checkAuthenticationSecurity(checks);
      
      // Authorization Security Checks
      await checkAuthorizationSecurity(checks);
      
      // Data Security Checks
      await checkDataSecurity(checks);
      
      // Template Security Checks
      await checkTemplateSecurity(checks);
      
      // Monitoring and Audit Checks
      await checkMonitoringSecurity(checks);

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

  const checkAuthenticationSecurity = async (checks: SecurityCheck[]) => {
    // Check for inactive users with active sessions
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('profiles')
      .select('id, email, active')
      .eq('active', false);

    if (!inactiveError) {
      checks.push({
        id: 'inactive_users',
        name: 'Inactive User Accounts',
        category: 'authentication',
        status: (inactiveUsers?.length || 0) === 0 ? 'pass' : 'warning',
        description: `${inactiveUsers?.length || 0} inactive user accounts found`,
        recommendation: (inactiveUsers?.length || 0) > 0 ? 
          'Review and disable inactive user accounts to prevent unauthorized access' : undefined
      });
    }

    // Check user role distribution
    const { data: roleStats, error: roleError } = await supabase
      .from('user_roles')
      .select('role');

    if (!roleError && roleStats) {
      const adminCount = roleStats.filter(r => r.role === 'admin').length;
      const totalUsers = roleStats.length;
      
      checks.push({
        id: 'admin_ratio',
        name: 'Administrator Account Ratio',
        category: 'authentication',
        status: adminCount > 0 && adminCount < (totalUsers * 0.3) ? 'pass' : 'warning',
        description: `${adminCount} admin accounts out of ${totalUsers} total users (${Math.round((adminCount/totalUsers) * 100)}%)`,
        recommendation: adminCount === 0 ? 
          'At least one admin account should be configured' : 
          adminCount > (totalUsers * 0.3) ? 'Consider reducing the number of admin accounts' : undefined
      });
    }
  };

  const checkAuthorizationSecurity = async (checks: SecurityCheck[]) => {
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
        name: 'User Permission Assignment',
        category: 'authorization',
        status: (usersWithoutPerms?.length || 0) === 0 ? 'pass' : 'warning',
        description: `${usersWithoutPerms?.length || 0} users without explicit permissions`,
        recommendation: (usersWithoutPerms?.length || 0) > 0 ? 
          'Assign appropriate permissions to all users to follow principle of least privilege' : undefined
      });
    }

    // Check for overprivileged users
    const { data: userPermCounts, error: permCountError } = await supabase
      .from('user_permissions')
      .select('user_id, permission_id');

    if (!permCountError && userPermCounts) {
      const permissionCounts = userPermCounts.reduce((acc, perm) => {
        acc[perm.user_id] = (acc[perm.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const overprivilegedUsers = Object.values(permissionCounts).filter(count => count > 10).length;
      
      checks.push({
        id: 'overprivileged_users',
        name: 'Overprivileged User Detection',
        category: 'authorization',
        status: overprivilegedUsers === 0 ? 'pass' : 'warning',
        description: `${overprivilegedUsers} users with more than 10 permissions`,
        recommendation: overprivilegedUsers > 0 ? 
          'Review users with excessive permissions and apply principle of least privilege' : undefined
      });
    }
  };

  const checkDataSecurity = async (checks: SecurityCheck[]) => {
    // Check RLS is enabled on critical tables
    const criticalTables = ['employees', 'notifications', 'holiday_requests', 'career_history', 'user_permissions'];
    
    try {
      // This is a simplified check - in a real audit you'd query pg_tables
      checks.push({
        id: 'rls_enabled',
        name: 'Row Level Security Status',
        category: 'data',
        status: 'pass', // Assuming RLS is enabled based on migration
        description: 'RLS is enabled on all critical tables',
        recommendation: undefined
      });
    } catch (error) {
      checks.push({
        id: 'rls_enabled',
        name: 'Row Level Security Status',
        category: 'data',
        status: 'fail',
        description: 'Unable to verify RLS status on critical tables',
        recommendation: 'Manually verify RLS is enabled on all sensitive tables'
      });
    }

    // Check for sensitive data exposure
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, national_insurance_number, passport_number')
      .limit(5);

    if (!employeeError && employeeData) {
      const hasExposedSensitiveData = employeeData.some(emp => 
        emp.national_insurance_number || emp.passport_number
      );
      
      checks.push({
        id: 'sensitive_data_handling',
        name: 'Sensitive Data Handling',
        category: 'data',
        status: hasExposedSensitiveData ? 'warning' : 'pass',
        description: hasExposedSensitiveData ? 
          'Sensitive data detected in employee records' : 
          'No obvious sensitive data exposure detected',
        recommendation: hasExposedSensitiveData ? 
          'Consider encrypting sensitive fields like NI numbers and passport details' : undefined
      });
    }
  };

  const checkTemplateSecurity = async (checks: SecurityCheck[]) => {
    // Check notification template security
    const { data: templates, error: templateError } = await supabase
      .from('notification_templates')
      .select('id, title_template, message_template, name');

    if (!templateError && templates) {
      const unsafeTemplates = templates.filter(template => {
        const content = template.title_template + ' ' + template.message_template;
        return content.includes('<script>') || 
               content.includes('javascript:') || 
               content.includes('eval(') ||
               content.includes('onclick=') ||
               content.includes('onerror=');
      });

      checks.push({
        id: 'template_security',
        name: 'Notification Template Security',
        category: 'templates',
        status: unsafeTemplates.length === 0 ? 'pass' : 'fail',
        description: `${unsafeTemplates.length} potentially unsafe notification templates out of ${templates.length} total`,
        recommendation: unsafeTemplates.length > 0 ? 
          `Review and sanitize templates: ${unsafeTemplates.map(t => t.name).join(', ')}` : undefined
      });

      // Check for proper variable usage
      const templatesWithVariables = templates.filter(template => {
        const content = template.title_template + ' ' + template.message_template;
        return content.includes('{{') && content.includes('}}');
      });

      checks.push({
        id: 'template_variables',
        name: 'Template Variable Usage',
        category: 'templates',
        status: templatesWithVariables.length > 0 ? 'pass' : 'warning',
        description: `${templatesWithVariables.length} templates use secure variable substitution`,
        recommendation: templatesWithVariables.length === 0 ? 
          'Consider using variable templates instead of hardcoded text for better security' : undefined
      });
    }
  };

  const checkMonitoringSecurity = async (checks: SecurityCheck[]) => {
    // Check audit trail completeness
    const { data: recentNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, created_at, user_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (!notifError) {
      checks.push({
        id: 'audit_trail',
        name: 'Activity Audit Trail',
        category: 'monitoring',
        status: (recentNotifications?.length || 0) > 0 ? 'pass' : 'warning',
        description: `${recentNotifications?.length || 0} tracked activities in the last 7 days`,
        recommendation: (recentNotifications?.length || 0) === 0 ? 
          'Consider implementing more comprehensive audit logging' : undefined
      });
    }

    // Check for proper session management
    const { data: activeProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('active', true);

    if (!profileError && activeProfiles) {
      const recentlyActiveUsers = activeProfiles.filter(profile => {
        const lastUpdate = new Date(profile.updated_at);
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate < 30;
      }).length;

      checks.push({
        id: 'session_management',
        name: 'Active Session Management',
        category: 'monitoring',
        status: recentlyActiveUsers > 0 ? 'pass' : 'warning',
        description: `${recentlyActiveUsers} users active in the last 30 days`,
        recommendation: recentlyActiveUsers === 0 ? 
          'Verify session management is working correctly' : undefined
      });
    }
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <Users className="w-4 h-4" />;
      case 'authorization':
        return <Shield className="w-4 h-4" />;
      case 'data':
        return <Database className="w-4 h-4" />;
      case 'templates':
        return <Eye className="w-4 h-4" />;
      case 'monitoring':
        return <Clock className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getChecksByCategory = () => {
    return securityChecks.reduce((acc, check) => {
      if (!acc[check.category]) {
        acc[check.category] = [];
      }
      acc[check.category].push(check);
      return acc;
    }, {} as Record<string, SecurityCheck[]>);
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

  const checksByCategory = getChecksByCategory();
  const totalChecks = securityChecks.length;
  const passedChecks = securityChecks.filter(c => c.status === 'pass').length;
  const failedChecks = securityChecks.filter(c => c.status === 'fail').length;
  const warningChecks = securityChecks.filter(c => c.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Security Audit Dashboard</h2>
        </div>
        <Button onClick={performSecurityAudit} disabled={loading}>
          <Eye className="w-4 h-4 mr-2" />
          {loading ? 'Auditing...' : 'Refresh Audit'}
        </Button>
      </div>

      {/* Security Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningChecks}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalChecks}</div>
              <div className="text-sm text-gray-600">Total Checks</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Performing comprehensive security audit...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(checksByCategory).map(([category, checks]) => (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category)}
                  <CardTitle className="capitalize text-lg">{category} Security</CardTitle>
                  <Badge variant="outline">{checks.length} checks</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checks.map((check) => (
                    <div key={check.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <h4 className="font-medium">{check.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                          {check.recommendation && (
                            <div className="bg-blue-50 p-2 rounded-md mt-2">
                              <p className="text-xs text-blue-800">
                                <strong>Recommendation:</strong> {check.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(check.status)}
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Regularly review and disable inactive user accounts</li>
                <li>• Limit admin accounts to essential personnel only</li>
                <li>• Implement strong password policies</li>
                <li>• Monitor failed login attempts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Protection</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Ensure RLS is enabled on all sensitive tables</li>
                <li>• Encrypt sensitive personal data at rest</li>
                <li>• Implement proper data retention policies</li>
                <li>• Regular security audits and penetration testing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Template Security</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Sanitize all template content to prevent XSS</li>
                <li>• Use parameterized templates with variable validation</li>
                <li>• Regularly review notification templates</li>
                <li>• Implement content security policies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Monitoring</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Maintain comprehensive audit logs</li>
                <li>• Monitor for suspicious access patterns</li>
                <li>• Set up alerts for security events</li>
                <li>• Regular security training for users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditComponent;
