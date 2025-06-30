import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Plus, Copy, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  date_of_birth: string;
  job_title: string;
  department: string;
  employment_status: string;
  salary: number;
  hire_date: string;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

interface CareerHistoryRecord {
  id?: string;
  employee_id: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date: string | null;
  pay_rate: number;
  currency: string;
  employment_type: string;
  pay_type: string;
  contract_type: string;
  hours_per_week: number;
  reporting_manager_id: string | null;
  probation_end_date: string | null;
  notice_period_weeks: number;
  job_role_id: string | null;
}

interface CareerHistoryEntry {
  job_title: string;
  location: string;
  start_date: string;
  end_date?: string;
  pay_rate: number;
  currency: string;
  employment_type: string;
  pay_type: string;
  contract_type: string;
  hours_per_week?: number;
  reporting_manager_id?: string;
  probation_end_date?: string;
  notice_period_weeks?: number;
  job_role_id?: string;
}

interface EmployeeDetailsProps {
  employeeId: string;
}

const EmployeeDetails = ({ employeeId }: EmployeeDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCareerHistoryOpen, setIsCareerHistoryOpen] = useState(false);
  const [editingCareerEntry, setEditingCareerEntry] = useState<CareerHistoryRecord | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [careerEntryToDelete, setCareerEntryToDelete] = useState<string | null>(null);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      
      if (error) throw error;
      return data as Employee;
    },
    enabled: !!employeeId
  });

  const { data: careerHistory, isLoading: isCareerHistoryLoading } = useQuery({
    queryKey: ['career-history', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_career_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as CareerHistoryRecord[];
    },
    enabled: !!employeeId
  });

  const { data: allEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data as { id: string; first_name: string; last_name: string }[];
    }
  });

  const { data: jobRoles } = useQuery({
    queryKey: ['job-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_roles')
        .select('id, title, department')
        .order('title');
      
      if (error) throw error;
      return data as { id: string; title: string; department: string }[];
    }
  });

  const createCareerHistory = useMutation({
    mutationFn: async (careerData: CareerHistoryRecord) => {
      const { data, error } = await supabase
        .from('employee_career_history')
        .insert([careerData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-history', employeeId] });
      toast({ title: "Career history entry created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating career history entry", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateCareerHistory = useMutation({
    mutationFn: async ({ id, ...careerData }: CareerHistoryRecord & { id: string }) => {
      const { error } = await supabase
        .from('employee_career_history')
        .update(careerData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-history', employeeId] });
      toast({ title: "Career history entry updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating career history entry", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteCareerHistory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_career_history')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-history', employeeId] });
      toast({ title: "Career history entry deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting career history entry", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmitCareerHistory = async (data: CareerHistoryEntry) => {
    if (!employee) return;

    try {
      const careerData: CareerHistoryRecord = {
        employee_id: employee.id,
        job_title: data.job_title,
        location: data.location,
        start_date: data.start_date,
        end_date: data.end_date || null,
        pay_rate: data.pay_rate,
        currency: data.currency,
        employment_type: data.employment_type,
        pay_type: data.pay_type,
        contract_type: data.contract_type,
        hours_per_week: data.hours_per_week || 40,
        reporting_manager_id: data.reporting_manager_id || null,
        probation_end_date: data.probation_end_date || null,
        notice_period_weeks: data.notice_period_weeks || 4,
        job_role_id: data.job_role_id || null
      };

      if (editingCareerEntry) {
        await updateCareerHistory.mutateAsync({
          id: editingCareerEntry.id,
          ...careerData
        });
      } else {
        await createCareerHistory.mutateAsync(careerData);
      }

      setIsCareerHistoryOpen(false);
      setEditingCareerEntry(null);
    } catch (error) {
      console.error('Error saving career history:', error);
    }
  };

  const handleEditCareerHistory = (entry: CareerHistoryRecord) => {
    setEditingCareerEntry(entry);
    setIsCareerHistoryOpen(true);
  };

  const handleDeleteCareerHistory = (id: string) => {
    setCareerEntryToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCareerHistory = async () => {
    if (careerEntryToDelete) {
      await deleteCareerHistory.mutateAsync(careerEntryToDelete);
      setShowDeleteConfirmation(false);
      setCareerEntryToDelete(null);
    }
  };

  const cancelDeleteCareerHistory = () => {
    setShowDeleteConfirmation(false);
    setCareerEntryToDelete(null);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return '-';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="text-center py-4">Employee not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
          <CardDescription>View and manage employee information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={employee.image_url || `https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.first_name + employee.last_name}`} />
              <AvatarFallback>{employee.first_name[0]}{employee.last_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{employee.first_name} {employee.last_name}</h2>
              <p className="text-gray-500">{employee.job_title} in {employee.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label>Email</Label>
              <Input type="email" value={employee.email} readOnly />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" value={employee.phone_number} readOnly />
            </div>
            <div>
              <Label>Address</Label>
              <Input type="text" value={employee.address} readOnly />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="text" value={formatDate(employee.date_of_birth)} readOnly />
            </div>
            <div>
              <Label>City</Label>
              <Input type="text" value={employee.city} readOnly />
            </div>
            <div>
              <Label>Country</Label>
              <Input type="text" value={employee.country} readOnly />
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input type="text" value={employee.postal_code} readOnly />
            </div>
            <div>
              <Label>Employment Status</Label>
              <Input type="text" value={employee.employment_status} readOnly />
            </div>
            <div>
              <Label>Salary</Label>
              <Input type="text" value={`£${employee.salary}`} readOnly />
            </div>
            <div>
              <Label>Hire Date</Label>
              <Input type="text" value={formatDate(employee.hire_date)} readOnly />
            </div>
            <div>
              <Label>Termination Date</Label>
              <Input type="text" value={formatDate(employee.termination_date)} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Career History</CardTitle>
            <Button size="sm" onClick={() => {
              setEditingCareerEntry(null);
              setIsCareerHistoryOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
          <CardDescription>Track employee's career progression within the company</CardDescription>
        </CardHeader>
        <CardContent>
          {isCareerHistoryLoading ? (
            <div className="text-center py-4">Loading career history...</div>
          ) : careerHistory && careerHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {careerHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.job_title}</TableCell>
                    <TableCell>{entry.location}</TableCell>
                    <TableCell>{formatDate(entry.start_date)}</TableCell>
                    <TableCell>{formatDate(entry.end_date)}</TableCell>
                    <TableCell>£{entry.pay_rate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCareerHistory(entry)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCareerHistory(entry.id || '')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No career history available for this employee.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCareerHistoryOpen} onOpenChange={setIsCareerHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCareerEntry ? 'Edit' : 'Add'} Career History Entry</DialogTitle>
            <DialogDescription>
              {editingCareerEntry ? 'Update the career history details.' : 'Add a new career history entry for this employee.'}
            </DialogDescription>
          </DialogHeader>
          <CareerHistoryForm
            onSubmit={handleSubmitCareerHistory}
            onClose={() => setIsCareerHistoryOpen(false)}
            editingEntry={editingCareerEntry}
            allEmployees={allEmployees}
            jobRoles={jobRoles}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this career history entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={cancelDeleteCareerHistory}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteCareerHistory} disabled={deleteCareerHistory.isLoading}>
              {deleteCareerHistory.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CareerHistoryFormProps {
  onSubmit: (data: CareerHistoryEntry) => Promise<void>;
  onClose: () => void;
  editingEntry: CareerHistoryRecord | null;
  allEmployees: { id: string; first_name: string; last_name: string }[] | undefined;
  jobRoles: { id: string; title: string; department: string }[] | undefined;
}

const CareerHistoryForm = ({ onSubmit, onClose, editingEntry, allEmployees, jobRoles }: CareerHistoryFormProps) => {
  const [formData, setFormData] = useState<CareerHistoryEntry>({
    job_title: editingEntry?.job_title || "",
    location: editingEntry?.location || "",
    start_date: editingEntry?.start_date || "",
    end_date: editingEntry?.end_date || "",
    pay_rate: editingEntry?.pay_rate || 0,
    currency: editingEntry?.currency || "GBP",
    employment_type: editingEntry?.employment_type || "Full-time",
    pay_type: editingEntry?.pay_type || "Hourly",
    contract_type: editingEntry?.contract_type || "Permanent",
    hours_per_week: editingEntry?.hours_per_week || 40,
    reporting_manager_id: editingEntry?.reporting_manager_id || "",
    probation_end_date: editingEntry?.probation_end_date || "",
    notice_period_weeks: editingEntry?.notice_period_weeks || 4,
    job_role_id: editingEntry?.job_role_id || ""
  });

  const [date, setDate] = useState<DateRange | undefined>({
    from: formData.start_date ? new Date(formData.start_date) : undefined,
    to: formData.end_date ? new Date(formData.end_date) : undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    setFormData({
      ...formData,
      start_date: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : "",
      end_date: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="job_title">Job Title</Label>
        <Input
          id="job_title"
          value={formData.job_title}
          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Start and End Dates</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "yyyy-MM-dd")} - ${format(date.to, "yyyy-MM-dd")}`
                ) : (
                  format(date.from, "yyyy-MM-dd")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pay_rate">Pay Rate</Label>
          <Input
            id="pay_rate"
            type="number"
            value={formData.pay_rate.toString()}
            onChange={(e) => setFormData({ ...formData, pay_rate: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="employment_type">Employment Type</Label>
        <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select employment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Full-time">Full-time</SelectItem>
            <SelectItem value="Part-time">Part-time</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Temporary">Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="pay_type">Pay Type</Label>
        <Select value={formData.pay_type} onValueChange={(value) => setFormData({ ...formData, pay_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select pay type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hourly">Hourly</SelectItem>
            <SelectItem value="Salary">Salary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="contract_type">Contract Type</Label>
        <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select contract type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Permanent">Permanent</SelectItem>
            <SelectItem value="Fixed-term">Fixed-term</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hours_per_week">Hours per Week</Label>
          <Input
            id="hours_per_week"
            type="number"
            value={formData.hours_per_week?.toString() || ""}
            onChange={(e) => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="notice_period_weeks">Notice Period (weeks)</Label>
          <Input
            id="notice_period_weeks"
            type="number"
            value={formData.notice_period_weeks?.toString() || ""}
            onChange={(e) => setFormData({ ...formData, notice_period_weeks: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reporting_manager_id">Reporting Manager</Label>
        <Select value={formData.reporting_manager_id} onValueChange={(value) => setFormData({ ...formData, reporting_manager_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select reporting manager" />
          </SelectTrigger>
          <SelectContent>
            {allEmployees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="job_role_id">Job Role</Label>
        <Select value={formData.job_role_id} onValueChange={(value) => setFormData({ ...formData, job_role_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select job role" />
          </SelectTrigger>
          <SelectContent>
            {jobRoles?.map((role) => (
              <SelectItem key={role.id} value={role.id}>{role.title} ({role.department})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="probation_end_date">Probation End Date</Label>
        <Input
          id="probation_end_date"
          type="date"
          value={formData.probation_end_date || ""}
          onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })}
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{editingEntry ? 'Update' : 'Create'} Entry</Button>
      </div>
    </form>
  );
};

export default EmployeeDetails;
