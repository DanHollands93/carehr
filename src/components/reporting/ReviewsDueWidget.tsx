import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';
import { useNavigate } from 'react-router-dom';

interface ReviewRow {
  id: string;
  review_type: string;
  category: string;
  status: string;
  scheduled_date: string | null;
  employee_id: string;
  employees: { first_name: string; last_name: string } | null;
}

const ReviewsDueWidget = () => {
  const { companyId } = useUserCompanyId();
  const navigate = useNavigate();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['dashboard-reviews-due', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_reviews')
        .select('id, review_type, category, status, scheduled_date, employee_id, employees(first_name, last_name)')
        .eq('company_id', companyId!)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReviewRow[];
    },
    enabled: !!companyId,
  });

  const today = new Date().toISOString().split('T')[0];

  const overdue = reviews.filter(r => r.scheduled_date && r.scheduled_date < today);
  const dueSoon = reviews.filter(r => {
    if (!r.scheduled_date || r.scheduled_date < today) return false;
    const diff = (new Date(r.scheduled_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 14;
  });
  const upcoming = reviews.filter(r => {
    if (!r.scheduled_date || r.scheduled_date < today) return false;
    const diff = (new Date(r.scheduled_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 14;
  });

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      probation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      supervision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      appraisal: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    };
    return map[cat] || '';
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); } catch { return d; }
  };

  const ReviewList = ({ items, emptyText }: { items: ReviewRow[]; emptyText: string }) => {
    if (items.length === 0) return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
    return (
      <div className="space-y-2">
        {items.slice(0, 5).map(r => (
          <div
            key={r.id}
            className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/employees?id=${r.employee_id}`)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">
                {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown'}
              </span>
              <Badge variant="outline" className={`text-xs shrink-0 ${getCategoryColor(r.category)}`}>
                {r.category.charAt(0).toUpperCase() + r.category.slice(1)}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(r.scheduled_date)}</span>
          </div>
        ))}
        {items.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">+{items.length - 5} more</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading reviews...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="w-5 h-5" />
          Reviews &amp; Supervisions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          {overdue.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />{overdue.length} Overdue
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />{dueSoon.length} Due Soon
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Calendar className="w-3 h-3" />{upcoming.length} Upcoming
          </Badge>
        </div>

        {/* Overdue section */}
        {overdue.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-destructive mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Overdue
            </h4>
            <ReviewList items={overdue} emptyText="" />
          </div>
        )}

        {/* Due soon */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Due within 14 days</h4>
          <ReviewList items={dueSoon} emptyText="No reviews due soon" />
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Upcoming</h4>
            <ReviewList items={upcoming} emptyText="No upcoming reviews" />
          </div>
        )}

        {reviews.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">All reviews up to date</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsDueWidget;
