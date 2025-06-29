
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';

const MobileDefaultRedirect = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasPermission, loading } = usePermissions();

  useEffect(() => {
    // Only redirect on mobile and if user has permission to view staff shifts
    if (isMobile && !loading && hasPermission('view_staff_shifts')) {
      // Check if we're on the root dashboard page
      if (window.location.pathname === '/') {
        navigate('/staff/shifts', { replace: true });
      }
    }
  }, [isMobile, loading, hasPermission, navigate]);

  return <>{children}</>;
};

export default MobileDefaultRedirect;
