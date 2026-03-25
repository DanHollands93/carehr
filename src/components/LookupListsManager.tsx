
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, EyeOff, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useHiddenDefaults } from "@/hooks/useSystemDefaults";

interface LookupList {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
  created_at: string;
  company_id: string | null;
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
  const { hiddenIds, toggleHidden } = useHiddenDefaults('lookup_lists');

  // Company-specific items
  const { data: companyItems = [], isLoading: loadingCompany } = useQuery({
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

  // System defaults (company_id IS NULL)
  const { data: systemItems = [], isLoading: loadingSystem } = useQuery({
    queryKey: ['lookup-items-system', selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', selectedCategory)
        .is('company_id', null)
        .order('sort_order');
      if (error) throw error;
      return data as LookupList[];
    }
  });

  const isLoading = loadingCompany || loadingSystem;

  const visibleSystemItems = systemItems.filter(item => !hiddenIds.includes(item.id));
  const hiddenSystemItems = systemItems.filter(item => hiddenIds.includes(item.id));
  const allItems = [...visibleSystemItems, ...companyItems];

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
      if (selectedCategory === 'positions') {
        queryClient.invalidateQueries({ queryKey: ['lookup-positions'] });
      }
      setNewValue("");
      toast({ title: "Item added", description: "New lookup item has been added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add item", variant: "destructive" });
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
      if (selectedCategory === 'positions') {
        queryClient.invalidateQueries({ queryKey: ['lookup-positions'] });
      }
      toast({ title: "Item updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update item", variant: "destructive" });
    }
  });

  const handleAddItem = () => {
    if (!newValue.trim()) return;
    
    const exists = allItems.some(item => 
      item.value.toLowerCase() === newValue.trim().toLowerCase()
    );
    
    if (exists) {
      toast({ title: "Duplicate item", description: "This item already exists in the list", variant: "destructive" });
      return;
    }
    
    addItemMutation.mutate(newValue);
  };

  const selectedCategoryInfo = LOOKUP_CATEGORIES.find(cat => cat.key === selectedCategory);
  const activeItems = allItems.filter(item => item.is_active !== false);
  const inactiveCompanyItems = companyItems.filter(item => !item.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Lookup Lists Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage dropdown options used throughout the application. System defaults are shared across all companies.
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
                    <Label htmlFor="new-value">Add Custom Item</Label>
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

                {isLoading ? (
                  <div>Loading items...</div>
                ) : (
                  <div className="space-y-4">
                    {activeItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2 flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          Active Items ({activeItems.length})
                        </h4>
                        <div className="grid gap-2">
                          {activeItems.map(item => {
                            const isSystem = item.company_id === null;
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                                <div className="flex items-center gap-2">
                                  <span>{item.value}</span>
                                  {isSystem && (
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                      <Globe className="w-2.5 h-2.5" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                {isSystem ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => toggleHidden({ recordId: item.id, hide: true })}
                                  >
                                    Hide
                                  </Button>
                                ) : (
                                  <Switch
                                    checked={item.is_active !== false}
                                    onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: item.id, isActive: checked })}
                                    disabled={toggleActiveMutation.isPending}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inactive company items */}
                    {inactiveCompanyItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2 flex items-center">
                          <EyeOff className="w-4 h-4 mr-2" />
                          Inactive Items ({inactiveCompanyItems.length})
                        </h4>
                        <div className="grid gap-2">
                          {inactiveCompanyItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <span className="text-muted-foreground">{item.value}</span>
                              <Switch
                                checked={false}
                                onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: item.id, isActive: checked })}
                                disabled={toggleActiveMutation.isPending}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden system defaults */}
                    {hiddenSystemItems.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Hidden Defaults ({hiddenSystemItems.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {hiddenSystemItems.map(item => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => toggleHidden({ recordId: item.id, hide: false })}
                            >
                              {item.value} <span className="text-muted-foreground ml-1">+ Show</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {allItems.length === 0 && (
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
