
import { useState, useEffect } from "react";
import { processService, MenuSet } from "@/services/processService";
import { useAuth } from "@/contexts/AuthContext";

export const useMenuSets = () => {
  const [menuSets, setMenuSets] = useState<MenuSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole } = useAuth();

  useEffect(() => {
    const loadMenuSets = async () => {
      try {
        setLoading(true);
        const sets = await processService.getMenuSets();
        
        // Filter menu sets based on user role
        const filteredSets = sets.filter(set => {
          if (userRole === 'hr_user') {
            // HR users get employee self-service menu
            return set.name.toLowerCase().includes('employee');
          }
          return true;
        });
        
        setMenuSets(filteredSets);
      } catch (err) {
        setError('Failed to load menu sets');
        console.error('Error loading menu sets:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      loadMenuSets();
    }
  }, [userRole]);

  return { menuSets, loading, error };
};
