import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ImpersonatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  companyName?: string;
}

interface ImpersonationContextType {
  impersonatedUser: ImpersonatedUser | null;
  isImpersonating: boolean;
  startImpersonating: (user: ImpersonatedUser) => void;
  stopImpersonating: () => void;
  effectiveUserId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

interface ImpersonationProviderProps {
  children: React.ReactNode;
  onCompanyChange?: (companyId: string | null, companyName?: string | null) => void;
}

export const ImpersonationProvider: React.FC<ImpersonationProviderProps> = ({ children, onCompanyChange }) => {
  const { user, userRole } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const canImpersonate = userRole === 'admin' || userRole === 'super_admin';

  const startImpersonating = useCallback((targetUser: ImpersonatedUser) => {
    if (!canImpersonate) return;
    setImpersonatedUser(targetUser);
    // Also switch active company when impersonating
    if (targetUser.companyId && onCompanyChange) {
      onCompanyChange(targetUser.companyId, targetUser.companyName);
    }
  }, [canImpersonate, onCompanyChange]);

  const stopImpersonating = useCallback(() => {
    setImpersonatedUser(null);
    // Don't auto-switch company back - let super admin manually switch if needed
  }, []);

  const isImpersonating = !!impersonatedUser && canImpersonate;
  const effectiveUserId = isImpersonating ? impersonatedUser.id : (user?.id ?? null);

  return (
    <ImpersonationContext.Provider value={{
      impersonatedUser,
      isImpersonating,
      startImpersonating,
      stopImpersonating,
      effectiveUserId,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
};
