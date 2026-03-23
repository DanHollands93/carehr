import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useToast } from "@/hooks/use-toast";
import { addMinutes, subMinutes } from "date-fns";
import { Loader2, Database, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DemoDataGenerator = () => {
  const { companyId } = useUserCompanyId();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const generateDemoData = async () => {
    if (!companyId) {
      toast({ title: "No company found", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Find existing shifts for this company (from deployed templates or manual)
      const today = new Date();
      const { data: existingShifts, error: shiftError } = await supabase
        .from("shifts")
        .select("id, employee_id, date, start_time, end_time, position, company_id")
        .eq("company_id", companyId)
        .order("date");

      if (shiftError) throw shiftError;

      if (!existingShifts || existingShifts.length === 0) {
        toast({ 
          title: "No shifts found", 
          description: "Deploy a roster template first, then generate demo clock data.",
          variant: "destructive" 
        });
        return;
      }

      // Filter to past shifts and today's shifts only for time records
      const todayStr = today.toISOString().split('T')[0];
      const pastAndTodayShifts = existingShifts.filter(s => s.date <= todayStr);

      if (pastAndTodayShifts.length === 0) {
        toast({ 
          title: "No past shifts found", 
          description: "Deploy a roster template with dates in the past to generate clock data.",
          variant: "destructive" 
        });
        return;
      }

      // Check which shifts already have time records
      const shiftIds = pastAndTodayShifts.map(s => s.id);
      const { data: existingRecords } = await supabase
        .from("time_clock_records")
        .select("shift_id")
        .in("shift_id", shiftIds.slice(0, 100));

      const existingShiftIds = new Set((existingRecords || []).map(r => r.shift_id));
      const shiftsNeedingRecords = pastAndTodayShifts.filter(s => !existingShiftIds.has(s.id));

      if (shiftsNeedingRecords.length === 0) {
        toast({ 
          title: "All shifts already have time records", 
          description: "Clear demo data first if you want to regenerate.",
        });
        return;
      }

      const timeRecords: any[] = [];

      shiftsNeedingRecords.forEach((shift, index) => {
        const isToday = shift.date === todayStr;
        const isPast = shift.date < todayStr;
        const record = createTimeRecord(shift, index, isToday, isPast);
        if (record) timeRecords.push(record);
      });

      // Insert time records in batches
      for (let i = 0; i < timeRecords.length; i += 50) {
        const batch = timeRecords.slice(i, i + 50);
        const { error } = await supabase.from("time_clock_records").insert(batch as any);
        if (error) throw error;
      }

      toast({
        title: "Demo clock data created!",
        description: `Generated ${timeRecords.length} time records for ${existingShifts.length} total shifts`,
      });
    } catch (error: any) {
      console.error("Error generating demo data:", error);
      toast({
        title: "Error generating demo data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDemoData = async () => {
    if (!companyId) return;
    setIsClearing(true);
    try {
      const { error: tcrError } = await supabase
        .from("time_clock_records")
        .delete()
        .eq("company_id", companyId)
        .like("notes", "%demo%");

      if (tcrError) throw tcrError;

      toast({ title: "Demo clock data cleared" });
    } catch (error: any) {
      toast({ title: "Error clearing data", description: error.message, variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Demo Data Generator
        </CardTitle>
        <CardDescription>
          Generate sample time clock records with various statuses for existing deployed roster shifts.
          Deploy a roster template first, then use this to populate clock-in/out data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>This will create time records for your deployed roster shifts including:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>On-time clock in/out (perfect attendance)</li>
            <li>Early/late clock in (25-30 min variance)</li>
            <li>Early/late clock out (35-45 min variance)</li>
            <li>Double discrepancies (late in + early out)</li>
            <li>Currently clocked in (for today's shifts)</li>
            <li>No-shows (scheduled but never clocked in)</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button onClick={generateDemoData} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Demo Clock Data"
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearing}>
                {isClearing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all demo time clock records. Deployed shifts will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearDemoData}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

interface ShiftData {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string | null;
  company_id: string;
}

function createTimeRecord(
  shift: ShiftData,
  index: number,
  isToday: boolean,
  isPast: boolean
): any | null {
  const scenario = Math.abs(index % 8);

  const shiftStart = new Date(`${shift.date}T${shift.start_time}:00`);
  const shiftEnd = new Date(`${shift.date}T${shift.end_time}:00`);

  const base: any = {
    employee_id: shift.employee_id,
    shift_id: shift.id,
    shift_date: shift.date,
    shift_start_time: shift.start_time,
    shift_end_time: shift.end_time,
    company_id: shift.company_id,
    approval_status: "pending",
    notes: "demo",
  };

  switch (scenario) {
    case 0:
      // Perfect on-time
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 2).toISOString(),
        clock_out_time: isToday ? null : addMinutes(shiftEnd, -1).toISOString(),
        status: isToday ? "clocked_in" : "completed",
        discrepancy_type: null,
      };

    case 1:
      // Early clock in (30 min early)
      return {
        ...base,
        clock_in_time: subMinutes(shiftStart, 30).toISOString(),
        clock_out_time: isToday ? null : addMinutes(shiftEnd, 3).toISOString(),
        status: isToday ? "clocked_in" : "discrepancy",
        discrepancy_type: isToday ? null : "early_clock_in",
      };

    case 2:
      // Late clock in (25 min late)
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 25).toISOString(),
        clock_out_time: isToday ? null : addMinutes(shiftEnd, 5).toISOString(),
        status: isToday ? "clocked_in" : "discrepancy",
        discrepancy_type: isToday ? null : "late_clock_in",
      };

    case 3:
      // Early clock out (45 min early)
      if (isToday) {
        return {
          ...base,
          clock_in_time: addMinutes(shiftStart, 1).toISOString(),
          clock_out_time: null,
          status: "clocked_in",
          discrepancy_type: null,
        };
      }
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 1).toISOString(),
        clock_out_time: subMinutes(shiftEnd, 45).toISOString(),
        status: "discrepancy",
        discrepancy_type: "early_clock_out",
      };

    case 4:
      // Late clock out (40 min late)
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, -3).toISOString(),
        clock_out_time: isToday ? null : addMinutes(shiftEnd, 40).toISOString(),
        status: isToday ? "clocked_in" : "discrepancy",
        discrepancy_type: isToday ? null : "late_clock_out",
      };

    case 5:
      // Double discrepancy: late in + early out
      if (isToday) {
        return {
          ...base,
          clock_in_time: addMinutes(shiftStart, 20).toISOString(),
          clock_out_time: null,
          status: "clocked_in",
          discrepancy_type: null,
        };
      }
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 20).toISOString(),
        clock_out_time: subMinutes(shiftEnd, 35).toISOString(),
        status: "discrepancy",
        discrepancy_type: "late_clock_in,early_clock_out",
      };

    case 6:
      // Clocked in but not yet out (today) or completed (past)
      if (isToday) {
        return {
          ...base,
          clock_in_time: addMinutes(shiftStart, 5).toISOString(),
          clock_out_time: null,
          status: "clocked_in",
          discrepancy_type: null,
        };
      }
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 0).toISOString(),
        clock_out_time: addMinutes(shiftEnd, 0).toISOString(),
        status: "completed",
        discrepancy_type: null,
      };

    case 7:
      // No-show: scheduled but never clocked in
      if (isPast) {
        return {
          ...base,
          clock_in_time: null,
          clock_out_time: null,
          status: "scheduled",
          discrepancy_type: null,
        };
      }
      return {
        ...base,
        clock_in_time: null,
        clock_out_time: null,
        status: "scheduled",
        discrepancy_type: null,
      };

    default:
      return null;
  }
}

export default DemoDataGenerator;
