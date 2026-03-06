import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ChevronLeft, ChevronRight, FileText, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const TABLE_LABELS: Record<string, string> = {
  employees: 'Employees',
  shifts: 'Shifts',
  time_clock_records: 'Time Clock',
  time_segments: 'Time Segments',
  holiday_requests: 'Holiday Requests',
  holiday_entitlement: 'Holiday Entitlement',
  career_history: 'Career History',
  job_roles: 'Job Roles',
  employee_job_roles: 'Employee Roles',
  roster_templates: 'Roster Templates',
  shift_templates: 'Shift Templates',
  permissions: 'Permissions',
  permission_groups: 'Permission Groups',
  permission_group_permissions: 'Group Permissions',
  profiles: 'Profiles',
  companies: 'Companies',
  company_settings: 'Company Settings',
  company_modules: 'Company Modules',
  system_settings: 'System Settings',
  notification_templates: 'Notification Templates',
  notifications: 'Notifications',
  roster_categories: 'Roster Categories',
  roster_staff_assignments: 'Staff Assignments',
  roster_template_assignments: 'Template Assignments',
  applied_roster_templates: 'Applied Templates',
  template_shifts: 'Template Shifts',
  address_history: 'Address History',
  lookup_lists: 'Lookup Lists',
  menu_sets: 'Menu Sets',
  processes: 'Processes',
  positions: 'Positions',
  employee_drafts: 'Employee Drafts',
  bulk_position_rules: 'Position Rules',
  bulk_role_rules: 'Role Rules',
  user_roles: 'User Roles',
  user_permissions: 'User Permissions',
  user_role_assignments: 'Role Assignments',
  user_location_permissions: 'Location Permissions',
  user_menu_overrides: 'Menu Overrides',
};

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  INSERT: { icon: <Plus className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Created' },
  UPDATE: { icon: <Pencil className="w-3 h-3" />, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Updated' },
  DELETE: { icon: <Trash2 className="w-3 h-3" />, color: 'bg-destructive/10 text-destructive', label: 'Deleted' },
};

const PAGE_SIZE = 50;

const AuditLog = () => {
  const { companyId } = useUserCompanyId();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Generate a human-readable description for audit entries
  const getActionDescription = (log: any): string | null => {
    const { table_name, action, changed_fields, new_data, old_data } = log;

    if (table_name === 'time_clock_records') {
      if (action === 'UPDATE' && changed_fields) {
        if (changed_fields.includes('approval_status') && new_data?.approval_status === 'reviewed') {
          if (new_data?.notes?.includes('Auto-approved')) return 'Auto exception applied';
          return 'Discrepancy reviewed';
        }
        if (changed_fields.includes('approval_status') && new_data?.approval_status === 'pending') {
          return 'Review removed — reset to pending';
        }
        if (changed_fields.includes('status') && new_data?.status === 'clocked_in') return 'Clocked in';
        if (changed_fields.includes('clock_out_time')) return 'Clocked out';
        if (changed_fields.includes('early_minutes_paid') || changed_fields.includes('late_minutes_paid')) return 'Exception pay updated';
      }
      if (action === 'INSERT') return 'Time record created';
    }

    if (table_name === 'shifts') {
      if (action === 'INSERT') return 'Shift created';
      if (action === 'DELETE') return 'Shift removed';
      if (action === 'UPDATE') {
        if (changed_fields?.includes('employee_id') || changed_fields?.includes('date')) return 'Shift moved';
        if (changed_fields?.includes('start_time') || changed_fields?.includes('end_time')) return 'Shift times changed';
        return 'Shift updated';
      }
    }

    if (table_name === 'system_settings') {
      if (action === 'UPDATE') return `Setting "${new_data?.setting_key}" changed`;
    }

    if (table_name === 'company_settings') {
      if (action === 'UPDATE') return `Company setting "${new_data?.setting_key}" changed`;
    }

    if (table_name === 'holiday_requests') {
      if (action === 'INSERT') return 'Holiday request submitted';
      if (action === 'UPDATE' && changed_fields?.includes('status')) return `Holiday ${new_data?.status}`;
    }

    if (table_name === 'employees') {
      if (action === 'INSERT') return 'Employee added';
      if (action === 'DELETE') return 'Employee removed';
      if (action === 'UPDATE') return 'Employee details updated';
    }

    if (table_name === 'user_role_assignments' || table_name === 'user_roles') {
      if (action === 'INSERT') return 'Role assigned';
      if (action === 'DELETE') return 'Role removed';
    }

    if (table_name === 'user_permissions') {
      if (action === 'INSERT') return 'Permission granted';
      if (action === 'DELETE') return 'Permission revoked';
    }

    return null;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', companyId, page, tableFilter, actionFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('performed_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (companyId) query = query.eq('company_id', companyId);
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
      if (actionFilter !== 'all') query = query.eq('action', actionFilter);

      const { data: logs, error, count } = await query;
      if (error) throw error;

      // Fetch performer names
      const performerIds = [...new Set((logs || []).map((l: any) => l.performed_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (performerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', performerIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });
      }

      return { 
        logs: (logs || []).map((l: any) => ({ ...l, performer: profilesMap[l.performed_by] || null })),
        total: count || 0 
      };
    },
    enabled: !!companyId,
  });

  const filteredLogs = data?.logs?.filter((log: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const tableName = (TABLE_LABELS[log.table_name] || log.table_name).toLowerCase();
    const userName = log.performer ? `${log.performer.first_name || ''} ${log.performer.last_name || ''}`.toLowerCase() : '';
    const changedFields = (log.changed_fields || []).join(' ').toLowerCase();
    const desc = (getActionDescription(log) || '').toLowerCase();
    return tableName.includes(s) || userName.includes(s) || changedFields.includes(s) || desc.includes(s) || log.record_id?.includes(s);
  }) || [];

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const formatFieldValue = (val: any): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Complete history of all changes across the system</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by table, user, field..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {Object.entries(TABLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No audit log entries found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-1">
                {filteredLogs.map((log: any) => {
                  const action = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                  const userName = log.performer
                    ? `${log.performer.first_name || ''} ${log.performer.last_name || ''}`.trim() || log.performer.email
                    : 'System';
                  const description = getActionDescription(log);
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Badge variant="outline" className={`${action.color} flex items-center gap-1 text-[10px] px-2 py-0.5 shrink-0`}>
                        {action.icon}
                        {action.label}
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </span>
                          {description ? (
                            <span className="text-xs text-primary font-medium">
                              — {description}
                            </span>
                          ) : log.changed_fields && log.changed_fields.length > 0 ? (
                            <span className="text-xs text-muted-foreground truncate">
                              ({log.changed_fields.join(', ')})
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by <span className="font-medium">{userName}</span>
                        </p>
                      </div>

                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(log.performed_at), 'dd MMM yyyy HH:mm')}
                      </span>
                      <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} ({data?.total} entries)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Table</p>
                  <p className="font-medium">{TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Action</p>
                  <Badge variant="outline" className={ACTION_CONFIG[selectedLog.action]?.color}>
                    {ACTION_CONFIG[selectedLog.action]?.label || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Performed By</p>
                  <p className="font-medium">
                    {selectedLog.performer
                      ? `${selectedLog.performer.first_name || ''} ${selectedLog.performer.last_name || ''}`.trim() || selectedLog.performer.email
                      : 'System'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedLog.performed_at), 'dd MMM yyyy HH:mm:ss')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Record ID</p>
                  <p className="font-mono text-xs">{selectedLog.record_id}</p>
                </div>
              </div>

              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Changed Fields</p>
                  <div className="space-y-2">
                    {selectedLog.changed_fields.map((field: string) => (
                      <div key={field} className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-foreground mb-1">{field}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-0.5">Before</p>
                            <pre className="bg-destructive/5 text-destructive rounded p-2 whitespace-pre-wrap break-all max-h-24 overflow-auto">
                              {formatFieldValue(selectedLog.old_data?.[field])}
                            </pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">After</p>
                            <pre className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded p-2 whitespace-pre-wrap break-all max-h-24 overflow-auto">
                              {formatFieldValue(selectedLog.new_data?.[field])}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.action === 'INSERT' && selectedLog.new_data && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Created Record</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.action === 'DELETE' && selectedLog.old_data && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Deleted Record</p>
                  <pre className="bg-destructive/5 rounded-lg p-3 text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto text-destructive">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLog;
