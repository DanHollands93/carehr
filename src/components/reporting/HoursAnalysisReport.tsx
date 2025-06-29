
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
  actual_hours: number;
  pay_rate: number;
  total_pay: number;
  has_issue: boolean;
  issue_type?: string;
  exception_status?: string;
  job_title?: string;
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
  { key: 'actual_hours', label: 'Actual Hours', enabled: true, width: '120px' },
  { key: 'variance', label: 'Variance', enabled: true, width: '100px' },
  { key: 'pay_rate', label: 'Pay Rate', enabled: true, width: '100px' },
  { key: 'total_pay', label: 'Total Pay', enabled: true, width: '120px' }
];

const HoursAnalysisReport = () => {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch hours data including all shifts
  const { data: hoursData, isLoading: isLoadingHours } = useQuery({
    queryKey: ['hours-analysis', dateRange.from, dateRange.to],
    queryFn: async () => {
      console.log('Fetching hours analysis data for date range:', {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // First, get all shifts in the date range
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
      
      // Get time clock records for these shifts
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_clock_records')
        .select('*')
        .in('shift_id', shiftIds);
        
      if (timeError) {
        console.error('Error fetching time records:', timeError);
        // Don't throw here, just log - we can still show shifts without time records
      }
      
      // Get employee career history for pay rates
      const { data: careerHistory } = await supabase
        .from('career_history')
        .select('employee_id, pay_rate, job_title, start_date, end_date')
        .in('employee_id', employeeIds)
        .is('end_date', null); // Only current positions
      
      // Create employee lookup map
      const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);
      
      // Process the data - include ALL shifts
      const processedData: HoursRecord[] = shifts
        .map(shift => {
          const employee = employeeMap.get(shift.employee_id);
          
          if (!employee) {
            console.log('Missing employee for shift:', shift.employee_id);
            return null;
          }
          
          // Calculate scheduled hours
          const shiftStart = parseISO(`${shift.date}T${shift.start_time}`);
          const shiftEnd = parseISO(`${shift.date}T${shift.end_time}`);
          const scheduledMinutes = differenceInMinutes(shiftEnd, shiftStart);
          const scheduledHours = Math.round((scheduledMinutes / 60) * 100) / 100;
          
          // Get time clock record if exists
          const timeRecord = timeRecords?.find(tr => tr.shift_id === shift.id);
          
          let actualHours = 0;
          let hasIssue = false;
          let issueType = '';
          let exceptionStatus = '';
          
          if (timeRecord) {
            // Check if exception has been cleared
            exceptionStatus = timeRecord.approval_status || 'pending';
            
            if (timeRecord.clock_in_time && timeRecord.clock_out_time) {
              // Both times exist - calculate actual hours
              const clockIn = parseISO(timeRecord.clock_in_time);
              const clockOut = parseISO(timeRecord.clock_out_time);
              const actualMinutes = differenceInMinutes(clockOut, clockIn);
              actualHours = Math.round((actualMinutes / 60) * 100) / 100;
              
              // Check for discrepancies
              if (timeRecord.discrepancy_type && exceptionStatus !== 'approved') {
                hasIssue = true;
                issueType = timeRecord.discrepancy_type;
              }
            } else if (timeRecord.clock_in_time && !timeRecord.clock_out_time) {
              // Clocked in but not out
              hasIssue = true;
              issueType = 'Missing clock out';
            } else if (!timeRecord.clock_in_time && timeRecord.clock_out_time) {
              // Clocked out but not in (unusual)
              hasIssue = true;
              issueType = 'Missing clock in';
            } else {
              // No clock times at all
              const now = new Date();
              const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
              
              if (now > shiftEndTime) {
                hasIssue = true;
                issueType = 'Did not clock in';
              } else {
                issueType = 'Scheduled';
              }
            }
          } else {
            // No time record at all - check if shift time has passed
            const now = new Date();
            const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
            
            if (now > shiftEndTime) {
              hasIssue = true;
              issueType = 'Did not clock in';
            } else {
              issueType = 'Scheduled';
            }
          }

          // Get pay rate - prioritize career history, then shift pay_rate
          const employeeCareer = careerHistory?.find(ch => ch.employee_id === employee.id);
          const payRate = employeeCareer?.pay_rate || shift.pay_rate || 0;
          const totalPay = actualHours * payRate;
          
          const jobTitle = employeeCareer?.job_title || 'Unknown';
          
          return {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            position: shift.position || employee.department || 'Unknown',
            job_title: jobTitle,
            date: shift.date,
            shift_start: shift.start_time,
            shift_end: shift.end_time,
            clock_in: timeRecord?.clock_in_time || null,
            clock_out: timeRecord?.clock_out_time || null,
            scheduled_hours: scheduledHours,
            actual_hours: actualHours,
            pay_rate: payRate,
            total_pay: totalPay,
            has_issue: hasIssue,
            issue_type: issueType,
            exception_status: exceptionStatus
          };
        })
        .filter(Boolean) as HoursRecord[];
      
      console.log('Processed hours data:', processedData.length, 'records');
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
          case 'actual_hours':
            row[col.label] = record.actual_hours;
            break;
          case 'variance':
            row[col.label] = record.actual_hours - record.scheduled_hours;
            break;
          case 'pay_rate':
            row[col.label] = record.pay_rate;
            break;
          case 'total_pay':
            row[col.label] = record.total_pay;
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
          <p className="text-gray-600 mt-1">Analyze hours worked by employees across different roles</p>
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
            <div className="text-center py-8">Loading hours analysis...</div>
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
                  <TableRow key={`${record.employee_id}-${index}`} className={getRowClassName(record)}>
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
                        {column.key === 'actual_hours' && record.actual_hours.toFixed(2)}
                        {column.key === 'variance' && (
                          <Badge variant={record.actual_hours - record.scheduled_hours >= 0 ? 'default' : 'destructive'}>
                            {(record.actual_hours - record.scheduled_hours).toFixed(2)}h
                          </Badge>
                        )}
                        {column.key === 'pay_rate' && `£${record.pay_rate.toFixed(2)}`}
                        {column.key === 'total_pay' && `£${record.total_pay.toFixed(2)}`}
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
