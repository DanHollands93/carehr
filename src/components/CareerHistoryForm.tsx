
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CareerHistoryFormData {
  job_title: string;
  location: string;
  pay_rate: number;
  pay_type: 'salary' | 'hourly';
  hours_per_week: number;
  employment_type: 'permanent' | 'temporary' | 'contract' | 'internship';
  contract_type: 'full_time' | 'part_time' | 'zero_hours';
  start_date: string;
  end_date?: string;
  probation_end_date?: string;
  notice_period_weeks: number;
}

interface CareerHistoryFormProps {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface LookupItem {
  id: string;
  value: string;
}

const CareerHistoryForm = ({ employeeId, onClose, onSuccess }: CareerHistoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupData, setLookupData] = useState<{
    positions: LookupItem[];
    locations: LookupItem[];
    employmentTypes: LookupItem[];
    contractTypes: LookupItem[];
    payTypes: LookupItem[];
  }>({
    positions: [],
    locations: [],
    employmentTypes: [],
    contractTypes: [],
    payTypes: []
  });
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CareerHistoryFormData>();

  const payType = watch('pay_type');

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const { data, error } = await supabase
          .from('lookup_lists')
          .select('id, category, value')
          .eq('is_active', true)
          .in('category', ['positions', 'locations', 'employment_types', 'contract_types', 'pay_types']);

        if (error) throw error;

        const groupedData = {
          positions: [],
          locations: [],
          employmentTypes: [],
          contractTypes: [],
          payTypes: []
        };

        data?.forEach(item => {
          switch (item.category) {
            case 'positions':
              groupedData.positions.push({ id: item.id, value: item.value });
              break;
            case 'locations':
              groupedData.locations.push({ id: item.id, value: item.value });
              break;
            case 'employment_types':
              groupedData.employmentTypes.push({ id: item.id, value: item.value });
              break;
            case 'contract_types':
              groupedData.contractTypes.push({ id: item.id, value: item.value });
              break;
            case 'pay_types':
              groupedData.payTypes.push({ id: item.id, value: item.value });
              break;
          }
        });

        setLookupData(groupedData);
      } catch (error) {
        console.error('Error fetching lookup data:', error);
        toast.error("Failed to load dropdown options");
      }
    };

    fetchLookupData();
  }, []);

  const onSubmit = async (data: CareerHistoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('career_history')
        .insert({
          employee_id: employeeId,
          job_title: data.job_title,
          location: data.location,
          pay_rate: data.pay_rate,
          pay_type: data.pay_type,
          hours_per_week: data.hours_per_week,
          employment_type: data.employment_type,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date || null,
          probation_end_date: data.probation_end_date || null,
          notice_period_weeks: data.notice_period_weeks,
          currency: 'GBP'
        });

      if (error) throw error;

      toast.success("Career history entry added successfully!");
      onSuccess();
    } catch (error) {
      console.error('Error adding career history:', error);
      toast.error("Failed to add career history entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Career History Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Details</CardTitle>
              <CardDescription>Enter the employment details for this position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Select onValueChange={(value) => setValue('job_title', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookupData.positions.map((position) => (
                      <SelectItem key={position.id} value={position.value}>
                        {position.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.job_title && (
                  <p className="text-sm text-red-600 mt-1">{errors.job_title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Work Location</Label>
                <Select onValueChange={(value) => setValue('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookupData.locations.map((location) => (
                      <SelectItem key={location.id} value={location.value}>
                        {location.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select onValueChange={(value) => setValue('employment_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.employmentTypes.length > 0 ? (
                        lookupData.employmentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.value.toLowerCase().replace(' ', '_')}>
                            {type.value}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <Select onValueChange={(value) => setValue('contract_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.contractTypes.length > 0 ? (
                        lookupData.contractTypes.map((type) => (
                          <SelectItem key={type.id} value={type.value.toLowerCase().replace(' ', '_')}>
                            {type.value}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="zero_hours">Zero Hours</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hours_per_week">Hours per Week</Label>
                  <Input
                    id="hours_per_week"
                    type="number"
                    step="0.5"
                    {...register("hours_per_week", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay_type">Pay Type</Label>
                  <Select onValueChange={(value) => setValue('pay_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pay type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.payTypes.length > 0 ? (
                        lookupData.payTypes.map((type) => (
                          <SelectItem key={type.id} value={type.value.toLowerCase()}>
                            {type.value}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="salary">Salary (Annual)</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pay_rate">
                    {payType === 'hourly' ? 'Hourly Rate (£)' : 'Annual Salary (£)'}
                  </Label>
                  <Input
                    id="pay_rate"
                    type="number"
                    step="0.01"
                    {...register("pay_rate", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register("start_date", { required: "Start date is required" })}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if current position</p>
                </div>
                <div>
                  <Label htmlFor="probation_end_date">Probation End Date</Label>
                  <Input id="probation_end_date" type="date" {...register("probation_end_date")} />
                </div>
              </div>

              <div>
                <Label htmlFor="notice_period_weeks">Notice Period (weeks)</Label>
                <Input
                  id="notice_period_weeks"
                  type="number"
                  defaultValue={4}
                  {...register("notice_period_weeks", { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CareerHistoryForm;
