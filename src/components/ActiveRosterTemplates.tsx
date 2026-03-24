
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useUserLocationAccess } from "@/hooks/useUserLocationAccess";
import { cn } from "@/lib/utils";

interface RosterTemplate {
  id: string;
  name: string;
  description: string;
  repeat_type: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  repeat_interval: number;
  end_date: string | null;
  is_active: boolean;
  location: string | null;
}

interface ActiveRosterTemplatesProps {
  onSelectRoster: (template: RosterTemplate) => void;
}

const ActiveRosterTemplates = ({ onSelectRoster }: ActiveRosterTemplatesProps) => {
  const { companyId } = useUserCompanyId();
  const { filterByLocation } = useUserLocationAccess();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: activeTemplates, isLoading } = useQuery({
    queryKey: ['active-roster-templates', companyId],
    queryFn: async () => {
      let query = supabase
        .from('roster_templates')
        .select('*')
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0])
        .order('name');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data as RosterTemplate[];
    },
    enabled: !!companyId
  });

  // Filter templates by user's location access
  const filteredTemplates = filterByLocation(activeTemplates || []);

  const getRepeatTypeLabel = (type: string, interval: number) => {
    switch (type) {
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `${interval} weeks`;
      default: return type;
    }
  };

  const handleTemplateClick = (template: RosterTemplate) => {
    console.log('Template clicked:', template);
    setSelectedId(template.id);
    setIsExpanded(false);
    onSelectRoster(template);
  };

  const selectedTemplate = filteredTemplates?.find(t => t.id === selectedId);

  return (
    <Card className="overflow-hidden">
      {/* Collapsed bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Active Rosters</span>
          {selectedTemplate && !isExpanded && (
            <Badge variant="secondary" className="ml-1 animate-fade-in">
              {selectedTemplate.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredTemplates && (
            <Badge variant="outline" className="text-xs">
              {filteredTemplates.length}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0 pb-3 px-4">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Loading rosters...</div>
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedId === template.id ? "default" : "outline"}
                    className={cn(
                      "h-auto p-3 flex flex-col items-start text-left transition-all duration-200",
                      selectedId === template.id && "ring-2 ring-primary/20"
                    )}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium">{template.name}</div>
                      <Badge
                        variant={selectedId === template.id ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {getRepeatTypeLabel(template.repeat_type, template.repeat_interval)}
                      </Badge>
                    </div>
                    {template.end_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(template.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No active rosters available.</p>
                <p className="text-xs text-muted-foreground mt-1">Create roster templates to see them here.</p>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default ActiveRosterTemplates;
