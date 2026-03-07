import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Clock, ClipboardCheck, UserCheck, ChevronRight } from 'lucide-react';
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

type CategoryKey = 'probation' | 'supervision' | 'appraisal';

const CATEGORY_CONFIG: Record<CategoryKey, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  probation: {
    label: 'Probations',
    icon: <UserCheck className="w-5 h-5" />,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  },
  supervision: {
    label: 'Supervisions',
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  },
  appraisal: {
    label: 'Appraisals',
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  },
};

const ReviewsDueWidget = () => {
  const { companyId } = useUserCompanyId();
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>(null);

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

  const getCounts = (category: CategoryKey) => {
    const items = reviews.filter(r => r.category === category);
    const overdue = items.filter(r => r.scheduled_date && r.scheduled_date < today);
    const due = items.filter(r => r.scheduled_date && r.scheduled_date >= today);
    return { overdue: overdue.length, due: due.length, items };
  };

  const getItemsForDialog = (category: CategoryKey) => {
    const items = reviews.filter(r => r.category === category);
    const overdue = items.filter(r => r.scheduled_date && r.scheduled_date < today);
    const due = items.filter(r => r.scheduled_date && r.scheduled_date >= today);
    return { overdue, due };
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const goToReview = (r: ReviewRow) => {
    navigate(`/employees?id=${r.employee_id}&tab=reviews&reviewId=${r.id}`);
    setOpenCategory(null);
  };

  if (isLoading) return null;

  const categories: CategoryKey[] = ['probation', 'supervision', 'appraisal'];

  return (
    <>
      {categories.map(cat => {
        const config = CATEGORY_CONFIG[cat];
        const counts = getCounts(cat);
        const total = counts.overdue + counts.due;
        if (total === 0) return null;

        return (
          <Card
            key={cat}
            className={`border cursor-pointer hover:shadow-md transition-shadow ${config.bgColor}`}
            onClick={() => setOpenCategory(cat)}
          >
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={config.color}>{config.icon}</div>
                  <div>
                    <p className={`font-semibold ${config.color}`}>{config.label}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm text-muted-foreground">{counts.due} due</span>
                      {counts.overdue > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" />{counts.overdue} overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Detail dialog */}
      <Dialog open={!!openCategory} onOpenChange={() => setOpenCategory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {openCategory && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {CATEGORY_CONFIG[openCategory].icon}
                  {CATEGORY_CONFIG[openCategory].label}
                </DialogTitle>
              </DialogHeader>
              {(() => {
                const { overdue, due } = getItemsForDialog(openCategory);
                return (
                  <div className="space-y-4">
                    {overdue.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Overdue ({overdue.length})
                        </h4>
                        <div className="space-y-2">
                          {overdue.map(r => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors"
                              onClick={() => goToReview(r)}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{r.review_type} · Due {formatDate(r.scheduled_date)}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="shrink-0">
                                Open <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {due.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due ({due.length})
                        </h4>
                        <div className="space-y-2">
                          {due.map(r => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                              onClick={() => goToReview(r)}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{r.review_type} · Due {formatDate(r.scheduled_date)}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="shrink-0">
                                Open <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {overdue.length === 0 && due.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No reviews pending</p>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewsDueWidget;
