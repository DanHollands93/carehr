
import { useState, useMemo } from "react";
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
import { format, parseISO, differenceInMinutes, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, Download, Printer, Settings, BarChart3 } from "lucide-react";
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
  pay_rate?: number;
  total_pay?: number;
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
  { key: 'scheduled_hours', label: 'Scheduled Hours', enabled: true, width: '130px' },
  { key: 'actual_hours', label: 'Actual Hours', enabled: true, width: '120px' },
  { key: 'variance', label: 'Variance', enabled: true, width: '100px' },
  { key: 'pay_rate', label: 'Pay Rate', enabled: false, width: '100px' },
  { key: 'total_pay', label: 'Total Pay', enabled: false, width: '120px' }
];

const HoursAnalysisReport = () => {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [showSettings, setShowSettings] = useState(false);

  const { data: hoursData, isLoading } = useQuery({
    queryKey: ['hours-analysis', dateRange.from, dateRange.to],
    queryFn: async () => {
      console.log('Fetching hours analysis data...');
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Get time clock records with employee and shift data
      const { data: records, error } = await supabase
        .from('time_clock_records')
        .select(`
          id,
          employee_id,
          clock_in_time,
          clock_out_time,
          status,
          shift_id
        `)
        .not('clock_in_time', 'is', null)
        .not('clock_out_time', 'is', null)
        .eq('status', 'completed');
        
      if (error) throw error;
      
      if (!records?.length) return [];
      
      // Get employee data
      const employeeIds = [...new Set(records.map(r => r.employee_id))];
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .in('id', employeeIds);
        
      if (empError) throw empError;
      
      // Get shift data
      const shiftIds = [...new Set(records.map(r => r.shift_id).filter(Boolean))];
      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time, position')
        .in('id', shiftIds)
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (shiftError) throw shiftError;
      
      // Create lookup maps
      const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);
      const shiftMap = new Map(shifts?.map(shift => [shift.id, shift]) || []);
      
      // Process the data
      const processedData: HoursRecord[] = records
        .map(record => {
          const employee = employeeMap.get(record.employee_id);
          const shift = shiftMap.get(record.shift_id || '');
          
          if (!employee || !shift || !record.clock_in_time || !record.clock_out_time) {
            return null;
          }
          
          // Calculate hours
          const shiftStart = parseISO(`${shift.date}T${shift.start_time}`);
          const shiftEnd = parseISO(`${shift.date}T${shift.end_time}`);
          const clockIn = parseISO(record.clock_in_time);
          const clockOut = parseISO(record.clock_out_time);
          
          const scheduledMinutes = differenceInMinutes(shiftEnd, shiftStart);
          const actualMinutes = differenceInMinutes(clockOut, clockIn);
          
          const scheduledHours = Math.round((scheduledMinutes / 60) * 100) / 100;
          const actualHours = Math.round((actualMinutes / 60) * 100) / 100;
          
          return {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            position: shift.position || employee.department || 'Unknown',
            date: shift.date,
            shift_start: shift.start_time,
            shift_end: shift.end_time,
            clock_in: record.clock_in_time,
            clock_out: record.clock_out_time,
            scheduled_hours: scheduledHours,
            actual_hours: actualHours,
            pay_rate: 0, // This would come from employee pay rates if available
            total_pay: 0
          };
        })
        .filter(Boolean) as HoursRecord[];
      
      console.log('Processed hours data:', processedData);
      return processedData;
    }
  });

  // Group data by employee for summary rows
  const groupedData = useMemo(() => {
    if (!hoursData) return {};
    
    const groups: Record<string, HoursRecord[]> = {};
    hoursData.forEach(record => {
      const key = record.employee_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });
    
    return groups;
  }, [hoursData]);

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
            row[col.label] = record.position;
            break;
          case 'date':
            row[col.label] = format(parseISO(record.date), 'dd/MM/yyyy');
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
            row[col.label] = record.pay_rate || 0;
            break;
          case 'total_pay':
            row[col.label] = record.total_pay || 0;
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

  const enabledColumns = columns.filter(col => col.enabled);

  return (
    <div className="space-y-6">
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

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Loading hours analysis...</div>
          ) : !hoursData?.length ? (
            <div className="text-center py-8 text-gray-500">
              No time clock data found for the selected period
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedData).map(([employeeId, records]) => {
                  const totalScheduled = records.reduce((sum, r) => sum + r.scheduled_hours, 0);
                  const totalActual = records.reduce((sum, r) => sum + r.actual_hours, 0);
                  const totalVariance = totalActual - totalScheduled;
                  
                  return (
                    <React.Fragment key={employeeId}>
                      {records.map((record, index) => (
                        <TableRow key={`${employeeId}-${index}`}>
                          {enabledColumns.map((column) => (
                            <TableCell key={column.key}>
                              {column.key === 'employee_name' && record.employee_name}
                              {column.key === 'position' && record.position}
                              {column.key === 'date' && format(parseISO(record.date), 'dd/MM/yyyy')}
                              {column.key === 'scheduled_hours' && record.scheduled_hours.toFixed(2)}
                              {column.key === 'actual_hours' && record.actual_hours.toFixed(2)}
                              {column.key === 'variance' && (
                                <Badge variant={record.actual_hours - record.scheduled_hours >= 0 ? 'default' : 'destructive'}>
                                  {(record.actual_hours - record.scheduled_hours).toFixed(2)}h
                                </Badge>
                              )}
                              {column.key === 'pay_rate' && `£${record.pay_rate?.toFixed(2) || '0.00'}`}
                              {column.key === 'total_pay' && `£${record.total_pay?.toFixed(2) || '0.00'}`}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {/* Employee Total Row */}
                      <TableRow className="bg-gray-50 font-medium">
                        {enabledColumns.map((column) => (
                          <TableCell key={column.key}>
                            {column.key === 'employee_name' && `${records[0].employee_name} - Total`}
                            {column.key === 'position' && 'All Roles'}
                            {column.key === 'date' && ''}
                            {column.key === 'scheduled_hours' && `${totalScheduled.toFixed(2)}h`}
                            {column.key === 'actual_hours' && `${totalActual.toFixed(2)}h`}
                            {column.key === 'variance' && (
                              <Badge variant={totalVariance >= 0 ? 'default' : 'destructive'}>
                                {totalVariance.toFixed(2)}h
                              </Badge>
                            )}
                            {column.key === 'pay_rate' && ''}
                            {column.key === 'total_pay' && `£${records.reduce((sum, r) => sum + (r.total_pay || 0), 0).toFixed(2)}`}
                          </TableCell>
                        ))}
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursAnalysisReport;
