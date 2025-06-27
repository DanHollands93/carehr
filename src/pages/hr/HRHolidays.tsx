
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

const HRHolidays = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Holiday request submitted:', formData);
    setShowRequestForm(false);
    setFormData({ startDate: '', endDate: '', reason: '', notes: '' });
  };

  const holidayRequests = [
    {
      id: 1,
      startDate: '2024-12-23',
      endDate: '2024-12-27',
      days: 5,
      reason: 'Christmas Holiday',
      status: 'pending',
      requestDate: '2024-12-10',
      notes: 'Family time during Christmas'
    },
    {
      id: 2,
      startDate: '2024-11-15',
      endDate: '2024-11-15',
      days: 1,
      reason: 'Personal Day',
      status: 'approved',
      requestDate: '2024-11-01',
      approvedBy: 'Sarah Manager',
      approvedDate: '2024-11-02'
    },
    {
      id: 3,
      startDate: '2024-10-10',
      endDate: '2024-10-12',
      days: 3,
      reason: 'Medical Appointment',
      status: 'approved',
      requestDate: '2024-09-25',
      approvedBy: 'Sarah Manager',
      approvedDate: '2024-09-26'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Requests</h1>
          <p className="text-gray-600 mt-1">Manage your holiday and time-off requests.</p>
        </div>
        <Button onClick={() => setShowRequestForm(!showRequestForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Holiday Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annual Allowance</p>
                <p className="text-2xl font-bold text-blue-600">25 days</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-orange-600">10 days</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-green-600">15 days</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Holiday Request</CardTitle>
            <CardDescription>Submit a new request for time off</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Annual Leave, Medical, Personal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Submit Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Your previous holiday requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holidayRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{request.reason}</h3>
                      <p className="text-sm text-gray-600">
                        {request.startDate} to {request.endDate} ({request.days} day{request.days > 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                {request.notes && (
                  <p className="text-sm text-gray-600 mb-2">{request.notes}</p>
                )}
                <div className="text-xs text-gray-500">
                  <p>Requested on: {request.requestDate}</p>
                  {request.approvedBy && (
                    <p>Approved by: {request.approvedBy} on {request.approvedDate}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRHolidays;
