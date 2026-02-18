import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ImpersonatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const isAdmin = userRole === 'admin';

  const startImpersonating = useCallback((targetUser: ImpersonatedUser) => {
    if (!isAdmin) return;
    setImpersonatedUser(targetUser);
  }, [isAdmin]);

  const stopImpersonating = useCallback(() => {
    setImpersonatedUser(null);
  }, []);

  const isImpersonating = !!impersonatedUser && isAdmin;
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
