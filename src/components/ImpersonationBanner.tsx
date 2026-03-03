import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedUser, stopImpersonating } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between z-50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="w-4 h-4" />
        <span>
          Viewing as: <strong>{impersonatedUser.firstName} {impersonatedUser.lastName}</strong> ({impersonatedUser.email})
          {(impersonatedUser as any).companyName && (
            <span className="ml-1">• {(impersonatedUser as any).companyName}</span>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonating}
        className="text-destructive-foreground hover:bg-destructive/80 h-7 px-2 gap-1"
      >
        <X className="w-3 h-3" />
        Stop
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
