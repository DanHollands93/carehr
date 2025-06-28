
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmployeeFormData {
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  national_insurance_number: string;
  tax_code: string;
  passport_number: string;
  visa_expiry: string;
  right_to_work_status: string;
  
  // Address
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  country: string;
  
  // Bank Details
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code: string;
  
  // Emergency Contact
  emergency_name: string;
  emergency_phone: string;
  emergency_relationship: string;
  
  // Employment Details
  job_title: string;
  department: string;
  location: string;
  pay_rate: number;
  pay_type: 'salary' | 'hourly';
  hours_per_week: number;
  employment_type: 'permanent' | 'temporary' | 'contract' | 'internship';
  contract_type: 'full_time' | 'part_time' | 'zero_hours';
  start_date: string;
  probation_end_date: string;
  notice_period_weeks: number;
}

interface EmployeeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeForm = ({ onClose, onSuccess }: EmployeeFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmployeeFormData>();

  const payType = watch('pay_type');

  // Fetch lookup lists from settings
  const { data: lookupLists = [], isLoading: isLoadingLookups } = useQuery({
    queryKey: ['lookup-lists-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('*')
        .eq('is_active', true)
        .order('category, value');
      
      if (error) throw error;
      return data;
    }
  });

  // Group lookup lists by category
  const lookupsByCategory = lookupLists.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof lookupLists>);

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create employee record
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_number,
          date_of_birth: data.date_of_birth,
          national_insurance_number: data.national_insurance_number,
          tax_code: data.tax_code,
          passport_number: data.passport_number,
          visa_expiry: data.visa_expiry || null,
          right_to_work_status: data.right_to_work_status,
          department: data.department,
          hire_date: data.start_date,
          address: {
            line_1: data.address_line_1,
            line_2: data.address_line_2,
            city: data.city,
            postcode: data.postcode,
            country: data.country
          },
          bank_details: {
            bank_name: data.bank_name,
            account_holder_name: data.account_holder_name,
            account_number: data.account_number,
            sort_code: data.sort_code
          },
          emergency_contact: {
            name: data.emergency_name,
            phone: data.emergency_phone,
            relationship: data.emergency_relationship
          }
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Create career history record
      const { error: careerError } = await supabase
        .from('career_history')
        .insert({
          employee_id: employee.id,
          job_title: data.job_title,
          location: data.location,
          pay_rate: data.pay_rate,
          pay_type: data.pay_type,
          hours_per_week: data.hours_per_week,
          employment_type: data.employment_type,
          contract_type: data.contract_type,
          start_date: data.start_date,
          probation_end_date: data.probation_end_date || null,
          notice_period_weeks: data.notice_period_weeks,
          currency: 'GBP'
        });

      if (careerError) throw careerError;

      toast.success("Employee created successfully!");
      onSuccess();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error("Failed to create employee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingLookups) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Loading form data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="address">Address & Contact</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic personal details and identification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        {...register("first_name", { required: "First name is required" })}
                      />
                      {errors.first_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        {...register("last_name", { required: "Last name is required" })}
                      />
                      {errors.last_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: "Email is required" })}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input id="phone_number" {...register("phone_number")} />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="national_insurance_number">National Insurance Number</Label>
                      <Input id="national_insurance_number" {...register("national_insurance_number")} />
                    </div>
                    <div>
                      <Label htmlFor="tax_code">Tax Code</Label>
                      <Input id="tax_code" {...register("tax_code")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="passport_number">Passport Number</Label>
                      <Input id="passport_number" {...register("passport_number")} />
                    </div>
                    <div>
                      <Label htmlFor="visa_expiry">Visa Expiry</Label>
                      <Input id="visa_expiry" type="date" {...register("visa_expiry")} />
                    </div>
                    <div>
                      <Label htmlFor="right_to_work_status">Right to Work Status</Label>
                      <Select onValueChange={(value) => setValue('right_to_work_status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input id="address_line_1" {...register("address_line_1")} />
                  </div>
                  <div>
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input id="address_line_2" {...register("address_line_2")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register("city")} />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" {...register("postcode")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" defaultValue="United Kingdom" {...register("country")} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    <Input id="emergency_name" {...register("emergency_name")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_phone">Contact Phone</Label>
                      <Input id="emergency_phone" {...register("emergency_phone")} />
                    </div>
                    <div>
                      <Label htmlFor="emergency_relationship">Relationship</Label>
                      <Input id="emergency_relationship" {...register("emergency_relationship")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_title">Job Title *</Label>
                      <Select onValueChange={(value) => setValue('job_title', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job title" />
                        </SelectTrigger>
                        <SelectContent>
                          {lookupsByCategory.positions?.map((position) => (
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
                      <Label htmlFor="department">Department</Label>
                      <Select onValueChange={(value) => setValue('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {lookupsByCategory.departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.value}>
                              {dept.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Work Location</Label>
                    <Select onValueChange={(value) => setValue('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupsByCategory.locations?.map((location) => (
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
                          {lookupsByCategory.employment_types?.map((type) => (
                            <SelectItem key={type.id} value={type.value}>
                              {type.value}
                            </SelectItem>
                          ))}
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
                          {lookupsByCategory.contract_types?.map((type) => (
                            <SelectItem key={type.id} value={type.value}>
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
                        {...register("hours_per_week", { valueAsNumber: true })}
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
                      <Label htmlFor="probation_end_date">Probation End Date</Label>
                      <Input id="probation_end_date" type="date" {...register("probation_end_date")} />
                    </div>
                    <div>
                      <Label htmlFor="notice_period_weeks">Notice Period (weeks)</Label>
                      <Input
                        id="notice_period_weeks"
                        type="number"
                        {...register("notice_period_weeks", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pay Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pay_type">Pay Type</Label>
                      <Select onValueChange={(value) => setValue('pay_type', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pay type" />
                        </SelectTrigger>
                        <SelectContent>
                          {lookupsByCategory.pay_types?.map((type) => (
                            <SelectItem key={type.id} value={type.value.toLowerCase()}>
                              {type.value}
                            </SelectItem>
                          ))}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input id="bank_name" {...register("bank_name")} />
                  </div>
                  <div>
                    <Label htmlFor="account_holder_name">Account Holder Name</Label>
                    <Input id="account_holder_name" {...register("account_holder_name")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input id="account_number" {...register("account_number")} />
                    </div>
                    <div>
                      <Label htmlFor="sort_code">Sort Code</Label>
                      <Input id="sort_code" {...register("sort_code")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;
