import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, subMinutes, addMinutes } from "date-fns";
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
      // Fetch employees for this company
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("company_id", companyId)
        .limit(10);

      if (empError) throw empError;
      if (!employees || employees.length === 0) {
        toast({ title: "No employees found", variant: "destructive" });
        return;
      }

      // Fetch job roles
      const { data: jobRoles } = await supabase
        .from("job_roles")
        .select("id, title")
        .eq("company_id", companyId)
        .limit(5);

      const defaultJobRoleId = jobRoles?.[0]?.id || null;

      const today = new Date();
      const shifts: any[] = [];
      const timeRecords: any[] = [];

      // Generate shifts for the past 7 days and next 7 days
      for (let dayOffset = -7; dayOffset <= 7; dayOffset++) {
        const date = addDays(today, dayOffset);
        const dateStr = format(date, "yyyy-MM-dd");
        const dow = date.getDay();
        if (dow === 0) continue; // skip Sundays

        // Assign shifts to employees
        for (let i = 0; i < Math.min(employees.length, 8); i++) {
          const emp = employees[i];

          // Vary shift times
          const shiftPatterns = [
            { start: "07:00", end: "15:00", position: "Morning" },
            { start: "09:00", end: "17:00", position: "Day" },
            { start: "14:00", end: "22:00", position: "Afternoon" },
            { start: "08:00", end: "16:00", position: "Standard" },
          ];
          const pattern = shiftPatterns[i % shiftPatterns.length];

          const shiftId = crypto.randomUUID();
          shifts.push({
            id: shiftId,
            employee_id: emp.id,
            date: dateStr,
            start_time: pattern.start,
            end_time: pattern.end,
            position: pattern.position,
            company_id: companyId,
            job_role_id: defaultJobRoleId,
          });

          // Only create time records for past days and today
          if (dayOffset <= 0) {
            const record = createTimeRecord(
              shiftId,
              emp.id,
              dateStr,
              pattern.start,
              pattern.end,
              companyId,
              i,
              dayOffset
            );
            if (record) timeRecords.push(record);
          }
        }
      }

      // Insert shifts in batches
      for (let i = 0; i < shifts.length; i += 50) {
        const batch = shifts.slice(i, i + 50);
        const { error } = await supabase.from("shifts").insert(batch);
        if (error) throw error;
      }

      // Insert time records in batches
      for (let i = 0; i < timeRecords.length; i += 50) {
        const batch = timeRecords.slice(i, i + 50);
        const { error } = await supabase.from("time_clock_records").insert(batch as any);
        if (error) throw error;
      }

      toast({
        title: "Demo data created!",
        description: `Generated ${shifts.length} shifts and ${timeRecords.length} time records`,
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
      // Delete time clock records first (FK dependency)
      const { error: tcrError } = await supabase
        .from("time_clock_records")
        .delete()
        .eq("company_id", companyId)
        .like("notes", "%demo%");

      // Delete all shifts for this company that have no roster_template_id (demo shifts)
      const { error: shiftError } = await supabase
        .from("shifts")
        .delete()
        .eq("company_id", companyId)
        .is("roster_template_id", null);

      if (tcrError) throw tcrError;
      if (shiftError) throw shiftError;

      toast({ title: "Demo data cleared" });
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
          Generate sample roster shifts and time clock records with various statuses
          (on-time, early, late, discrepancies, no-shows, etc.) for demonstration purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>This will create:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Shifts for the past 7 days and next 7 days</li>
            <li>Time records with: on-time clock in/out, early/late clock in, early/late clock out</li>
            <li>Discrepancy records, completed shifts, and scheduled (future) shifts</li>
            <li>Ad-hoc (unrostered) clock-ins</li>
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
              "Generate Demo Data"
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
                  This will remove demo time records and non-template shifts. Template-deployed shifts will not be affected.
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

function createTimeRecord(
  shiftId: string,
  employeeId: string,
  dateStr: string,
  startTime: string,
  endTime: string,
  companyId: string,
  employeeIndex: number,
  dayOffset: number
): any | null {
  // Use employee index + dayOffset to deterministically vary the scenario
  const scenario = Math.abs((employeeIndex * 7 + dayOffset * 3) % 8);

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const shiftStart = new Date(`${dateStr}T${startTime}:00`);
  const shiftEnd = new Date(`${dateStr}T${endTime}:00`);

  const base: any = {
    employee_id: employeeId,
    shift_id: shiftId,
    shift_date: dateStr,
    shift_start_time: startTime,
    shift_end_time: endTime,
    company_id: companyId,
    approval_status: "pending",
    notes: "demo",
  };

  switch (scenario) {
    case 0:
      // Perfect on-time clock in and out
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 2).toISOString(),
        clock_out_time: addMinutes(shiftEnd, -1).toISOString(),
        status: "completed",
        discrepancy_type: null,
      };

    case 1:
      // Early clock in (30 min early) - discrepancy
      return {
        ...base,
        clock_in_time: subMinutes(shiftStart, 30).toISOString(),
        clock_out_time: addMinutes(shiftEnd, 3).toISOString(),
        status: "discrepancy",
        discrepancy_type: "early_clock_in",
      };

    case 2:
      // Late clock in (25 min late) - discrepancy
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 25).toISOString(),
        clock_out_time: addMinutes(shiftEnd, 5).toISOString(),
        status: "discrepancy",
        discrepancy_type: "late_clock_in",
      };

    case 3:
      // Early clock out (45 min early) - discrepancy
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 1).toISOString(),
        clock_out_time: subMinutes(shiftEnd, 45).toISOString(),
        status: "discrepancy",
        discrepancy_type: "early_clock_out",
      };

    case 4:
      // Late clock out (40 min late) - discrepancy
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, -3).toISOString(),
        clock_out_time: addMinutes(shiftEnd, 40).toISOString(),
        status: "discrepancy",
        discrepancy_type: "late_clock_out",
      };

    case 5:
      // Double discrepancy: late in + early out
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 20).toISOString(),
        clock_out_time: subMinutes(shiftEnd, 35).toISOString(),
        status: "discrepancy",
        discrepancy_type: "late_clock_in,early_clock_out",
      };

    case 6:
      // Clocked in but not yet out (only for today)
      if (dayOffset === 0) {
        return {
          ...base,
          clock_in_time: addMinutes(shiftStart, 5).toISOString(),
          clock_out_time: null,
          status: "clocked_in",
          discrepancy_type: null,
        };
      }
      // Past day - completed on time
      return {
        ...base,
        clock_in_time: addMinutes(shiftStart, 0).toISOString(),
        clock_out_time: addMinutes(shiftEnd, 0).toISOString(),
        status: "completed",
        discrepancy_type: null,
      };

    case 7:
      // No-show: scheduled but never clocked in (only meaningful for past)
      if (dayOffset < 0) {
        return {
          ...base,
          clock_in_time: null,
          clock_out_time: null,
          status: "scheduled",
          discrepancy_type: null,
        };
      }
      // Today/future - just scheduled
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
