import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileWithRole {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string | null;
}

const ImpersonateUserDialog = () => {
  const { userRole } = useAuth();
  const { startImpersonating, isImpersonating } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (open) {
      loadProfiles();
    }
  }, [open]);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, employee_id')
      .eq('active', true)
      .order('first_name');

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(p => {
    const term = search.toLowerCase();
    return (
      (p.first_name?.toLowerCase() || '').includes(term) ||
      (p.last_name?.toLowerCase() || '').includes(term) ||
      (p.email?.toLowerCase() || '').includes(term)
    );
  });

  const handleSelect = (profile: ProfileWithRole) => {
    startImpersonating({
      id: profile.id,
      email: profile.email || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
    });
    setOpen(false);
    setSearch('');
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isImpersonating ? "secondary" : "outline"} size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : filteredProfiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            ) : (
              <div className="space-y-1">
                {filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelect(profile)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImpersonateUserDialog;
