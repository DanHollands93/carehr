import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActiveCompanyContextType {
  activeCompanyId: string | null;
  activeCompanyName: string | null;
  setActiveCompany: (companyId: string | null, companyName?: string | null) => void;
  companies: Array<{ id: string; name: string; slug: string }> | null;
  isLoadingCompanies: boolean;
  isSuperAdmin: boolean;
}

const ActiveCompanyContext = createContext<ActiveCompanyContextType | undefined>(undefined);

export const useActiveCompany = () => {
  const context = useContext(ActiveCompanyContext);
  if (context === undefined) {
    throw new Error('useActiveCompany must be used within an ActiveCompanyProvider');
  }
  return context;
};

export const ActiveCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const isSuperAdmin = userRole === 'super_admin';
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [activeCompanyName, setActiveCompanyName] = useState<string | null>(null);

  // Fetch user's own company_id from profile
  const { data: userProfile } = useQuery({
    queryKey: ['active-company-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all companies for super admins
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['all-companies-switcher'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Set default company from user profile
  useEffect(() => {
    if (userProfile?.company_id && !activeCompanyId) {
      setActiveCompanyId(userProfile.company_id);
      // Try to find company name
      if (companies) {
        const match = companies.find(c => c.id === userProfile.company_id);
        if (match) setActiveCompanyName(match.name);
      }
    }
  }, [userProfile?.company_id, companies, activeCompanyId]);

  const setActiveCompany = useCallback((companyId: string | null, companyName?: string | null) => {
    setActiveCompanyId(companyId);
    setActiveCompanyName(companyName || null);
  }, []);

  return (
    <ActiveCompanyContext.Provider value={{
      activeCompanyId,
      activeCompanyName,
      setActiveCompany,
      companies: companies || null,
      isLoadingCompanies,
      isSuperAdmin,
    }}>
      {children}
    </ActiveCompanyContext.Provider>
  );
};
