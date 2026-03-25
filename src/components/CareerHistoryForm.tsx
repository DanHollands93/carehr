import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CareerHistoryFormData {
  job_title: string;
  location: string;
  start_date: string;
  end_date: string;
  employment_type: 'permanent' | 'temporary' | 'contract' | 'internship';
  contract_type: 'full_time' | 'part_time' | 'zero_hours';
  hours_per_week: number;
  probation_end_date: string;
  notice_period_weeks: number;
}

interface CareerHistoryRecord {
  id: string;
  employee_id: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date?: string;
  pay_rate: number;
  pay_type: string;
  employment_type: string;
  contract_type: string;
  hours_per_week: number;
  probation_end_date?: string;
  notice_period_weeks: number;
  currency: string;
}

interface CareerHistoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  record?: CareerHistoryRecord;
}

const CareerHistoryForm = ({ onClose, onSuccess, employeeId, record }: CareerHistoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CareerHistoryFormData>();
  const isEditMode = !!record;

  const jobTitle = watch('job_title');
  const location = watch('location');
  const employmentType = watch('employment_type');
  const contractType = watch('contract_type');

  // Fetch lookup lists: company-specific + system defaults, excluding hidden
  const { data: lookupLists = [], isLoading: isLoadingLookups } = useQuery({
    queryKey: ['lookup-lists-all', companyId],
    queryFn: async () => {
      const [companyRes, systemRes, hiddenRes] = await Promise.all([
        supabase.from('lookup_lists').select('*').eq('is_active', true).eq('company_id', companyId!).order('category, value'),
        supabase.from('lookup_lists').select('*').eq('is_active', true).is('company_id', null).order('category, value'),
        supabase.from('company_hidden_defaults').select('record_id').eq('company_id', companyId!).eq('table_name', 'lookup_lists'),
      ]);
      if (companyRes.error) throw companyRes.error;
      if (systemRes.error) throw systemRes.error;
      const hiddenIds = (hiddenRes.data || []).map(d => d.record_id);
      const visibleSystem = (systemRes.data || []).filter(i => !hiddenIds.includes(i.id));
      return [...visibleSystem, ...(companyRes.data || [])];
    },
    enabled: !!companyId,
  });

  // Group lookup lists by category
  const lookupsByCategory = lookupLists.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof lookupLists>);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && record) {
      setValue('job_title', record.job_title || '');
      setValue('location', record.location || '');
      setValue('start_date', record.start_date?.split('T')[0] || '');
      setValue('end_date', record.end_date?.split('T')[0] || '');
      setValue('employment_type', record.employment_type as any || 'permanent');
      setValue('contract_type', record.contract_type as any || 'full_time');
      setValue('hours_per_week', record.hours_per_week || 40);
      setValue('probation_end_date', record.probation_end_date || '');
      setValue('notice_period_weeks', record.notice_period_weeks || 4);
    } else {
      setValue('employment_type', 'permanent');
      setValue('contract_type', 'full_time');
      setValue('hours_per_week', 40);
      setValue('notice_period_weeks', 4);
    }
  }, [isEditMode, record, setValue]);

  const onSubmit = async (data: CareerHistoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const careerData = {
        employee_id: employeeId,
        job_title: data.job_title,
        location: data.location,
        start_date: data.start_date,
        end_date: data.end_date || null,
        employment_type: data.employment_type,
        contract_type: data.contract_type,
        hours_per_week: data.hours_per_week || 40,
        probation_end_date: data.probation_end_date || null,
        notice_period_weeks: data.notice_period_weeks || 4,
      };

      if (isEditMode && record) {
        const { error } = await supabase
          .from('career_history')
          .update(careerData)
          .eq('id', record.id);

        if (error) throw error;
        toast.success("Career history updated successfully!");
      } else {
        const { error } = await supabase
          .from('career_history')
          .insert(careerData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Career history added successfully!");
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving career history:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} career history. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingLookups) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Loading form data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Career History' : 'Add Career History'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job_title">Job Title *</Label>
              <Select 
                value={jobTitle || ''} 
                onValueChange={(value) => setValue('job_title', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.positions?.map((position) => (
                    <SelectItem key={position.id} value={position.value}>
                      {position.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.job_title && (
                <p className="text-sm text-destructive mt-1">{errors.job_title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="location">Work Location *</Label>
              <Select 
                value={location || ''} 
                onValueChange={(value) => setValue('location', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select work location" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.locations?.map((location) => (
                    <SelectItem key={location.id} value={location.value}>
                      {location.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", { required: "Start date is required" })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select 
                value={employmentType || ''} 
                onValueChange={(value) => setValue('employment_type', value as any)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.employment_types?.map((type) => (
                    <SelectItem key={type.id} value={type.value.toLowerCase()}>
                      {type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select 
                value={contractType || ''} 
                onValueChange={(value) => setValue('contract_type', value as any)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.contract_types?.map((type) => (
                    <SelectItem key={type.id} value={type.value.toLowerCase().replace(' ', '_')}>
                      {type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hours_per_week">Hours per Week</Label>
              <Input
                id="hours_per_week"
                type="number"
                step="0.5"
                defaultValue="40"
                {...register("hours_per_week", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="probation_end_date">Probation End Date</Label>
              <Input id="probation_end_date" type="date" {...register("probation_end_date")} />
            </div>
            <div>
              <Label htmlFor="notice_period_weeks">Notice Period (weeks)</Label>
              <Input
                id="notice_period_weeks"
                type="number"
                defaultValue="4"
                {...register("notice_period_weeks", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update" : "Add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Career History Edit Form Component with dropdowns
export const CareerHistoryEditForm = ({ 
  entry, 
  onClose, 
  onSuccess 
}: { 
  entry: CareerHistoryRecord; 
  onClose: () => void; 
  onSuccess: (entry: CareerHistoryRecord) => void;
}) => {
  const [formData, setFormData] = useState<CareerHistoryRecord>(entry);

  const { companyId } = useUserCompanyId();
  const { data: lookupLists = [], isLoading: isLoadingLookups } = useQuery({
    queryKey: ['lookup-lists-all', companyId],
    queryFn: async () => {
      const [companyRes, systemRes, hiddenRes] = await Promise.all([
        supabase.from('lookup_lists').select('*').eq('is_active', true).eq('company_id', companyId!).order('category, value'),
        supabase.from('lookup_lists').select('*').eq('is_active', true).is('company_id', null).order('category, value'),
        supabase.from('company_hidden_defaults').select('record_id').eq('company_id', companyId!).eq('table_name', 'lookup_lists'),
      ]);
      if (companyRes.error) throw companyRes.error;
      if (systemRes.error) throw systemRes.error;
      const hiddenIds = (hiddenRes.data || []).map(d => d.record_id);
      const visibleSystem = (systemRes.data || []).filter(i => !hiddenIds.includes(i.id));
      return [...visibleSystem, ...(companyRes.data || [])];
    },
    enabled: !!companyId,
  });

  const lookupsByCategory = lookupLists.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof lookupLists>);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('career_history')
        .update({
          job_title: formData.job_title,
          location: formData.location,
          employment_type: formData.employment_type,
          contract_type: formData.contract_type,
          hours_per_week: formData.hours_per_week,
          start_date: formData.start_date,
          end_date: formData.end_date,
          probation_end_date: formData.probation_end_date,
          notice_period_weeks: formData.notice_period_weeks
        })
        .eq('id', formData.id);

      if (error) throw error;
      
      toast.success("Career history updated successfully!");
      onSuccess(formData);
    } catch (error) {
      console.error('Error updating career history:', error);
      toast.error("Failed to update career history. Please try again.");
    }
  };

  if (isLoadingLookups) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Loading form data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Career History Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Select 
                value={formData.job_title} 
                onValueChange={(value) => setFormData({ ...formData, job_title: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.positions?.map((position) => (
                    <SelectItem key={position.id} value={position.value}>
                      {position.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select work location" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.locations?.map((location) => (
                    <SelectItem key={location.id} value={location.value}>
                      {location.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select 
                value={formData.employment_type} 
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.employment_types?.map((type) => (
                    <SelectItem key={type.id} value={type.value.toLowerCase()}>
                      {type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select 
                value={formData.contract_type} 
                onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md max-h-60 z-50">
                  {lookupsByCategory.contract_types?.map((type) => (
                    <SelectItem key={type.id} value={type.value.toLowerCase().replace(' ', '_')}>
                      {type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="hours_per_week">Hours per Week</Label>
            <Input
              id="hours_per_week"
              type="number"
              step="0.5"
              value={formData.hours_per_week}
              onChange={(e) => setFormData({ ...formData, hours_per_week: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="probation_end_date">Probation End Date</Label>
              <Input
                id="probation_end_date"
                type="date"
                value={formData.probation_end_date || ''}
                onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="notice_period_weeks">Notice Period (weeks)</Label>
              <Input
                id="notice_period_weeks"
                type="number"
                value={formData.notice_period_weeks || ''}
                onChange={(e) => setFormData({ ...formData, notice_period_weeks: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple address form component
const AddressForm = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [addressData, setAddressData] = useState({
    line_1: '',
    line_2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleSave = () => {
    if (!addressData.line_1 || !addressData.city || !addressData.postcode || !addressData.start_date) {
      toast.error("Please fill in required fields (Address Line 1, City, Postcode, Start Date)");
      return;
    }
    onSave(addressData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="line_1">Address Line 1 *</Label>
        <Input
          id="line_1"
          value={addressData.line_1}
          onChange={(e) => setAddressData({...addressData, line_1: e.target.value})}
        />
      </div>
      <div>
        <Label htmlFor="line_2">Address Line 2</Label>
        <Input
          id="line_2"
          value={addressData.line_2}
          onChange={(e) => setAddressData({...addressData, line_2: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={addressData.city}
            onChange={(e) => setAddressData({...addressData, city: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={addressData.postcode}
            onChange={(e) => setAddressData({...addressData, postcode: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={addressData.country}
            onChange={(e) => setAddressData({...addressData, country: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={addressData.start_date}
            onChange={(e) => setAddressData({...addressData, start_date: e.target.value})}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Add Address
        </Button>
      </div>
    </div>
  );
};

export default CareerHistoryForm;
