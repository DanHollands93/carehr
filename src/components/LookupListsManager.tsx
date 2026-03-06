
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

interface LookupList {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
  created_at: string;
}

const LOOKUP_CATEGORIES = [
  { key: 'departments', label: 'Departments', description: 'Employee departments' },
  { key: 'locations', label: 'Locations', description: 'Work locations' },
  { key: 'employment_types', label: 'Employment Types', description: 'Full-time, Part-time, Contract, etc.' },
  { key: 'pay_types', label: 'Pay Types', description: 'Salary, Hourly, Commission, etc.' },
  { key: 'contract_types', label: 'Contract Types', description: 'Permanent, Temporary, Fixed-term, etc.' },
  { key: 'currencies', label: 'Currencies', description: 'Currency codes (USD, GBP, EUR, etc.)' },
  { key: 'positions', label: 'Positions', description: 'Job positions for shifts and roles' }
];

const LookupListsManager = ({ companyId: propCompanyId }: { companyId?: string } = {}) => {
  const { companyId: activeCompanyId } = useUserCompanyId();
  const companyId = propCompanyId || activeCompanyId;
  const [selectedCategory, setSelectedCategory] = useState(LOOKUP_CATEGORIES[0].key);
  const [newValue, setNewValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lookupItems = [], isLoading } = useQuery({
    queryKey: ['lookup-items', selectedCategory, companyId],
    queryFn: async () => {
      let query = supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', selectedCategory);
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('value');
      if (error) throw error;
      return data as LookupList[];
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (value: string) => {
      const insertData: any = { category: selectedCategory, value: value.trim(), is_active: true };
      if (companyId) insertData.company_id = companyId;
      const { data, error } = await supabase
        .from('lookup_lists')
        .insert([insertData]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-items', selectedCategory, companyId] });
      // Also invalidate positions query used by shift templates
      if (selectedCategory === 'positions') {
        queryClient.invalidateQueries({ queryKey: ['lookup-positions'] });
      }
      setNewValue("");
      toast({
        title: "Item added",
        description: "New lookup item has been added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive"
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-items', selectedCategory, companyId] });
      // Also invalidate positions query used by shift templates
      if (selectedCategory === 'positions') {
        queryClient.invalidateQueries({ queryKey: ['lookup-positions'] });
      }
      toast({
        title: "Item updated",
        description: "Item status has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive"
      });
    }
  });

  const handleAddItem = () => {
    if (!newValue.trim()) return;
    
    // Check for duplicates
    const exists = lookupItems.some(item => 
      item.value.toLowerCase() === newValue.trim().toLowerCase()
    );
    
    if (exists) {
      toast({
        title: "Duplicate item",
        description: "This item already exists in the list",
        variant: "destructive"
      });
      return;
    }
    
    addItemMutation.mutate(newValue);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const selectedCategoryInfo = LOOKUP_CATEGORIES.find(cat => cat.key === selectedCategory);
  const activeItems = lookupItems.filter(item => item.is_active);
  const inactiveItems = lookupItems.filter(item => !item.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Lookup Lists Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage dropdown options used throughout the application
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7">
          {LOOKUP_CATEGORIES.map(category => (
            <TabsTrigger key={category.key} value={category.key} className="text-xs">
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOOKUP_CATEGORIES.map(category => (
          <TabsContent key={category.key} value={category.key}>
            <Card>
              <CardHeader>
                <CardTitle>{category.label}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new item */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="new-value">Add New Item</Label>
                    <Input
                      id="new-value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={`Enter new ${category.label.toLowerCase().slice(0, -1)}`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddItem}
                      disabled={!newValue.trim() || addItemMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Items list */}
                {isLoading ? (
                  <div>Loading items...</div>
                ) : (
                  <div className="space-y-4">
                    {/* Active items */}
                    {activeItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2 flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          Active Items ({activeItems.length})
                        </h4>
                        <div className="grid gap-2">
                          {activeItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                              <div className="flex items-center gap-2">
                                <span>{item.value}</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              </div>
                              <Switch
                                checked={item.is_active}
                                onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                                disabled={toggleActiveMutation.isPending}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inactive items */}
                    {inactiveItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-600 mb-2 flex items-center">
                          <EyeOff className="w-4 h-4 mr-2" />
                          Inactive Items ({inactiveItems.length})
                        </h4>
                        <div className="grid gap-2">
                          {inactiveItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">{item.value}</span>
                                <Badge variant="outline" className="text-gray-600">
                                  Inactive
                                </Badge>
                              </div>
                              <Switch
                                checked={item.is_active}
                                onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                                disabled={toggleActiveMutation.isPending}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {lookupItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No items found. Add your first item above.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LookupListsManager;
