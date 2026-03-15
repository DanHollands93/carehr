
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { CalendarIcon, Download, Printer, Settings, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface TimeSegment {
  id: string;
  segment_type: 'early_overtime' | 'scheduled' | 'late_overtime';
  start_time: string;
  end_time: string;
  minutes_worked: number;
  minutes_paid: number;
  pay_status: 'unpaid' | 'paid' | 'pending';
}

interface HoursRecord {
  employee_id: string;
  employee_name: string;
  position: string;
  date: string;
  shift_start: string;
  shift_end: string;
  clock_in: string | null;
  clock_out: string | null;
  scheduled_hours: number;
  paid_hours: number;
  pay_rate: number;
  total_pay: number;
  has_issue: boolean;
  issue_type?: string;
  exception_status?: string;
  job_title?: string;
  segment_type?: string;
  segment_description?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  width?: string;
}

const defaultColumns: ColumnConfig[] = [
  { key: 'employee_name', label: 'Employee', enabled: true, width: '200px' },
  { key: 'position', label: 'Position/Role', enabled: true, width: '150px' },
  { key: 'date', label: 'Date', enabled: true, width: '120px' },
  { key: 'clock_times', label: 'Clock In/Out', enabled: true, width: '160px' },
  { key: 'scheduled_hours', label: 'Scheduled Hours', enabled: true, width: '130px' },
  { key: 'paid_hours', label: 'Paid Hours', enabled: true, width: '120px' },
  { key: 'variance', label: 'Variance', enabled: true, width: '100px' },
  { key: 'pay_rate', label: 'Pay Rate', enabled: true, width: '100px' },
  { key: 'total_pay', label: 'Total Pay', enabled: true, width: '120px' },
  { key: 'segment_info', label: 'Time Segment', enabled: true, width: '150px' }
];

const HoursAnalysisReport = () => {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch detailed hours data with time segments
  const { data: hoursData, isLoading: isLoadingHours } = useQuery({
    queryKey: ['hours-analysis-detailed', dateRange.from, dateRange.to],
    queryFn: async () => {
      console.log('Fetching detailed hours analysis data for date range:', {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Get all shifts in the date range
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      console.log('Found shifts:', shifts?.length || 0);
      
      if (!shifts?.length) {
        return [];
      }

      // Get unique employee IDs from shifts
      const employeeIds = [...new Set(shifts.map(s => s.employee_id))];
      
      // Get employee details
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .in('id', employeeIds);
        
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      // Get shift IDs for time clock records lookup
      const shiftIds = shifts.map(s => s.id);
      
      // Get time clock records with time segments
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_clock_records')
        .select(`
          *,
          time_segments (
            id,
            segment_type,
            start_time,
            end_time,
            minutes_worked,
            minutes_paid,
            pay_status
          )
        `)
        .in('shift_id', shiftIds);
        
      if (timeError) {
        console.error('Error fetching time records:', timeError);
      }
      
      // Get all pay rates for date-based lookup by job_role_id
      const { data: payRatesData } = await supabase
        .from('pay_rates')
        .select('employee_id, employee_job_role_id, job_role_id, career_history_id, pay_rate, pay_type, effective_from, effective_to')
        .order('effective_from', { ascending: false });

      // Get unique job role IDs from shifts for fallback lookup
      const shiftJobRoleIds = [...new Set(shifts.map(s => s.job_role_id).filter(Boolean))] as string[];

      // Get job role default pay rates as a last resort
      const { data: jobRolesData } = shiftJobRoleIds.length > 0 
        ? await supabase.from('job_roles').select('id, pay_rate').in('id', shiftJobRoleIds)
        : { data: [] };

      // Get career history for job titles only
      const { data: careerHistory } = await supabase
        .from('career_history')
        .select('employee_id, job_title, job_role_id, start_date, end_date')
        .in('employee_id', employeeIds)
        .is('end_date', null);
      
      // Create employee lookup map
      const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);
      const jobRolePayMap = new Map<string, number>(jobRolesData?.map(jr => [jr.id, jr.pay_rate || 0] as [string, number]) || []);

      // Helper: find the effective pay rate for a shift based on its job_role_id and date
      const getEffectivePayRate = (empId: string, shiftDate: string, jobRoleId?: string | null): number => {
        if (!payRatesData) return 0;
        
        // 1. Try to find a pay_rate record matching this job_role_id (via career_history_id link) for this employee on this date
        if (jobRoleId) {
          // Look for rates linked to a career_history entry that matches this job_role_id for this employee
          const roleRate = payRatesData.find(r => {
            // Direct job_role_id match on the pay_rate record
            if (r.job_role_id === jobRoleId && r.employee_id === empId &&
                r.effective_from <= shiftDate && (!r.effective_to || r.effective_to > shiftDate)) {
              return true;
            }
            return false;
          });
          if (roleRate) return roleRate.pay_rate;

          // Try career_history-linked rates for this employee where the career entry has this job_role_id
          const careerEntries = careerHistory?.filter(ch => ch.employee_id === empId && ch.job_role_id === jobRoleId) || [];
          for (const ce of careerEntries) {
            const chRate = payRatesData.find(r =>
              r.career_history_id === (ce as any).id &&
              r.effective_from <= shiftDate && (!r.effective_to || r.effective_to > shiftDate)
            );
            if (chRate) return chRate.pay_rate;
          }
        }
        
        // 2. Fallback: any active rate for this employee on this date
        const empRate = payRatesData.find(r => 
          r.employee_id === empId &&
          r.effective_from <= shiftDate && (!r.effective_to || r.effective_to > shiftDate)
        );
        if (empRate) return empRate.pay_rate;

        // 3. Last resort: job_role default pay_rate from job_roles table
        if (jobRoleId && jobRolePayMap.has(jobRoleId)) {
          return jobRolePayMap.get(jobRoleId) || 0;
        }

        return 0;
      };
      
      // Process the data - create detailed records with time segments
      const processedData: HoursRecord[] = [];
      
      for (const shift of shifts) {
        const employee = employeeMap.get(shift.employee_id);
        
        if (!employee) {
          console.log('Missing employee for shift:', shift.employee_id);
          continue;
        }
        
        // Calculate scheduled hours
        const shiftStart = parseISO(`${shift.date}T${shift.start_time}`);
        const shiftEnd = parseISO(`${shift.date}T${shift.end_time}`);
        const scheduledMinutes = differenceInMinutes(shiftEnd, shiftStart);
        const scheduledHours = Math.round((scheduledMinutes / 60) * 100) / 100;
        
        // Get time clock record if exists
        const timeRecord = timeRecords?.find(tr => tr.shift_id === shift.id);
        
        // Get pay rate - use shift override first, then date-based lookup from pay_rates table
        const employeeCareer = careerHistory?.find(ch => ch.employee_id === employee.id);
        const payRate = shift.pay_rate || getEffectivePayRate(employee.id, shift.date, shift.job_role_id) || 0;
        const jobTitle = shift.position || employeeCareer?.job_title || 'Unknown';
        
        let hasIssue = false;
        let issueType = '';
        let exceptionStatus = '';
        
        if (timeRecord) {
          exceptionStatus = timeRecord.approval_status || 'pending';
          
          // Check if shift has ended and no clock times - only then mark as discrepancy
          const now = new Date();
          const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
          
          if (!timeRecord.clock_in_time && !timeRecord.clock_out_time && now > shiftEndTime) {
            hasIssue = true;
            issueType = 'Did not clock in';
          } else if (timeRecord.clock_in_time && !timeRecord.clock_out_time && now > shiftEndTime) {
            hasIssue = true;
            issueType = 'Missing clock out';
          } else if (timeRecord.discrepancy_type && exceptionStatus !== 'approved') {
            hasIssue = true;
            issueType = timeRecord.discrepancy_type;
          }
          
          // Process time segments if they exist
          if (timeRecord.time_segments && timeRecord.time_segments.length > 0) {
            for (const segment of timeRecord.time_segments as any[]) {
              const segmentHours = Math.round(((segment.minutes_worked || 0) / 60) * 100) / 100;
              const paidHours = Math.round(((segment.minutes_paid || 0) / 60) * 100) / 100;
              const totalPay = paidHours * payRate;
              
              let segmentDescription = '';
              switch (segment.segment_type) {
                case 'early_overtime':
                  segmentDescription = segment.pay_status === 'paid' ? 'Paid overtime (early)' : 
                                      segment.pay_status === 'unpaid' ? 'Unpaid overtime (early)' : 'Pending overtime (early)';
                  break;
                case 'scheduled':
                  segmentDescription = 'Scheduled time';
                  break;
                case 'late_overtime':
                  segmentDescription = segment.pay_status === 'paid' ? 'Paid overtime (late)' : 
                                      segment.pay_status === 'unpaid' ? 'Unpaid overtime (late)' : 'Pending overtime (late)';
                  break;
              }
              
              processedData.push({
                employee_id: employee.id,
                employee_name: `${employee.first_name} ${employee.last_name}`,
                position: shift.position || employee.department || 'Unknown',
                job_title: jobTitle,
                date: shift.date,
                shift_start: shift.start_time,
                shift_end: shift.end_time,
                clock_in: timeRecord.clock_in_time || null,
                clock_out: timeRecord.clock_out_time || null,
                scheduled_hours: segment.segment_type === 'scheduled' ? segmentHours : 0,
                paid_hours: paidHours,
                pay_rate: payRate,
                total_pay: totalPay,
                has_issue: hasIssue && segment.segment_type === 'scheduled', // Only show issue on main scheduled row
                issue_type: issueType,
                exception_status: exceptionStatus,
                segment_type: segment.segment_type,
                segment_description: segmentDescription
              });
            }
          } else {
            // No segments - create basic record
            let paidHours = 0;
            
            if (timeRecord.clock_in_time && timeRecord.clock_out_time) {
              const clockIn = parseISO(timeRecord.clock_in_time);
              const clockOut = parseISO(timeRecord.clock_out_time);
              const actualMinutes = differenceInMinutes(clockOut, clockIn);
              
              // If processed and approved, use processed paid time
              if ((timeRecord as any).processed_at && exceptionStatus === 'approved') {
                paidHours = Math.round((((timeRecord as any).scheduled_minutes_paid || 0) + 
                                      ((timeRecord as any).early_minutes_paid || 0) + 
                                      ((timeRecord as any).late_minutes_paid || 0)) / 60 * 100) / 100;
              } else {
                // Default to actual worked hours if not processed
                paidHours = Math.round((actualMinutes / 60) * 100) / 100;
              }
            }
            
            const totalPay = paidHours * payRate;
            
            processedData.push({
              employee_id: employee.id,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: shift.position || employee.department || 'Unknown',
              job_title: jobTitle,
              date: shift.date,
              shift_start: shift.start_time,
              shift_end: shift.end_time,
              clock_in: timeRecord.clock_in_time || null,
              clock_out: timeRecord.clock_out_time || null,
              scheduled_hours: scheduledHours,
              paid_hours: paidHours,
              pay_rate: payRate,
              total_pay: totalPay,
              has_issue: hasIssue,
              issue_type: issueType,
              exception_status: exceptionStatus,
              segment_description: 'Full shift'
            });
          }
        } else {
          // No time record - check if shift has ended
          const now = new Date();
          const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
          
          if (now > shiftEndTime) {
            hasIssue = true;
            issueType = 'Did not clock in';
          } else {
            issueType = 'Scheduled';
          }
          
          processedData.push({
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            position: shift.position || employee.department || 'Unknown',
            job_title: jobTitle,
            date: shift.date,
            shift_start: shift.start_time,
            shift_end: shift.end_time,
            clock_in: null,
            clock_out: null,
            scheduled_hours: scheduledHours,
            paid_hours: 0, // No pay if didn't clock in
            pay_rate: payRate,
            total_pay: 0,
            has_issue: hasIssue,
            issue_type: issueType,
            exception_status: 'pending',
            segment_description: 'No time record'
          });
        }
      }
      
      console.log('Processed detailed hours data:', processedData.length, 'records');
      return processedData;
    }
  });

  const toggleColumn = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const exportToExcel = () => {
    if (!hoursData) return;
    
    const enabledCols = columns.filter(col => col.enabled);
    const exportData = hoursData.map(record => {
      const row: any = {};
      enabledCols.forEach(col => {
        switch (col.key) {
          case 'employee_name':
            row[col.label] = record.employee_name;
            break;
          case 'position':
            row[col.label] = record.job_title || record.position;
            break;
          case 'date':
            row[col.label] = format(parseISO(record.date), 'dd/MM/yyyy');
            break;
          case 'clock_times':
            row[col.label] = `${record.clock_in ? format(parseISO(record.clock_in), 'HH:mm') : 'N/A'} - ${record.clock_out ? format(parseISO(record.clock_out), 'HH:mm') : 'N/A'}`;
            break;
          case 'scheduled_hours':
            row[col.label] = record.scheduled_hours;
            break;
          case 'paid_hours':
            row[col.label] = record.paid_hours;
            break;
          case 'variance':
            row[col.label] = record.paid_hours - record.scheduled_hours;
            break;
          case 'pay_rate':
            row[col.label] = record.pay_rate;
            break;
          case 'total_pay':
            row[col.label] = record.total_pay;
            break;
          case 'segment_info':
            row[col.label] = record.segment_description;
            break;
        }
      });
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hours Analysis');
    
    const fileName = `hours-analysis-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const printReport = () => {
    window.print();
  };

  const getRowClassName = (record: HoursRecord) => {
    if (record.has_issue && record.exception_status !== 'approved') {
      return 'bg-red-50 border-l-4 border-l-red-500';
    }
    if (record.exception_status === 'approved') {
      return 'bg-green-50 border-l-4 border-l-green-500';
    }
    if (record.segment_type === 'early_overtime' || record.segment_type === 'late_overtime') {
      return 'bg-blue-50 border-l-4 border-l-blue-500';
    }
    return '';
  };

  const getIssueDisplay = (record: HoursRecord) => {
    if (!record.has_issue && record.exception_status !== 'approved') return null;
    
    if (record.exception_status === 'approved') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Exception Cleared
        </Badge>
      );
    }
    
    if (record.has_issue) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {record.issue_type}
        </Badge>
      );
    }

    return null;
  };

  const enabledColumns = columns.filter(col => col.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Hours Analysis Report
          </h2>
          <p className="text-gray-600 mt-1">Analyze paid hours by employees with detailed time segments</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!hoursData?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={printReport}
            disabled={!hoursData?.length}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Range and Settings */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="self-center">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.to, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Column Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customize Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={column.enabled}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <Label htmlFor={column.key} className="text-sm">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hours Report Table */}
      <Card>
        <CardContent className="p-0">
          {isLoadingHours ? (
            <div className="text-center py-8">Loading detailed hours analysis...</div>
          ) : !hoursData?.length ? (
            <div className="text-center py-8 text-gray-500">
              <p>No shifts found for the selected period</p>
              <p className="text-sm mt-2">
                Date range: {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {enabledColumns.map((column) => (
                    <TableHead key={column.key} style={{ width: column.width }}>
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hoursData.map((record, index) => (
                  <TableRow key={`${record.employee_id}-${record.date}-${index}`} className={getRowClassName(record)}>
                    {enabledColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.key === 'employee_name' && record.employee_name}
                        {column.key === 'position' && (record.job_title || record.position)}
                        {column.key === 'date' && format(parseISO(record.date), 'dd/MM/yyyy')}
                        {column.key === 'clock_times' && (
                          <div className="text-sm">
                            <div>In: {record.clock_in ? format(parseISO(record.clock_in), 'HH:mm') : 'N/A'}</div>
                            <div>Out: {record.clock_out ? format(parseISO(record.clock_out), 'HH:mm') : 'N/A'}</div>
                          </div>
                        )}
                        {column.key === 'scheduled_hours' && record.scheduled_hours.toFixed(2)}
                        {column.key === 'paid_hours' && record.paid_hours.toFixed(2)}
                        {column.key === 'variance' && (
                          <Badge variant={record.paid_hours - record.scheduled_hours >= 0 ? 'default' : 'destructive'}>
                            {(record.paid_hours - record.scheduled_hours).toFixed(2)}h
                          </Badge>
                        )}
                        {column.key === 'pay_rate' && `£${record.pay_rate.toFixed(2)}`}
                        {column.key === 'total_pay' && `£${record.total_pay.toFixed(2)}`}
                        {column.key === 'segment_info' && (
                          <Badge variant={record.segment_type === 'scheduled' ? 'default' : 'secondary'}>
                            {record.segment_description}
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {getIssueDisplay(record)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursAnalysisReport;
