
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';

const HRProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-06-15',
    address: '123 Main Street, Anytown, AN 12345',
    emergencyContact: 'Jane Doe - (555) 987-6543',
    department: 'Human Resources',
    jobTitle: 'HR Specialist',
    startDate: '2022-03-15',
    manager: 'Sarah Johnson'
  });

  const handleSave = () => {
    // Handle save logic here
    console.log('Profile updated:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data if needed
    setIsEditing(false);
  };

  const profileCompletion = 85;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Details</h1>
          <p className="text-gray-600 mt-1">View and update your personal information.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Profile {profileCompletion}% Complete
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Summary */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
            <p className="text-gray-600">{formData.jobTitle}</p>
            <p className="text-sm text-gray-500">{formData.department}</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Started {formData.startDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-3" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Primary emergency contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Contact Details</Label>
              <Textarea
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Your employment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} disabled />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={formData.jobTitle} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input value={formData.startDate} disabled />
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Input value={formData.manager} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRProfile;
