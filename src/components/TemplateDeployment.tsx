
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { Calendar, Play } from "lucide-react";

interface TemplateDeploymentProps {
  templateId: string;
  templateName: string;
  repeatType: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  repeatInterval: number;
  isOpen: boolean;
  onClose: () => void;
}

const TemplateDeployment = ({ 
  templateId, 
  templateName, 
  repeatType, 
  repeatInterval,
  isOpen, 
  onClose 
}: TemplateDeploymentProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deploymentDate, setDeploymentDate] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );

  // Get template info including category
  const { data: templateInfo } = useQuery({
    queryKey: ['roster-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_templates')
        .select('*, roster_categories(name)')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId
  });

  const { data: templateAssignments } = useQuery({
    queryKey: ['template-assignments', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_template_assignments')
        .select('*')
        .eq('roster_template_id', templateId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId
  });

  const { data: shiftTemplates } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const deployTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!templateAssignments || templateAssignments.length === 0) {
        throw new Error("No template assignments found to deploy");
      }

      const startDate = parseISO(deploymentDate);
      
      // Calculate period length
      let periodDays = 7;
      switch (repeatType) {
        case 'bi_weekly': periodDays = 14; break;
        case 'monthly': periodDays = 28; break;
        case 'custom': periodDays = repeatInterval * 7; break;
      }

      const endDate = format(addDays(startDate, periodDays - 1), 'yyyy-MM-dd');

      // Create shifts for the period
      const shiftsToCreate = templateAssignments.map((assignment: any) => {
        const shiftDate = format(addDays(startDate, assignment.day_of_period || 0), 'yyyy-MM-dd');
        const shiftTemplate = shiftTemplates?.find(st => st.id === assignment.shift_template_id);
        
        return {
          employee_id: assignment.employee_id,
          date: shiftDate,
          start_time: shiftTemplate?.start_time || '09:00',
          end_time: shiftTemplate?.end_time || '17:00',
          position: shiftTemplate?.position || 'General',
          job_role_id: null,
          roster_template_id: templateId,
        };
      });

      // Check for existing shifts in the date range to avoid conflicts
      const { data: existingShifts, error: checkError } = await supabase
        .from('shifts')
        .select('date, employee_id')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', endDate);

      if (checkError) throw checkError;

      // Filter out conflicting shifts
      const nonConflictingShifts = shiftsToCreate.filter(newShift => 
        !existingShifts?.some(existing => 
          existing.date === newShift.date && existing.employee_id === newShift.employee_id
        )
      );

      if (nonConflictingShifts.length !== shiftsToCreate.length) {
        const conflictCount = shiftsToCreate.length - nonConflictingShifts.length;
        console.log(`Skipping ${conflictCount} conflicting shifts`);
      }

      // Insert non-conflicting shifts
      if (nonConflictingShifts.length > 0) {
        const { error: shiftsError } = await supabase
          .from('shifts')
          .insert(nonConflictingShifts);
        
        if (shiftsError) throw shiftsError;
      }

      // Record the deployment
      const { error: recordError } = await supabase
        .from('applied_roster_templates')
        .insert([{
          roster_template_id: templateId,
          applied_date: format(startDate, 'yyyy-MM-dd'),
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: endDate
        }]);
      
      if (recordError) throw recordError;

      return { 
        deployed: nonConflictingShifts.length, 
        skipped: shiftsToCreate.length - nonConflictingShifts.length 
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['applied-templates'] });
      
      const message = result.skipped > 0 
        ? `Template deployed! ${result.deployed} shifts created, ${result.skipped} existing shifts skipped.`
        : `Template deployed successfully! ${result.deployed} shifts created.`;
        
      toast({ title: message });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Error deploying template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getPeriodDays = () => {
    switch (repeatType) {
      case 'weekly': return 7;
      case 'bi_weekly': return 14;
      case 'monthly': return 28;
      case 'custom': return repeatInterval * 7;
      default: return 7;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy Template: {templateName}</DialogTitle>
          <DialogDescription>
            Choose the start date to deploy this template to the actual roster.
            This will create shifts for {getPeriodDays()} days starting from your selected date.
            {templateInfo?.roster_categories && (
              <span className="block mt-2 text-sm">
                Category: <strong>{templateInfo.roster_categories.name}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="deployment-date">Start Date</Label>
            <Input
              id="deployment-date"
              type="date"
              value={deploymentDate}
              onChange={(e) => setDeploymentDate(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Template will be deployed from {deploymentDate} to {' '}
              {format(addDays(parseISO(deploymentDate), getPeriodDays() - 1), 'yyyy-MM-dd')}
            </p>
          </div>

          {templateAssignments && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                This template contains {templateAssignments.length} shift assignments.
                Any existing shifts for the same employee on the same day will be skipped.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => deployTemplateMutation.mutate()}
              disabled={deployTemplateMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              Deploy Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDeployment;
