
import { useActiveCompany } from "@/contexts/ActiveCompanyContext";

export const useUserCompanyId = () => {
  const { activeCompanyId, isLoadingCompanies } = useActiveCompany();

  return { companyId: activeCompanyId, isLoading: isLoadingCompanies };
};
