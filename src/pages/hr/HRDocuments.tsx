
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Search, Filter, Calendar } from 'lucide-react';

const HRDocuments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const documents = [
    {
      id: 1,
      title: 'Employee Handbook 2024',
      category: 'Policy',
      type: 'PDF',
      size: '2.3 MB',
      uploadDate: '2024-01-15',
      status: 'read',
      description: 'Complete guide to company policies and procedures'
    },
    {
      id: 2,
      title: 'Remote Work Policy',
      category: 'Policy',
      type: 'PDF',
      size: '856 KB',
      uploadDate: '2024-02-10',
      status: 'unread',
      description: 'Guidelines for remote work arrangements'
    },
    {
      id: 3,
      title: 'Holiday Calendar 2024',
      category: 'Schedule',
      type: 'PDF',
      size: '421 KB',
      uploadDate: '2024-01-05',
      status: 'read',
      description: 'Public holidays and company closure dates'
    },
    {
      id: 4,
      title: 'Benefits Summary',
      category: 'Benefits',
      type: 'PDF',
      size: '1.2 MB',
      uploadDate: '2024-01-20',
      status: 'read',
      description: 'Overview of employee benefits and perks'
    },
    {
      id: 5,
      title: 'Training Schedule Q1',
      category: 'Training',
      type: 'PDF',
      size: '678 KB',
      uploadDate: '2024-03-01',
      status: 'unread',
      description: 'Upcoming training sessions and workshops'
    },
    {
      id: 6,
      title: 'Code of Conduct',
      category: 'Policy',
      type: 'PDF',
      size: '945 KB',
      uploadDate: '2024-01-10',
      status: 'read',
      description: 'Professional conduct and ethics guidelines'
    }
  ];

  const categories = ['all', 'Policy', 'Benefits', 'Training', 'Schedule'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    return status === 'read' 
      ? <Badge variant="secondary" className="bg-green-100 text-green-800">Read</Badge>
      : <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Policy': 'bg-red-100 text-red-800',
      'Benefits': 'bg-green-100 text-green-800',
      'Training': 'bg-blue-100 text-blue-800',
      'Schedule': 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const unreadCount = documents.filter(doc => doc.status === 'unread').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Access company documents and policies.</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {unreadCount} new document{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <CardTitle className="text-base">{document.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                      {getStatusBadge(document.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                {document.description}
              </CardDescription>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{document.type} • {document.size}</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{document.uploadDate}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HRDocuments;
