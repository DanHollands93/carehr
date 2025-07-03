
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";

interface RosterTemplate {
  id: string;
  name: string;
  description: string;
  repeat_type: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  repeat_interval: number;
  end_date: string | null;
  is_active: boolean;
  category_id?: string;
}

interface ActiveRosterTemplatesProps {
  onDeployTemplate: (template: RosterTemplate) => void;
}

const ActiveRosterTemplates = ({ onDeployTemplate }: ActiveRosterTemplatesProps) => {
  const { data: activeTemplates, isLoading } = useQuery({
    queryKey: ['active-roster-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_templates')
        .select('*')
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0])
        .order('name');
      
      if (error) throw error;
      return data as RosterTemplate[];
    }
  });

  const getRepeatTypeLabel = (type: string, interval: number) => {
    switch (type) {
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `${interval} weeks`;
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Active Rosters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading rosters...</div>
        ) : activeTemplates && activeTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto p-3 flex flex-col items-start text-left"
                onClick={() => onDeployTemplate(template)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="font-medium">{template.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {getRepeatTypeLabel(template.repeat_type, template.repeat_interval)}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1 text-left">{template.description}</p>
                )}
                {template.end_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(template.end_date).toLocaleDateString()}
                  </p>
                )}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No active rosters available.</p>
            <p className="text-sm text-gray-400 mt-1">Create roster templates to see them here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveRosterTemplates;
